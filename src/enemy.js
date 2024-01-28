import * as THREE from '../External Libraries/build/three.module.js';
import { Box } from './box.js';

const lightDistanceAboveHead = 15;
const knockBackMultiplier = 0.2;
const lightAngle = Math.PI / 4;
class Enemy extends Box {
  constructor({
    color = '#ff0000',
    position = new THREE.Vector3(0, 0, 0),
    velocity = new THREE.Vector3(0, 0, 0),
    size = 3,
    scene,
  }) {
    super({
      height: size,
      width: (size * 2) / 3,
      depth: size / 2,
      color,
      position,
      velocity,
    });

    this.receiveShadow = true;
    this.castShadow = true;

    this.size = size;
    this.speed = 1 / size;

    this.healthBar = size / 2;
    this.health = this.healthBar;

    // Enemy has their own spotlight above head
    // this.light = new THREE.SpotLight(0xffffff, 250);
    // this.light.position.set(
    //   this.position.x,
    //   this.position.y + lightDistanceAboveHead,
    //   this.position.z
    // );
    // this.light.castShadow = true;
    // scene.add(this.light);
  }

  update(ground, player, scene) {
    // Calculate vector in direction of player
    const unitVectorInDirectionOfPlayer = player.position
      .clone()
      .add(this.position.clone().multiplyScalar(-1))
      .normalize();

    // Explode and cause damage and knockback to player if enemy touches player. Also kill current enemy.
    if (this.collidedWith(player) && !this.toDelete && !player.toDelete) {
      this.toDelete = true;
      player.health -= this.size * 5;
      player.degradableVelocity.add(
        unitVectorInDirectionOfPlayer.multiplyScalar(this.size * knockBackMultiplier)
      );
    }

    const aboveEnemy = new THREE.Vector3(
      this.position.x,
      this.position.y + lightDistanceAboveHead,
      this.position.z
    );

    if (this.light) {
      this.light.position.lerp(aboveEnemy, 0.4);
      this.light.angle = lightAngle * (this.health / this.healthBar);
      this.light.target = this;
    }
    if (this.health <= 0) this.toDelete = true;

    if (this.toDelete && !this.exploded) {
      this.explode(scene);
      this.exploded = true;
    }

    if (this.exploded) {
      this.geometry.dispose();
      this.material.dispose();
      scene.remove(this);
      if (this.light) {
        scene.remove(this.light);
        this.light.dispose();
      }
    }

    this.updateParticles(ground, scene);

    if (!this.toDelete) {
      this.material.opacity = 0.4 + this.health / this.healthBar;
      this.applyGravity(ground);
      const velocityDueToGravity = this.velocity.y;
      this.degradableVelocity.multiplyScalar(this.velocityDegradationRate);
      this.position.x += this.velocity.x + this.degradableVelocity.x;
      this.position.z += this.velocity.z + this.degradableVelocity.y;

      this.velocity = unitVectorInDirectionOfPlayer.multiplyScalar(this.speed);

      this.velocity.y = velocityDueToGravity;

      this.calibrate();
      this.deleteIfOutOfBounds();
    }
  }

  deleteIfOutOfBounds() {
    if (this.isOutOfBounds()) {
      this.health = 0;
    }
  }

  removeParticlesFromScene(scene) {
    this.particles.forEach((particle) => {
      particle.material.dispose();
      particle.geometry.dispose();
      scene.remove(particle);
    });
  }
}

export { Enemy };
