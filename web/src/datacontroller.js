import {
  ArcRotateCamera,
  Engine,
  Scene,
  Vector3,
  Layer,
  MeshBuilder,
} from "@babylonjs/core";
import { randomRange, jsonHtml } from "./util";

const resol = 100;

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

    scene.registerBeforeRender(this._animationLoop.bind(this));
  }

  _animationLoop() {
    // this.curIndex++;
    // for (let j = 0; i < 12; j++) {
    //   for (let i = 0; i < resol; i++) {
    //     this.lineMeshes[j][i] = new Vector3()
    //   }
    // }
    // this.linesystem = MeshBuilder.CreateLineSystem("waveforms", {
    //   lines: this.lineMeshes,
    //   instance: this.linesystem,
    // });
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
    this.fetchData(randomRange(0, this.maxData));
  }
}

export default DataController;
