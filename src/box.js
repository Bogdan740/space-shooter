import * as THREE from '../External Libraries/build/three.module.js';
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
      new THREE.MeshPhongMaterial({ color: color })
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

    this.particles = [];

    this.toDelete = false;
    this.exploded = false;
  }

  update(ground, scene, playerLight) {
    if (this.toDelete && !this.exploded) {
      this.explode(scene);
      this.exploded = true;
    }
    if (this.exploded) {
      this.geometry.dispose();
      this.material.dispose();
      scene.remove(this);
      if (playerLight) {
        playerLight.dispose();
        scene.remove(playerLight);
      }
    }

    this.updateParticles(ground, scene);
    if (this.health <= 0) {
      this.toDelete = true;
    }
    this.material.opacity = 0.1 + this.health / this.healthBar;
    this.degradableVelocity.multiplyScalar(this.velocityDegradationRate);
    if (this.degradableVelocity.length() < 0.01)
      this.degradableVelocity = new THREE.Vector3(0, 0, 0);

    this.position.x += this.velocity.x + this.degradableVelocity.x;
    this.position.z += this.velocity.z + this.degradableVelocity.z;
    this.calibrate();
    this.applyGravity(ground);
    this.resetIfOutOfBounds();
  }

  updateParticles(ground, scene) {
    if (this.particles.length != 0) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        if (particle.toDelete) {
          particle.geometry.dispose();
          particle.material.dispose();
          scene.remove(particle);
          this.particles.splice(i, 1);
        } else particle.update(ground);
      }
    }
  }

  isOutOfBounds() {
    return this.position.y <= minYVal;
  }
  resetIfOutOfBounds() {
    if (this.isOutOfBounds()) {
      this.position.y = 1;
      this.position.x = 0;
      this.position.z = this.position.z > 0 ? 0 : this.position.z;
      this.velocity = new THREE.Vector3(0, 0, 0);
      this.calibrate();
    }
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
      const particle = new Particle({ color: 'red', position: this.position });
      this.particles.push(particle);
      scene.add(particle);
    }
  }

  canDelete() {
    return this.toDelete && this.particles.length == 0;
  }
}

export { Box };
