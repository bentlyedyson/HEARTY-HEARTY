import {
  ArcRotateCamera,
  Engine,
  Scene,
  Vector3,
  Layer,
} from "@babylonjs/core";
import { randomRange, jsonHtml } from "./util";

class DataController {
  constructor() {
    this.host = "https://heartyapi.jasoncoding.com/";
    this.metadata = {};
    this.waveform = [];
    this.maxData = 21837;
    this.fetching = false;

    this.randomFetch();

    document.getElementById("randomize").addEventListener("click", () => {
      if (!this.fetching) {
        document.getElementById("display").innerHTML = "";
        this.randomFetch();
      }
    });
  }

  _doneFetchData() {
    document.getElementById("loading").classList.remove("hide");
    document.getElementById("display").innerHTML = jsonHtml.prettyPrint(
      this.metadata
    );
  }

  _doneFetchWaveform() {}

  fetchData(num) {
    this.fetching = true;
    document.getElementById("loading").classList.add("hide");

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
