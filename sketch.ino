#include <OneWire.h>
#include <SoftwareSerial.h>
#include <Tiny4kOLED.h>

#define ONE_WIRE_BUS 1
#define RxD 3
#define TxD 4
#define EBADTEMP -999
#define BROADCAST_NAME "tempSensor"

OneWire oneWire(ONE_WIRE_BUS);
SoftwareSerial serial(RxD, TxD);
byte addr[8];
byte data[9];
byte msg[20];
int16_t temp16;
float temp;


void setup() {
  delay(1000);
  oled.begin();
  oled.setFont(FONT8X16);
  oled.clear();
  oled.switchRenderFrame();
  oled.on();

  serial.begin(9600);
  serial.print("AT+NAME" + BROADCAST_NAME);
}

void loop() {
  // request temperatures
  oneWire.reset();
  oneWire.skip();
  oneWire.write(0x44, 0); // start convo, no parasite

  // allow temps to be calculated
  delay(750); // probably too much time
  oled.clear(); // temps in same position, probabaly unnecessary

  oneWire.reset_search();

  int i = 0;
  int offset = 0;
  // addr value updated by search
  while (oneWire.search(addr)) {
    // is this a valid address?
    if (OneWire::crc8(addr, 7) == addr[7]) {
      oled.setCursor(64 * i, 2);
      oneWire.reset();
      oneWire.select(addr);
      oneWire.write(0xBE);
      for (uint8_t k = 0; k < 9; k++) {
        data[k] = oneWire.read();
      }
      if (OneWire::crc8(data, 8) == data[8]) {
        temp16 = (((int16_t) data[1]) << 11) | (((int16_t) data[0]) << 3);
        // temp = (float) temp16 * 0.0078125; // c
        temp = ((float) temp16 * 0.0140625) + 32; // f
      } else {
        temp16 = 0;
        temp = 0;
      }
      for (int j = 2; j < 8; j++) {
        msg[offset++] = addr[j];
      }
      msg[offset++] = (byte) temp16 >> 8;
      msg[offset++] = (byte) temp16;

      offset += 2;
      oled.print(temp);
      i++;
    }
  }
  // service characteristic value keeps last 20 bytes
  for (byte j = 0; j < 20; j++) {
    serial.write(msg[j]);
  }
  oled.switchFrame(); // swap display buffers
  delay(1000);
}
