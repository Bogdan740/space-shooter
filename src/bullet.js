import * as THREE from '../three/build/three.module.js';
import { offScreen } from './utils.js';

// Constants
const canTravel = 100;

const bulletGeometry = new THREE.SphereGeometry(0.4, 4, 4);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: '#00ff00' });
const damage = 2;
class Bullet extends THREE.Mesh {
  constructor({ radius = 0.4, color = '#00ff00', position, velocity = -1 }) {
    super(bulletGeometry, bulletMaterial);

    this.radius = radius;
    this.startingZPos = position.z;
    this.position.set(position.x, position.y, position.z);

    this.velocity = velocity;
    this.alive = false;
  }

  update(enemies) {
    if (Math.abs(this.position.z - this.startingZPos) > canTravel) this.kill();
    this.position.z += this.velocity;
    enemies.forEach((enemy) => {
      // Do damage to the enemies when bullet collides with them
      if (this.collidedEnemy(enemy) && enemy.alive) {
        this.kill();
        enemy.takeDamage(damage);
      }
    });
  }

  kill() {
    this.alive = false;
    this.position.set(offScreen.x, offScreen.y, offScreen.z);
  }
  instantiateSelf(position) {
    this.position.set(position.x, position.y, position.z);
    this.velocity = -1;
    this.alive = true;
    this.startingZPos = position.z;
  }
  collidedEnemy(enemy) {
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

export { Bullet };
