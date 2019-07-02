#include <OneWire.h>
#include <SoftwareSerial.h>
#include <Tiny4kOLED.h>


// both temp sensors connected to attiny85 pin 6 (PB1)
#define ONE_WIRE_BUS 1
// pin 2 (PB3)
#define RxD 3
// pin 3 (PB4)
#define TxD 4
#define STARTCONVO 0x44
#define READTEMP 0xBE
#define BLUETOOTH_NAME "tempSensor"


OneWire oneWire(ONE_WIRE_BUS);
SoftwareSerial serial(RxD, TxD);
byte addr[8];
byte data[9];
byte msg[20];
int16_t temp16;
float temp;


void setup() {
  delay(1000); // wait for oled to get ready?

  // oled setup
  oled.begin();
  oled.setFont(FONT8X16);
  oled.clear();
  oled.switchRenderFrame();
  oled.on();

  // hm10 bluetooth setup
  serial.begin(9600);
  serial.print("AT+NAME" + BLUETOOTH_NAME);
}

void loop() {
  // ask all sensors for temps
  oneWire.reset();
  oneWire.skip();
  oneWire.write(STARTCONVO, 0); // start convo, no parasite

  // wait for calculation
  // could alternatively check for value by probing read_bit()
  //unsigned long now = millis();
  // calcMS = {9: 94, 10: 188, 11: 375, default: 750};
  //while (oneWire.read_bit() != 1 && (millis() - calcMS < now));
  delay(750);
  oled.clear(); // clear the buffer (not displayed, yet)

  int i = 0;
  int msgPos = 0;
  oneWire.reset_search();
  while (oneWire.search(addr)) {
    // validate address
    if (OneWire::crc8(addr, 7) == addr[7]) {
      oneWire.reset();
      oneWire.select(addr);
      oneWire.write(READTEMP);  // read buf
      for (uint8_t k = 0; k < 9; k++) {
        data[k] = oneWire.read();
      }
      // validate response
      if (OneWire::crc8(data, 8) == data[8]) {
        temp16 = (((int16_t) data[1]) << 11) | (((int16_t) data[0]) << 3);
        // temp = (float) temp16 * 0.0078125; // c
        temp = ((float) temp16 * 0.0140625) + 32; // f
      } else {
        temp16 = 0;
        temp = 0;
      }
      for (int j = 2; j < 8; j++) {
        msg[msgPos++] = addr[j];
      }
      msg[msgPos++] = (byte) (temp16 >> 8);
      msg[msgPos++] = (byte) temp16;
      
      oled.setCursor(64 * i, 2);
      oled.print(temp);
      
      msgPos += 2;
      i++;
    }
  }
  for (byte j = 0; j < 20; j++) {
    serial.write(msg[j]);
  }
  oled.switchFrame(); // render temps

  // could alternatively tell chip to sleep
  delay(1000);
}
