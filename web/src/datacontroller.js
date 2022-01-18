import {
  ArcRotateCamera,
  Engine,
  Scene,
  Vector3,
  Layer,
} from "@babylonjs/core";

class DataController {
  constructor() {
    this.host = "https://heartyapi.jasoncoding.com/";
    this.metadata = {};
    this.waveform = [];

    this.fetchData(50);
  }

  _doneFetchData() {
    console.log(this.metadata);
    console.log(this.waveform);
  }

  fetchData(num) {
    // // How many requests have been completed
    let completes = 0;
    fetch(`${this.host}data/${num}`)
      .then((x) => x.json())
      .then((x) => {
        this.metadata = x;
        completes++;
        if (completes >= 2) this._doneFetchData();
      });
    fetch(`${this.host}waveform/${num}`)
      .then((x) => x.json())
      .then((x) => {
        this.waveform = x;
        completes++;
        if (completes >= 2) this._doneFetchData();
      });
  }
}

export default DataController;
