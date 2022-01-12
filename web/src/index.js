import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";

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

      const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
      camera.attachControl(canvas, true);
      const light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    
    //3d load 
    BABYLON.SceneLoader.ImportMeshAsync("", "", "heart.babylon");
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(500, 500, 5000));
        light.intensity = 100;
    
        const light2 = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 0, -50), scene);
        light2.intensity = 600000 ; 
        scene.debugLayer.show();
    
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