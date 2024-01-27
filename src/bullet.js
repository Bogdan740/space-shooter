import * as THREE from '../External Libraries/build/three.module.js';

// Constants
const canTravel = 100;

const bulletGeometry = new THREE.SphereGeometry(0.4, 16, 16);
const bulletMaterial = new THREE.MeshPhongMaterial({ color: '#00ff00' });
class Bullet extends THREE.Mesh {
  constructor({ radius = 0.4, color = '#00ff00', position, velocity = -1 }) {
    super(bulletGeometry, bulletMaterial);

    this.radius = radius;
    this.startingZPos = position.z;
    this.position.set(position.x, position.y, position.z);

    this.velocity = velocity;
    this.toDelete = false;
    this.damage = 2;
  }

  update(enemies, scene) {
    if (Math.abs(this.position.z - this.startingZPos) > canTravel) this.toDelete = true;
    this.position.z += this.velocity;

    enemies.forEach((enemy) => {
      // Do damage to the enemies when bullet collides with them
      if (!enemy.toDelete && this.collidedEnemy(enemy)) {
        this.toDelete = true;
        enemy.health -= this.damage;
      }
    });

    if (this.toDelete) {
      this.geometry.dispose();
      this.material.dispose();
      scene.remove(this);
    }
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
