// Useful utility functions

import { Vector3 } from '../three/build/three.module';

function randomBetween(min, max) {
  return Math.random() * (max + 1 - min + 1) + min;
}

function isWithinBoundsOfXY(object, ground) {
  return object.left <= ground.right && object.right >= ground.left && object.front <= ground.back;
}

function pickSpawnPickupPosition(groundWidth) {
  return Math.floor(randomBetween(1, 3)) * (groundWidth / 5);
}

function handleKeyDown(code, keys) {
  switch (code) {
    case 'KeyA':
      keys.a.isDown = true;
      break;
    case 'KeyD':
      keys.d.isDown = true;
      break;
    case 'KeyW':
      keys.w.isDown = true;
      break;
    case 'KeyS':
      keys.s.isDown = true;
      break;
    case 'Space':
      keys.space.isDown = true;
      break;
    case 'KeyK':
      keys.k.isDown = true;
      break;
    case 'KeyJ':
      keys.j.isDown = true;
      break;
  }
}

function handleKeyUp(code, keys) {
  switch (code) {
    case 'KeyA':
      keys.a.isDown = false;
      break;
    case 'KeyD':
      keys.d.isDown = false;
      break;
    case 'KeyW':
      keys.w.isDown = false;
      break;
    case 'KeyS':
      keys.s.isDown = false;
      break;
    case 'Space':
      keys.space.isDown = false;
      break;
    case 'KeyK':
      keys.k.isDown = false;
      break;
    case 'KeyJ':
      keys.j.isDown = false;
      break;
    case 'ShiftLeft':
      keys.releasedShift.signalSent = true;
      break;
  }
}

function handleMouseDown(button, keys) {
  switch (button) {
    case 0:
      keys.mouseLeft.isDown = true;
      break;
    case 2:
      keys.mouseRight.isDown = true;
  }
}

function handleMouseUp(button, keys) {
  switch (button) {
    case 0:
      keys.mouseLeft.isDown = false;
      break;
    case 2:
      keys.mouseRight.isDown = false;
  }
}
const offScreen = new Vector3(0, -30, -100);

export {
  randomBetween,
  isWithinBoundsOfXY,
  pickSpawnPickupPosition,
  handleKeyDown,
  handleKeyUp,
  handleMouseDown,
  handleMouseUp,
  offScreen,
};
