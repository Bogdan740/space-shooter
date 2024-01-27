import * as THREE from '../External Libraries/build/three.module.js';
import { isWithinBoundsOfXY, randomBetween } from './utils.js';

const particleRadius = 0.2;
const particleGeometry = new THREE.SphereGeometry(particleRadius, 12, 12);
const particleMaterials = {
  red: new THREE.MeshPhongMaterial({ color: '#ff0000' }),
  green: new THREE.MeshPhongMaterial({ color: '#00ff00' }),
  white: new THREE.MeshPhongMaterial({ color: '#ffffff' }),
};

class Particle extends THREE.Mesh {
  constructor(
    { color, position, velocity = new THREE.Vector3(0, 0, 0) },
    energy_loss = 0.85,
    energy_loss_y = 0.65
  ) {
    super(particleGeometry, particleMaterials[color]);

    this.posNoise = Math.random() * 3;
    this.position.set(position.x, position.y, position.z);

    this.particleSplash = new THREE.Vector3(0.6, 0.2, 0.6);

    this.velocity = new THREE.Vector3(
      randomBetween(-1, 1) * this.particleSplash.x,
      randomBetween(-1, 1) * this.particleSplash.y,
      randomBetween(-1, 1) * this.particleSplash.z
    ).add(velocity);
    this.toDelete = false;

    this.timeOfCreation = new Date();
    this.duration = Math.random() * 2000;

    this.gravity = -0.02;

    this.left = null;
    this.right = null;
    this.front = null;
    this.energy_loss = energy_loss;
    this.energy_loss_y = energy_loss_y;
    this.calibrate();
  }

  calibrate() {
    this.left = this.position.x - particleRadius;
    this.right = this.position.x - particleRadius;
    this.front = this.position.z + particleRadius;
  }
  update(ground) {
    if (new Date() - this.timeOfCreation > this.duration) {
      this.toDelete = true;
    }
    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;
    this.velocity.x *= this.energy_loss;
    this.velocity.z *= this.energy_loss;
    this.calibrate();
    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    const distanceToGround = this.position.y + this.velocity.y - ground.top;
    if (isWithinBoundsOfXY(this, ground) && distanceToGround <= 0) {
      this.velocity.y = -this.velocity.y * this.energy_loss_y;
    } else this.position.y += this.velocity.y;
  }

  collidedFloor(enemy) {
    return (
      this.position.x + this.radius >= enemy.left &&
      this.position.x - this.radius <= enemy.right &&
      this.position.z >= enemy.front &&
      this.position.z <= enemy.back &&
      this.position.y + this.radius >= enemy.bottom &&
      this.position.y - this.radius <= enemy.top
    );
  }
}

export { Particle };
