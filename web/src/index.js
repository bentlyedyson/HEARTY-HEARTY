import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  SceneLoader,
  ImportMeshAsync,
  PointLight,
  CreateScene,
  Button,
  CreateSimpleButton,
} from "@babylonjs/core";
import { bayerDitherFunctions } from "@babylonjs/core/Shaders/ShadersInclude/bayerDitherFunctions";

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
    function heart() {
      SceneLoader.ImportMesh("", "./", "heart.babylon", scene);

      const light3 = new HemisphericLight(
        "light",
        new Vector3(500, 500, 5000),
        scene
      );
      light3.intensity = 100;

      const light4 = new PointLight("light", new Vector3(50, 50, -200), scene);
      light4.intensity = 600000;

      const light5 = new PointLight("light", new Vector3(50, 50, -200), scene);
      light5.intensity = 600000;
      var scale = true;
    }

    function heart1() {
      SceneLoader.ImportMesh(
        "",
        "./",
        "heart_animation.babylon",
        scene,
        (meshes) => {
          const light = new HemisphericLight(
            "light",
            new Vector3(500, 500, 5000),
            scene
          );
          light.intensity = 100;

          const light1 = new PointLight(
            "light",
            new Vector3(50, 50, -200),
            scene
          );
          light1.intensity = 600000;

          const light2 = new PointLight(
            "light",
            new Vector3(50, 50, -200),
            scene
          );
          light2.intensity = 600000;
          var scale = true;

          scene.registerBeforeRender(function () {
            // Check if heart is moving

            for (const mesh of meshes) {
              var x = 1.4;
              var y = 1.4;
              var z = 1.4;

              if (
                (mesh.scaling.x < 1.5 && scale) ||
                (mesh.scaling.y < 1.5 && scale) ||
                (mesh.scaling.z < 1.5 && scale)
              ) {
                // Increment heart scaling
                mesh.scaling.x += 0.05;
                mesh.scaling.y += 0.05;
                mesh.scaling.z += 0.05;
              } else {
                // Swap scales to decrease
                scale = false;
              }

              if (
                (mesh.scaling.x > 0.8 && !scale) ||
                (mesh.scaling.y > 0.8 && scale) ||
                (mesh.scaling.z > 0.8 && scale)
              ) {
                // Decrement heart scaling
                mesh.scaling.x -= 0.008;
                mesh.scaling.y -= 0.008;
                mesh.scaling.z -= 0.008;
              } else {
                // Swap directions to increase
                scale = true;
              }
            }
          });
        }
      );
    }

    const camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);

    var renderRunning = false;
    if (renderRunning) {
      heart();
    } else {
      heart1();
    }

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
