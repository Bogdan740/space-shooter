import * as THREE from '../External Libraries/build/three.module.js';
import { isWithinBoundsOfXY } from './utils.js';
import { bombRadius } from './bomb.js';

// Constants
const hoverHeight = 2;
const pickupRange = 3;
const maxHoverHeight = 2.001;
const lightDistance = 15;
const lightAngle = Math.PI / 15;

// Class for bombs that be picked up by the player
class PickupBomb {
  constructor({ position, scene, bombMesh }) {
    this.mesh = bombMesh.clone();

    this.color = '#ffffff';

    this.mesh.position.set(position.x, position.y, position.z);
    scene.add(this.mesh);

    this.gravity = -0.001;

    this.velocityY = 0;

    this.left = null;
    this.right = null;
    this.front = null;
    this.bottom = null;

    this.calibrate();

    this.toDelete = false;

    this.light = new THREE.PointLight(0xffffff, 150);
    this.light.position.set(
      this.mesh.position.x,
      this.mesh.position.y + lightDistance,
      this.mesh.position.z
    );

    this.light.castShadow = true;
    this.light.target = this.mesh;
    this.light.angle = lightAngle;
    scene.add(this.light);
  }

  calibrate() {
    this.left = this.mesh.position.x - bombRadius;
    this.right = this.mesh.position.x - bombRadius;
    this.front = this.mesh.position.z + bombRadius;
    this.bottom = this.mesh.position.y - bombRadius;
  }

  update(ground, scene, player) {
    this.mesh.position.y += this.velocityY;
    this.calibrate();
    this.applyGravity(ground);
    this.checkWithinPickupRange(player);

    if (this.toDelete) {
      scene.remove(this.mesh);
      this.light.dispose();
      scene.remove(this.light);
      this.light.dispose();
    }
  }

  checkWithinPickupRange(player) {
    const playerPosXY = new THREE.Vector2(player.position.x, player.position.z);
    const bombPosXY = new THREE.Vector2(this.mesh.position.x, this.mesh.position.z);
    if (
      playerPosXY.distanceTo(bombPosXY) < pickupRange &&
      !this.toDelete &&
      player.numberOfBombs < 3
    ) {
      player.numberOfBombs += 1;
      this.toDelete = true;
    }
  }

  applyGravity(ground) {
    this.velocityY += this.gravity;

    const distanceToGround = this.mesh.position.y + this.velocityY - ground.top - hoverHeight;
    if (isWithinBoundsOfXY(this, ground) && this.gravity < 0 && distanceToGround <= 0) {
      this.gravity = -this.gravity;
      this.velocityY /= 2;
    } else if (
      isWithinBoundsOfXY(this, ground) &&
      this.gravity > 0 &&
      distanceToGround >= maxHoverHeight
    ) {
      this.gravity = -this.gravity;
    } else this.mesh.position.y += this.velocityY;
  }
}

export { PickupBomb };
