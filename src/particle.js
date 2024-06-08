import * as THREE from '../three/build/three.module.js';
import { isWithinBoundsOfXY, offScreen, randomBetween } from './utils.js';

const particleRadius = 0.2;

class Particle extends THREE.Mesh {
  constructor({ color, position }, energy_loss = 0.85, energy_loss_y = 0.65) {
    super(
      new THREE.SphereGeometry(particleRadius, 3, 3),
      new THREE.MeshBasicMaterial({ color: color })
    );

    this.position.set(position.x, position.y, position.z);
    this.velocity = null;

    this.particleSplash = new THREE.Vector3(0.6, 0.2, 0.6);

    this.toDelete = false;

    this.timeOfExplosion = null;
    this.duration = 500 + Math.random() * 1500;

    this.gravity = -0.02;

    this.left = null;
    this.right = null;
    this.front = null;
    this.energy_loss = energy_loss;
    this.energy_loss_y = energy_loss_y;
    this.calibrate();
  }

  initialise(position, impulse = new THREE.Vector3(0, 0, 0)) {
    this.alive = true;
    this.timeOfExplosion = new Date();
    this.posNoise = Math.random() * 3;
    this.position.set(position.x, position.y, position.z);

    this.velocity = new THREE.Vector3(
      randomBetween(-1, 1) * this.particleSplash.x,
      randomBetween(-1, 1) * this.particleSplash.y,
      randomBetween(-1, 1) * this.particleSplash.z
    ).add(impulse);

    this.calibrate();
  }
  calibrate() {
    this.left = this.position.x - particleRadius;
    this.right = this.position.x - particleRadius;
    this.front = this.position.z + particleRadius;
  }
  update(ground) {
    if (new Date() - this.timeOfExplosion > this.duration) {
      this.kill();
    }
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
    this.velocity.x *= this.energy_loss;
    this.velocity.z *= this.energy_loss;
    this.calibrate();
    this.applyGravity(ground);
  }

  kill() {
    this.alive = false;
    this.position.set(offScreen.x, offScreen.y, offScreen.z);
  }
  applyGravity(ground) {
    this.velocity.y += this.gravity;

    const distanceToGround = this.position.y + this.velocity.y - ground.top;
    if (isWithinBoundsOfXY(this, ground) && distanceToGround <= 0) {
      this.velocity.y = -this.velocity.y * this.energy_loss_y;
    } else this.position.y += this.velocity.y;
  }
}

export { Particle };
