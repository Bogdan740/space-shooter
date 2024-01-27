import * as THREE from '../External Libraries/build/three.module.js';
import { isWithinBoundsOfXY } from './utils.js';
import { Particle } from './particle.js';

// Constants
const bombRadius = 1;
const bombNumParticles = 40;
const bombFuseTime = 500;
const bombRange = 60;
const bombKnockback = 40;
const bombDamage = 70;

class Bomb {
  constructor({ position, velocity = new THREE.Vector3(0, 0, 0), scene, bombMesh }) {
    // Use rendered bomb mesh
    this.mesh = bombMesh.clone();
    scene.add(this.mesh);
    this.color = '#ffffff';

    this.mesh.position.set(position.x, position.y, position.z);

    this.velocity = new THREE.Vector3(0, 0.4, -3).add(velocity);
    // Energy due to "air resitance"
    this.energy_loss = 0.95;
    this.gravity = -0.03;

    this.particles = [];

    this.left = null;
    this.right = null;
    this.front = null;
    this.bottom = null;

    this.calibrate();

    this.toDelete = false;
    this.exploded = false;
    this.timeGrouded = null;

    this.explosionLight = null;
    this.timeOfExplosion = null;
  }

  calibrate() {
    // Calculate boundary positions for collision detection
    this.left = this.mesh.position.x - bombRadius;
    this.right = this.mesh.position.x - bombRadius;
    this.front = this.mesh.position.z + bombRadius;
    this.bottom = this.mesh.position.y - bombRadius / 2;
  }

  update(ground, scene, enemies, player) {
    const now = new Date();
    if (this.explosionLight && this.timeOfExplosion) {
      if (now - this.timeOfExplosion < 0.001) {
        this.explosionLight.intensity += 0.0000001;
      } else if (this.explosionLight.intensity > 0) {
        this.explosionLight.intensity -= 20;
        if (this.explosionLight.intensity <= 0) {
          this.explosionLight.dispose();
          scene.remove(this.explosionLight);
          this.explosionLight.dispose();
          this.explosionLight = null;
        }
      }
    }
    this.mesh.position.x += this.velocity.x;
    this.mesh.position.z += this.velocity.z;
    this.velocity.x *= this.energy_loss;
    this.velocity.z *= this.energy_loss;
    this.calibrate();
    this.applyGravity(ground);
    this.updateParticles(ground, scene);

    if (this.toDelete && new Date() - this.timeGrouded > bombFuseTime && !this.exploded) {
      // Explode once it's been on the ground for 500ms
      this.explode(scene, enemies, player);
    }
    if (this.exploded) {
      scene.remove(this.mesh);
    }
  }

  updateParticles(ground, scene) {
    // Particle effects
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

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    const distanceToGround = this.bottom + this.velocity.y - ground.top;
    if (isWithinBoundsOfXY(this, ground) && distanceToGround <= 0) {
      this.toDelete = true;
      if (!this.timeGrouded) this.timeGrouded = new Date();
    } else this.mesh.position.y += this.velocity.y;
  }

  explode(scene, enemies, player) {
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
    enemies.forEach((enemy) => {
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
    // Custom explosion light effect
    this.explosionLight = new THREE.PointLight(0xffffff, 100);
    this.explosionLight.position.set(
      this.mesh.position.x,
      this.mesh.position.y,
      this.mesh.position.z
    );
    this.explosionLight.decay = 0.1;
    this.timeOfExplosion = new Date();
    scene.add(this.explosionLight);

    this.exploded = true;
    scene.remove(this);
    for (let i = 0; i < bombNumParticles; i++) {
      const particle = new Particle({ color: 'white', position: this.mesh.position });
      this.particles.push(particle);
      scene.add(particle);
    }
  }
}

export { Bomb, bombRadius };
