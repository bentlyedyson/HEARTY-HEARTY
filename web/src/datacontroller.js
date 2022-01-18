import {
  Color3,
  DynamicTexture,
  Engine,
  MeshBuilder,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { jsonHtml } from "./util";

// Waveform variables
const resol = 500;
const xPos = -120; // X Offset
const yPos = -100; // Y Offset
const waveformDist = 30; // Distance between each waveform
const waveformMult = 15; // Multiply the waveform by this amount

const sensorZ = 100;

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
];

class DataController {
  constructor(scene) {
    this.host = "https://heartyapi.jasoncoding.com/";
    this.metadata = {};
    this.waveform = [];
    this.maxData = 21837;
    this.fetching = false;
    this.scene = scene;
    this.curIndex = 0;

    this.randomFetch();

    document.getElementById("randomize").addEventListener("click", () => {
      if (!this.fetching) {
        document.getElementById("display").innerHTML = "";
        this.randomFetch();
      }
    });

    this.lineMeshes = [];
    this._resetLineMeshes();

    this._waveformAnnotation();

    scene.registerBeforeRender(this._animationLoop.bind(this));
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
    const planeMat = new StandardMaterial("waveformMat", scene);
    planeMat.diffuseTexture = planeTexture;
    planeDisplay.material = planeMat;
    const ctx = planeTexture.getContext();

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
  }

  _animationLoop() {
    const { waveform, curIndex } = this;
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
            ? yPos + waveYPos + waveformDist + 30
            : yPos + waveYPos + curWave[waveI] * waveformMult,
          i
        );
      }
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
    this.linesystem = MeshBuilder.CreateLineSystem(
      "waveforms",
      {
        lines: this.lineMeshes,
        updatable: true,
      },
      this.scene
    );
  }

  _doneFetchData() {
    document.getElementById("loading").classList.add("hide");
    document.getElementById("display").innerHTML = jsonHtml.prettyPrint(
      this.metadata
    );
  }

  _doneFetchWaveform() {}

  fetchData(num) {
    this.fetching = true;
    document.getElementById("loading").classList.remove("hide");

    // How many requests have been completed
    fetch(`${this.host}data/${num}`)
      .then((x) => x.json())
      .then((x) => {
        this.metadata = x;
        this._doneFetchData();

        fetch(`${this.host}waveform/${num}`)
          .then((x) => x.json())
          .then((x) => {
            this.waveform = x;
            this.fetching = false;
            this._doneFetchWaveform();
          });
      });
  }

  randomFetch() {
    // this.fetchData(randomRange(0, this.maxData));
    this.fetchData(5000);
  }
}

export default DataController;
