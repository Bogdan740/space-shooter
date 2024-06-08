import * as THREE from '../three/build/three.module.js';
import { Box } from './box.js';
import { offScreen } from './utils.js';
import { Explosion } from './explosion.js';

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
    triggerExplosion,
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
    this.light = new THREE.SpotLight(0xffffff, 250);
    this.light.position.set(
      this.position.x,
      this.position.y + lightDistanceAboveHead,
      this.position.z
    );
    this.light.castShadow = true;
    scene.add(this.light);

    this.alive = false;

    this.triggerExplosion = triggerExplosion;
  }

  kill() {
    this.alive = false;
    this.triggerExplosion(this.position, this.velocity);
    this.position.set(offScreen.xs, offScreen.y, offScreen.z);
    this.light.position.set(offScreen.x, offScreen.y, offScreen.z);
  }
  update(ground, player, scene) {
    // Calculate vector in direction of player
    const unitVectorInDirectionOfPlayer = player.position
      .clone()
      .add(this.position.clone().multiplyScalar(-1))
      .normalize();

    // Explode and cause damage and knockback to player if enemy touches player. Also kill current enemy.
    if (this.collidedWith(player) && this.alive && player.alive) {
      this.kill(scene);
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

    this.light.position.lerp(aboveEnemy, 0.4);
    this.light.target = this;
    if (this.health <= 0) this.kill();

    if (this.alive) {
      this.applyGravity(ground);
      const velocityDueToGravity = this.velocity.y;
      this.degradableVelocity.multiplyScalar(this.velocityDegradationRate);
      this.position.x += this.velocity.x + this.degradableVelocity.x;
      this.position.z += this.velocity.z + this.degradableVelocity.y;

      this.velocity = unitVectorInDirectionOfPlayer.multiplyScalar(this.speed);

      this.velocity.y = velocityDueToGravity;

      this.calibrate();
      if (this.isOutOfBounds()) {
        this.kill();
      }
    }
  }

  initialise(position, size) {
    this.alive = true;
    this.size = size;
    this.height = size;
    this.width = (size * 2) / 3;
    this.depth = size / 2;

    this.geometry.dispose();
    this.geometry = new THREE.BoxGeometry(this.width, this.height, this.depth);
    this.speed = 1 / size;

    this.healthBar = size / 2;
    this.health = this.healthBar;
    this.position.set(position.x, position.y, position.z);
    this.velocity.set(0, 0, 0);
    this.degradableVelocity.set(0, 0, 0);
    this.calibrate();
    this.light.angle = lightAngle * (this.health / this.healthBar);
    this.material.opacity = 1;
  }

  takeDamage(damage) {
    this.health -= damage;
    this.light.angle = lightAngle * (this.health / this.healthBar);
    this.material.opacity = 0.4 + this.health / this.healthBar;
  }
}

export { Enemy };
