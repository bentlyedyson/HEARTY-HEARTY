import {
  ArcRotateCamera,
  Engine,
  Scene,
  Vector3,
  Layer,
} from "@babylonjs/core";
import { randomRange } from "./util";

class DataController {
  constructor() {
    this.host = "https://heartyapi.jasoncoding.com/";
    this.metadata = {};
    this.waveform = [];
    this.maxData = 21837;
    this.fetching = false;

    this.randomFetch();
  }

  _doneFetchData() {
    this.fetching = false;
  }

  fetchData(num) {
    this.fetching = true;

    // How many requests have been completed
    let completes = 0;
    fetch(`${this.host}data/${num}`)
      .then((x) => x.json())
      .then((x) => {
        this.metadata = x;
        fetch(`${this.host}waveform/${num}`)
          .then((x) => x.json())
          .then((x) => {
            this.waveform = x;
            this._doneFetchData();
          });
      });
  }

  randomFetch() {
    this.fetchData(randomRange(0, this.maxData));
  }
}

export default DataController;
