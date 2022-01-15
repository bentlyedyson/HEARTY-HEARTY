import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, SceneLoader, ImportMeshAsync, PointLight, CreateScene } from "@babylonjs/core";

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

        // load 3d model
        SceneLoader.ImportMeshAsync("", "./", "heart.babylon", scene);

        const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);

        const light = new HemisphericLight("light", new Vector3(500, 500, 5000));
        light.intensity = 100;

        const light1 = new PointLight("light", new Vector3(0, 0, -50), scene);
        light1.intensity = 600000 ; 

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