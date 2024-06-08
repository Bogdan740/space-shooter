import * as THREE from '../three/build/three.module.js';
import { isWithinBoundsOfXY, offScreen } from './utils.js';

// Constants
const bombRadius = 1;
const bombFuseTime = 500;
const bombRange = 60;
const bombKnockback = 40;
const bombDamage = 70;

class Bomb {
  constructor({
    position,
    velocity = new THREE.Vector3(0, 0, 0),
    scene,
    bombMesh,
    triggerExplosion,
  }) {
    // Use rendered bomb mesh
    this.mesh = bombMesh.clone();
    scene.add(this.mesh);
    this.color = '#ffffff';

    this.mesh.position.set(position.x, position.y, position.z);

    this.velocity = new THREE.Vector3(0, 0.4, -3).add(velocity);
    // Energy lost due to "air resitance" if you like
    this.energy_loss = 0.95;
    this.gravity = -0.03;

    this.particles = [];

    this.left = null;
    this.right = null;
    this.front = null;
    this.bottom = null;

    this.calibrate();

    this.timeGrounded = null;

    this.triggerExplosion = triggerExplosion;
    this.alive = true;
  }

  calibrate() {
    // Calculate boundary positions for collision detection
    this.left = this.mesh.position.x - bombRadius;
    this.right = this.mesh.position.x - bombRadius;
    this.front = this.mesh.position.z + bombRadius;
    this.bottom = this.mesh.position.y - bombRadius / 2;
  }

  update(ground, enemies, player) {
    if (!this.alive) return;
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    this.velocity.x *= this.energy_loss;
    this.velocity.z *= this.energy_loss;
    this.calibrate();
    this.applyGravity(ground);

    if (this.timeGrounded && new Date() - this.timeGrounded > bombFuseTime)
      this.kill(enemies, player);
  }

  kill(enemies, player) {
    this.alive = false;
    this.explode(enemies, player);
    this.mesh.position.set(offScreen.x, offScreen.y, offScreen.z);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    const distanceToGround = this.bottom + this.velocity.y - ground.top;
    if (isWithinBoundsOfXY(this, ground) && distanceToGround <= 0) {
      this.toDelete = true;
      if (!this.timeGrounded) this.timeGrounded = new Date();
    } else this.mesh.position.y += this.velocity.y;
  }

  explode(enemies, player) {
    // Damage and knockback to player
    const distanceToPlayer = player.position.distanceTo(this.mesh.position);
    if (distanceToPlayer < bombRange) {
      player.health -= bombDamage * (1 / distanceToPlayer);
      const bombToPlayerUnitVector = player.position
        .clone()
        .add(this.mesh.position.clone().multiplyScalar(-1))
        .normalize();

      player.degradableVelocity.add(
        bombToPlayerUnitVector.multiplyScalar(bombKnockback * (1 / distanceToPlayer))
      );
    }
    // Damage and knockback to enemies
    enemies
      .filter((enemy) => enemy.alive)
      .forEach((enemy) => {
        const distanceToEnemy = enemy.position.distanceTo(this.mesh.position);
        if (distanceToEnemy < bombRange) {
          enemy.health -= bombDamage * (1 / distanceToEnemy);
          const bombToEnemyUnitVector = enemy.position
            .clone()
            .add(this.mesh.position.clone().multiplyScalar(-1))
            .normalize();

          enemy.degradableVelocity.add(
            bombToEnemyUnitVector.multiplyScalar(bombKnockback * (1 / distanceToEnemy))
          );
        }
      });

    this.triggerExplosion(this.mesh.position);
  }
}

export { Bomb, bombRadius };
