#include <Arduino.h>
#define SAMPLING_RATE 100 // In hertz, send sampling rate of the machine
#define LOPIN1 16
#define LOPIN2 17
#define NAN -500.0

// Time reference to send messages depending of the sampling rate
uint32_t time_send = 0;

// Counter to keep track of the time
uint32_t counter = 0;

// Sends write data to the serial port
void send_signal(float res=NAN) {
  Serial.write("{\"time\":");
  Serial.print(counter);
  Serial.write(",\"res\":\"");
  if (res == NAN) Serial.write("!"); else Serial.print(res, 6);
  Serial.write("\"}\n");
}

void setup() {
  // LO- and LO+ pins
  pinMode(LOPIN1, INPUT);
  pinMode(LOPIN2, INPUT);
  
  Serial.begin(115200);
}

void loop() {
  
  if (millis() >= time_send) {

    if (digitalRead(LOPIN1)|| digitalRead(LOPIN2)) {
      send_signal(); // Send invalid signal
    } else {
      // Send data through serial
      Serial.println(1);
      float res = analogRead(A0) / 1024.0; // / 675.0; // 675 is 3.3v
      send_signal(res);
    }

    counter++;
    // Set next send
    time_send += 1000/SAMPLING_RATE;
  }
}
