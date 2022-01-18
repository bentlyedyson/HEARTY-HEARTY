import { ArcRotateCamera, Engine, Scene, Vector3, Layer } from "@babylonjs/core";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import Heart from "./heart";

class App {
  constructor() {
    // create the canvas html element and attach it to the webpage
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "gameCanvas";
    document.body.appendChild(canvas);


    // initialize babylon scene and engine
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const layer = new Layer('','black_grid.jpg',scene, true)

    const heart = new Heart(scene);

    const camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 6,
      Math.PI / 2,
      500,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);

      // hide/show the Inspector    
      window.addEventListener("keydown", (ev) => {
          // Shift+Ctrl+Alt+I
          if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
              if (scene.debugLayer.isVisible()) {
                  scene.debugLayer.hide();
              } else {
                  scene.debugLayer.show();
              }
          }
      });

    // run the main render loop
    engine.runRenderLoop(() => {
      scene.render();
    });
  }
}
new App();
