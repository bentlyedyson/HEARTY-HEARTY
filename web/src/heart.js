import {
  HemisphericLight,
  PointLight,
  SceneLoader,
  Vector3,
  Animation,
} from "@babylonjs/core";

class Heart {
  constructor(scene) {
    // Props
    this.minScale = 1.43;
    this.maxScale = 1.5;
    this.scale = true;
    this.beat = false; // Whether the heart should beat
    this.scene = scene;
    this.meshes;

    SceneLoader.ImportMesh("", "./", "heart.babylon", scene, (meshes) => {
      // Set up lights
      const light = new HemisphericLight(
        "light",
        new Vector3(500, 500, 5000),
        scene
      );
      light.intensity = 100;

      // const light1 = new PointLight("light", new Vector3(50, 50, -200), scene);
      // light1.intensity = 600000;

      // const light2 = new PointLight("light", new Vector3(50, 50, -200), scene);
      // light2.intensity = 600000;

      const { minScale } = this;
      for (const mesh of meshes) {
        mesh.scaling = new Vector3(minScale, minScale, minScale);

        mesh.animations = [];
        // Rotation Animation
        const rotate = new Animation(
          "heartRotate-" + mesh.id,
          "rotation",
          5,
          Animation.ANIMATIONTYPE_VECTOR3,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const keys = [
          {
            frame: 0,
            value: new Vector3(0, 0, 0),
          },
          {
            frame: 50,
            value: new Vector3(0, Math.PI, Math.PI),
          },
          {
            frame: 100,
            value: new Vector3(0, Math.PI * 2, Math.PI * 2),
          },
        ];
        rotate.setKeys(keys);
        mesh.animations.push(rotate);
        scene.beginAnimation(mesh, 0, 100, true);
      }

      this.meshes = meshes;
      scene.registerBeforeRender(this._registerBeat.bind(this));
    });
  }

  _registerBeat() {
    // TODO: yesyes
    // if (!this.beat) return;

    // Register animation
    const { minScale, maxScale, meshes, scale } = this;

    const scaleUpInc = 0.008;
    const scaleDownInc = 0.002;

    for (const mesh of meshes) {
      if (scale) {
        if (
          mesh.scaling.x < maxScale ||
          mesh.scaling.y < maxScale ||
          mesh.scaling.z < maxScale
        ) {
          // Increment heart scaling
          mesh.scaling.x += scaleUpInc;
          mesh.scaling.y += scaleUpInc;
          mesh.scaling.z += scaleUpInc;
        } else {
          // Swap scales to decrease
          this.scale = false;
        }
      } else {
        if (
          mesh.scaling.x > minScale ||
          mesh.scaling.y > minScale ||
          mesh.scaling.z > minScale
        ) {
          // Decrement heart scaling
          mesh.scaling.x -= scaleDownInc;
          mesh.scaling.y -= scaleDownInc;
          mesh.scaling.z -= scaleDownInc;
        } else {
          // Swap directions to increase
          this.scale = true;
          this.beat = false;
        }
      }
    }
  }

  beatHeart() {
    const { minScale, meshes } = this;
    if (!meshes) return; // Safeguard
    this.beat = true;
    this.scale = true;

    for (const mesh of meshes) {
      mesh.scaling = new Vector3(minScale, minScale, minScale);
    }
  }
}

export default Heart;
