import {
  Color3,
  DynamicTexture,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { jsonHtml, lerp, randomRange } from "./util";

// Waveform variables
const resol = 500;
const xPos = -120; // X Offset
const yPos = -100; // Y Offset
const waveformDist = 30; // Distance between each waveform
const waveformMult = 15; // Multiply the waveform by this amount

const sensorZ = 100;

const chosenWaveform = 0;

const waveName = [
  "I",
  "II",
  "III",
  "AVR",
  "AVL",
  "AVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
].reverse();

const superClass = {
  NORM: "Normal ECG",
  MI: "Myocardial Infarction",
  STTC: "ST/T Change",
  CD: "Conduction Disturbance",
  HYP: "Hypertrophy",
};

class DataController {
  constructor(scene, heart) {
    this.host = "https://heartyapi.jasoncoding.com/";
    this.metadata = {};
    this.waveform = [];
    this.maxData = 21837;
    this.fetching = false;
    this.scene = scene;
    this.curIndex = 0;
    this.linesystem;

    this.beatThreshold = 0;
    this.superTexture;

    this.heart = heart;
    this.isBeating = false;

    this.randomFetch();

    this.lineMeshes = [];

    this.sensorMat;

    // If the port is still reading
    this.predictMenu = false;
    this.reading = false; // WHether we are reading or not
    this.readWaveform = []; // Waveform result
    this.readStringBuf = ""; // String reading buffer
    this.readLine;
    this.readLinePoints;

    this._resetLineMeshes();
    this._waveformAnnotation();
    this._registerButtons();
    this._initializePort(); // Initialize port for detection

    scene.registerBeforeRender(this._animationLoop.bind(this));
  }

  _initializePort() {
    document.getElementById("predict").addEventListener("click", () => {
      if (!("serial" in navigator))
        return alert(
          "Serial API is not supported in this browser! Try Chrome."
        );

      if (this.predictMenu) {
        this.predictMenu = false;
        // Do stuff to go back to normal
        this.readLine.dispose();
        this.randomFetch();
        return;
      }

      this.predictMenu = true;

      // Toggle the view
      this._resetData();
      this.readWaveform = [];

      // Create lines
      const points = [];
      for (let i = 0; i < 1000; i++) {
        points.push(new Vector3(xPos, yPos + -2 * waveformDist, -150));
      }
      this.readLinePoints = points;
      this.readLine = MeshBuilder.CreateLines("readWave", {
        points: this.readLinePoints,
        updatable: true,
      });

      // Open serial port
      navigator.serial.requestPort().then((port) => {
        port.open({ baudRate: 115200 }).then(() => {
          const textDecoder = new TextDecoderStream();
          const readableStreamClosed = port.readable.pipeTo(
            textDecoder.writable
          );
          const reader = textDecoder.readable.getReader();
          this.reading = true;

          // Read loop
          const that = this;
          (function loop() {
            if (!that.reading) return;

            reader.read().then(({ value, done }) => {
              if (done) {
                reader.releaseLock();
                that.reading = false;
              } else {
                // Do reading here
                that.readStringBuf += value;
                const buf = that.readStringBuf;

                // Parsing
                if (buf.includes("\n")) {
                  const split = buf.split("\n");
                  const dat = split.shift();
                  that.readStringBuf = split.join("\n");

                  // See if it can be jsonified
                  try {
                    const { res } = JSON.parse(dat);
                    if (res !== "!" && res !== undefined)
                      that.readWaveform.push(res * 7);
                    if (that.readWaveform.length >= 1000) {
                      console.log("Finished reading.");
                      that.reading = false;
                      // TODO: Lol error here
                      reader
                        .cancel()
                        .then(() => reader.releaseLock())
                        .then(() => {
                          port.close();
                        });
                      if (confirm("Do you want to predict this data?")) {
                        that._predictData();
                      }
                    }
                  } catch {}
                }
                if (that.reading) loop();
              }
            });
          })();
        });
      });
    });
  }

  _predictData() {
    console.log("Bruh lol");
    fetch(this.host + "predict", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ waveform: this.readWaveform }),
    })
      .then((x) => x.json())
      .then((data) => {
        alert(`['CD', 'HYP', 'MI', 'NORM', 'STTC']\n${data}`);
      });
  }

  _registerButtons() {
    document.getElementById("randomize").addEventListener("click", () => {
      if (!this.fetching) {
        document.getElementById("display").innerHTML = "";
        this.randomFetch();
      } else {
        alert("I am still fetching!");
      }
    });

    document.getElementById("viewraw").addEventListener("click", () => {
      const style = document.getElementById("display").classList;
      if (style.contains("display-full")) {
        style.remove("display-full");
      } else {
        style.add("display-full");
      }
    });

    document.getElementById("getdata").addEventListener("click", () => {
      if (!this.fetching) {
        const num = parseInt(document.getElementById("customdata").value, 10);
        if (!num || num < 1 || num > 21837) return alert("Invalid dataset!");
        this.fetchData(num);
      } else {
        alert("I am still fetching!");
      }
    });
  }

  _waveformAnnotation() {
    const { scene } = this;

    const sensorHeight = waveformDist * 12 + 50;
    this.sensor = MeshBuilder.CreateBox(
      "sensor",
      {
        width: 5,
        height: sensorHeight,
        depth: 5,
      },
      scene
    );

    const sensorMat = new StandardMaterial("sensorMat", scene);
    sensorMat.alpha = 0.6;
    sensorMat.diffuseColor = new Color3(1.0, 0.0, 0.0);
    this.sensor.material = sensorMat;
    this.sensor.position = new Vector3(
      xPos,
      yPos + sensorHeight / 2 - 50,
      sensorZ
    );

    this.sensorMat = sensorMat;

    // Plane for waveform annotation
    const planeDisplay = MeshBuilder.CreatePlane(
      "waveformPlane",
      { width: 100, height: sensorHeight },
      scene
    );
    planeDisplay.rotation.y = -Math.PI / 2;
    planeDisplay.position = new Vector3(
      xPos - 1,
      yPos + sensorHeight / 2 - 50,
      sensorZ + 50
    );

    const planeTexture = new DynamicTexture(
      "waveformTexture",
      { width: 100, height: sensorHeight },
      scene,
      true
    );
    planeTexture.hasAlpha = true;

    const planeMat = new StandardMaterial("waveformMat", scene);
    planeMat.diffuseTexture = planeTexture;
    planeMat.specularColor = new Color3(0, 0, 0);
    planeMat.emissiveColor = new Color3(0, 0, 0);
    planeDisplay.material = planeMat;

    for (let i = 0; i < waveName.length; i++) {
      planeTexture.drawText(
        waveName[i],
        10,
        (i + 1) * waveformDist,
        "bold 20px monospace",
        "white",
        "transparent",
        true,
        true
      );
    }

    // Plane for Additional info
    const superPlane = MeshBuilder.CreatePlane(
      "waveformPlane",
      { width: 192, height: 256 },
      scene
    );
    superPlane.rotation.y = -Math.PI;
    superPlane.position = new Vector3(170, 0, 0);

    const superTexture = new DynamicTexture(
      "waveformTexture",
      { width: 192, height: 256 },
      scene,
      true
    );
    superTexture.hasAlpha = true;

    const superMat = new StandardMaterial("waveformMat", scene);
    superMat.diffuseTexture = superTexture;
    superMat.specularColor = new Color3(0, 0, 0);
    superMat.emissiveColor = new Color3(0, 0, 0);
    superPlane.material = superMat;

    this.superTexture = superTexture;
    this.superMat = superMat;
  }

  _redrawSuper() {
    if (!this.superTexture) return;

    this.superTexture.dispose();

    const superTexture = new DynamicTexture(
      "waveformTexture",
      { width: 192, height: 256 },
      this.scene,
      true
    );
    superTexture.hasAlpha = true;
    this.superTexture = superTexture;
    this.superMat.diffuseTexture = superTexture;

    // Draw text
    const { ecg_id, patient_id, age, sex, super_diag } = this.metadata;

    let info = `ECG ID: ${ecg_id}\nPatient: ${patient_id}\nAge: ${age}\nSex: ${
      sex == 0 ? "Male" : "Female"
    }\nSuper Diagnostic:`;
    info = info.split("\n");
    info = info.concat(super_diag.map((x) => superClass[x]));

    let i = 0;
    for (let tex of info) {
      this.superTexture.drawText(
        tex,
        10,
        (i + 1) * 18,
        "bold 15px monospace",
        "white",
        "transparent",
        true,
        true
      );
      i++;
    }
  }

  _animationLoop() {
    const { waveform, curIndex, predictMenu, readWaveform } = this;

    // Do predictMenu draw
    if (predictMenu) {
      const y = yPos + -2 * waveformDist;

      for (let i = 0; i < readWaveform.length; i++) {
        this.readLinePoints[i] = new Vector3(
          xPos,
          y + readWaveform[i] * 20,
          i - 150
        );
      }

      this.readLine = MeshBuilder.CreateLines("readWave", {
        instance: this.readLine,
        points: this.readLinePoints,
        updatable: true,
      });

      return;
    }

    if (waveform.length === 0) return;

    for (let j = 0; j < 12; j++) {
      const curWave = waveform[j];
      const curLineMesh = this.lineMeshes[j];
      const waveYPos = j * waveformDist;

      for (let i = 0; i < resol; i++) {
        let passLine = curIndex + i === 1000;
        let waveI = (curIndex + i) % 1000;

        curLineMesh[i] = new Vector3(
          xPos,
          passLine
            ? yPos + waveYPos + waveformDist + 50
            : yPos + waveYPos + curWave[waveI] * waveformMult,
          i
        );
      }
    }

    // Trigger beat
    if (
      waveform[chosenWaveform][(curIndex + sensorZ) % 1000] >=
      this.beatThreshold
    ) {
      this.sensorMat.diffuseColor = new Color3(0, 1, 0);
      if (!this.isBeating) {
        this.heart.beatHeart();
      }
      this.isBeating = true;
    } else {
      this.sensorMat.diffuseColor = new Color3(1, 0, 0);
      this.isBeating = false;
    }

    this.linesystem = MeshBuilder.CreateLineSystem("waveforms", {
      lines: this.lineMeshes,
      instance: this.linesystem,
    });

    if (this.curIndex > 1000) {
      this.curIndex = 0;
    } else {
      this.curIndex++;
    }
  }

  _resetLineMeshes() {
    this.lineMeshes = [];
    for (let i = 0; i < 12; i++) {
      const arr = [];
      for (let i = 0; i < resol; i++) {
        arr.push(new Vector3.Zero());
      }
      this.lineMeshes.push(arr);
    }
    if (!this.linesystem) {
      this.linesystem = MeshBuilder.CreateLineSystem(
        "waveforms",
        {
          lines: this.lineMeshes,
          updatable: true,
        },
        this.scene
      );
    } else {
      this.linesystem = MeshBuilder.CreateLineSystem("waveforms", {
        lines: this.lineMeshes,
        instance: this.linesystem,
      });
    }
  }

  _doneFetchData() {
    document.getElementById("loading").classList.add("hide");
    document.getElementById("display").innerHTML = jsonHtml.prettyPrint(
      this.metadata
    );

    this._redrawSuper();
  }

  _doneFetchWaveform() {
    // Select which waveform we want to use to detect the beats
    const beater = this.waveform[chosenWaveform];
    const avg = beater.reduce((a, b) => a + b) / beater.length;
    const max = Math.max(...beater);

    // Interpolate both points. 0.5 we will use as threshold for heart beat
    this.beatThreshold = lerp(avg, max, 0.5);
  }

  _resetData() {
    this.waveform = [];
    this.metadata = {};
    this._resetLineMeshes();
    document.getElementById("display").innerHTML = "";
    if (this.superTexture !== undefined) this.superTexture.dispose();
  }

  fetchData(num) {
    this.fetching = true;
    document.getElementById("loading").classList.remove("hide");

    // Reset data
    this._resetData();

    // How many requests have been completed
    fetch(`${this.host}data/${num}`)
      .then((x) => x.json())
      .then((x) => {
        this.metadata = x;
        this.fetching = false;
        this._doneFetchData();

        fetch(`${this.host}waveform/${num}`)
          .then((x) => x.json())
          .then((x) => {
            this.waveform = x;
            this._doneFetchWaveform();
          });
      });
  }

  randomFetch() {
    this.fetchData(randomRange(0, this.maxData));
  }
}

export default DataController;
