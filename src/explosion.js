import { Particle } from './particle.js';
import { offScreen } from './utils.js';

class Explosion {
  constructor({ scene }) {
    this.particles = [];
    this.numParticles = 6;
    for (let i = 0; i <= this.numParticles; i++) {
      const particle = new Particle({
        color: this.color,
        position: offScreen,
      });
      this.particles.push(particle);
      scene.add(particle);
    }

    this.alive = false;
  }

  update(ground) {
    let atLeastOneLiveParticle = false;
    this.particles.forEach((particle) => {
      if (particle.alive) {
        atLeastOneLiveParticle = true;
        particle.update(ground);
      }
    });
    if (!atLeastOneLiveParticle) this.alive = false;
  }

  explode(position, impulse) {
    this.alive = true;
    this.particles.forEach((particle) => {
      particle.initialise(position, impulse);
    });
  }
}

export { Explosion };
