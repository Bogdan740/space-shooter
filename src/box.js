import * as THREE from '../three/build/three.module.js';
import { isWithinBoundsOfXY } from './utils.js';
import { Particle } from './particle.js';

const minYVal = -40;

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color,
    position = new THREE.Vector3(0, 0, 0),
    velocity = new THREE.Vector3(0, 0, 0),
    degradableVelocity = new THREE.Vector3(0, 0, 0),
    healthBar = 50,
    size = 5,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshLambertMaterial({ color: color })
    );

    this.receiveShadow = true;
    this.castShadow = true;

    this.color = color;
    this.material.transparent = true;

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.top = null;
    this.bottom = null;

    this.left = null;
    this.right = null;

    this.front = null;
    this.back = null;

    this.calibrate();

    this.velocity = velocity;
    this.degradableVelocity = degradableVelocity;
    this.velocityDegradationRate = 0.95;

    this.gravity = -0.005;
    this.energyLoss = 0.65;

    this.healthBar = healthBar;
    this.health = this.healthBar;
    this.size = size;

    this.toDelete = false;
    this.exploded = false;
  }

  isOutOfBounds() {
    return this.position.y <= minYVal;
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity + this.degradableVelocity.y * 0.01;

    const distanceToGround = this.bottom + this.velocity.y - ground.top;
    if (isWithinBoundsOfXY(this, ground) && distanceToGround <= 0 && distanceToGround >= -0.5) {
      this.position.y = ground.top + this.height / 2;
      this.velocity.y = 0;
    } else this.position.y += this.velocity.y;
  }

  calibrate() {
    this.top = this.position.y + this.height / 2;
    this.bottom = this.position.y - this.height / 2;
    this.left = this.position.x - this.width / 2;
    this.right = this.position.x + this.width / 2;
    this.front = this.position.z - this.depth / 2;
    this.back = this.position.z + this.depth / 2;
  }

  isGrounded(ground) {
    return this.collidedWith(ground);
  }

  collidedWith(other) {
    return (
      this.right >= other.left &&
      this.left <= other.right &&
      this.top >= other.bottom &&
      this.bottom <= other.top &&
      this.back >= other.front &&
      this.front <= other.back
    );
  }

  explode(scene) {
    this.exploded = true;
    this.material.opacity = 0;
    const numParticles = this.size * 1;
    for (let i = 0; i < numParticles; i++) {
      const particle = new Particle({ color: this.color, position: this.position });
      this.particles.push(particle);
      scene.add(particle);
    }
  }

  canDelete() {
    return this.toDelete && this.particles.length == 0;
  }
}

export { Box };
