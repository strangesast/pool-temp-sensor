/*
    This sketch sends a string to a TCP server, and prints a one-line response.
    You must run a TCP server in your local network.
    For example, on Linux you can use this command: nc -v -l 3000
*/
#include <OneWire.h>
#include <DallasTemperature.h>

// Data wire is plugged into port 2 on the Arduino
#define ONE_WIRE_BUS 4

// Setup a oneWire instance to communicate with any OneWire devices (not just Maxim/Dallas temperature ICs)
OneWire oneWire(ONE_WIRE_BUS);

// Pass our oneWire reference to Dallas Temperature. 
DallasTemperature sensors(&oneWire);
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#ifndef STASSID
#define STASSID "zagrobelny"
#define STAPSK  "bridget1"
#endif

#define redLED D4
#define greLED D5

const char* ssid     = STASSID;
const char* password = STAPSK;

const char* host = "192.168.86.33";
const uint16_t port = 3000;

ESP8266WiFiMulti WiFiMulti;

void setup() {
  pinMode(redLED, OUTPUT);
  pinMode(greLED, OUTPUT);

  Serial.begin(115200);
  
  // We start by connecting to a WiFi network
  WiFi.mode(WIFI_STA);
  WiFiMulti.addAP(ssid, password);

  Serial.println();
  Serial.println();
  Serial.print("Wait for WiFi... ");

  while (WiFiMulti.run() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  delay(500);
}


void loop() {
  Serial.print("connecting to ");
  Serial.print(host);
  Serial.print(':');
  Serial.println(port);

  // Use WiFiClient class to create TCP connections
  WiFiClient client;

  if (!client.connect(host, port)) {
    setLEDs(false, false);
    Serial.println("connection failed");
    Serial.println("wait 5 sec...");
    delay(5000);
    return;
  }

  
  getMeasurements(client);

  client.stop();
  //delay(5000);
}

void getMeasurements(WiFiClient client) {
  sensors.begin();

  sensors.requestTemperatures();

  uint8_t deviceCount = sensors.getDeviceCount();
  Serial.print("device count: ");
  Serial.println(deviceCount);
  setLEDs(true, deviceCount > 0);
  uint8_t deviceAddress;
  int16_t temp;

  for (uint8_t i = 0; i < deviceCount; i++) {
    bool gotAddress = sensors.getAddress(&deviceAddress, i);
    if (gotAddress) {
      temp = sensors.getTemp(&deviceAddress);
      client.print(i);
      client.print(",");
      client.print(deviceAddress);
      client.print(",");
      client.println(temp);
    }
  }
}

void setLEDs(bool con, bool temp) {
  if (con) {
    if (temp) {  
      digitalWrite(redLED, LOW);
    } else {
      digitalWrite(redLED, HIGH);  
    }
    digitalWrite(greLED, HIGH);
  } else {
    digitalWrite(redLED, HIGH);
    digitalWrite(greLED, LOW);
  }
}
