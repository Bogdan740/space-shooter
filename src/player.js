import * as THREE from '../three/build/three.module.js';
import { Box } from './box.js';
import { Bullet } from './bullet.js';
import { Bomb } from './bomb.js';
import { offScreen } from './utils.js';

// Constants
const shootCooldownMs = 250;
const bombCooldownMs = 500;
const fadeDuration = 0.2;
// Class repreesnting the player that the user can control
class Player extends Box {
  constructor({
    width,
    height,
    depth,
    color,
    position = new THREE.Vector3(0, 0, 0),
    velocity = new THREE.Vector3(0, 0, 0),
    scene,
    triggerExplosion,
  }) {
    super({
      width,
      height,
      depth,
      color,
      position,
      velocity,
    });

    this.triggerExplosion = triggerExplosion;
    // Use soldier mesh for nice character and animation
    this.soldierMesh = undefined;
    this.animations = undefined;
    this.animationMixer = undefined;

    this.currentAnimation = 'Idle';
    this.playingAnimation = undefined;

    this.material.transparent = true;
    this.material.opacity = 0;

    this.castShadow = false;
    this.receiveShadow = false;

    this.bullets = [];
    this.numBullets = 5;
    for (let i = 0; i < this.numBullets; i++) {
      const bullet = new Bullet({ position: offScreen });
      bullet.velocity = 0;
      this.bullets.push(bullet);
      scene.add(bullet);
    }

    this.currentBullet = 0;

    this.bombs = [];

    this.timeOfLastShot = null;
    this.timeOfLastBomb = null;

    this.healthBar = 150;
    this.health = this.healthBar;

    this.movingLeft = false;
    this.movingRight = false;
    this.movingForward = false;
    this.movingBakward = false;
    this.numberOfBombs = 3;

    this.alive = true;
  }

  shoot() {
    const now = new Date();
    // Have a cooldown so the player can't spam the shooting
    if (!this.timeOfLastShot || now - this.timeOfLastShot > shootCooldownMs) {
      const bullet = this.bullets[this.currentBullet++ % this.numBullets];
      bullet.instantiateSelf(this.position);
      this.timeOfLastShot = now;
    }
  }

  update(ground, scene, playerLight, delta) {
    this.material.opacity = 0;
    if (this.animations && this.currentAnimation != this.playingAnimation) {
      if (this.playingAnimation) {
        this.animations[this.playingAnimation].fadeOut(fadeDuration);
      }
      this.animations[this.currentAnimation].reset().fadeIn(fadeDuration).play();
      this.playingAnimation = this.currentAnimation;
    }

    if (this.animationMixer) {
      this.animationMixer.update(delta);
    }

    if (!this.alive && !this.exploded) {
      this.explode(scene);
      this.exploded = true;
    }
    if (this.exploded) {
      this.geometry.dispose();
      this.material.dispose();
      scene.remove(this);
      if (playerLight) {
        scene.remove(this.soldierMesh);
        playerLight.dispose();
        scene.remove(playerLight);
      }
    }

    if (this.health <= 0) {
      this.toDelete = true;
    }

    this.degradableVelocity.multiplyScalar(this.velocityDegradationRate);
    if (this.degradableVelocity.length() < 0.01)
      this.degradableVelocity = new THREE.Vector3(0, 0, 0);

    this.position.x += this.velocity.x + this.degradableVelocity.x;
    this.position.z += this.velocity.z + this.degradableVelocity.z;

    this.calibrate();
    this.applyGravity(ground);
    this.resetIfOutOfBounds();

    if (this.soldierMesh) {
      this.soldierMesh.position.set(
        this.position.x,
        this.position.y - this.height / 1.95,
        this.position.z
      );
    }
  }

  bomb(scene, bombMesh) {
    if (this.numberOfBombs > 0) {
      const now = new Date();
      if (!this.timeOfLastBomb || now - this.timeOfLastBomb > bombCooldownMs) {
        const bomb = new Bomb({
          position: this.position,
          velocity: this.velocity,
          scene,
          bombMesh,
          triggerExplosion: this.triggerExplosion,
        });
        this.bombs.push(bomb);
        this.timeOfLastBomb = now;
        this.numberOfBombs -= 1;
      }
    }
  }

  resetIfOutOfBounds() {
    if (this.isOutOfBounds()) {
      this.health -= this.healthBar / 3;
      this.position.y = 1;
      this.position.x = 0;
      this.position.z = this.position.z > 0 ? 0 : this.position.z;
      this.velocity = new THREE.Vector3(0, 0, 0);
      this.calibrate();
    }
  }

  reset() {
    this.exploded = false;
    this.position.set(0, 10, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.degradableVelocity = new THREE.Vector3(0, 0, 0);
    // this.particles = [];
    this.health = this.healthBar;
    this.calibrate();
  }
}

export { Player };
