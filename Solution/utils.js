// Useful utility functions

function randomBetween(min, max) {
  return Math.random() * (max + 1 - min + 1) + min;
}

function isWithinBoundsOfXY(object, ground) {
  return object.left <= ground.right && object.right >= ground.left && object.front <= ground.back;
}

function pickSpawnPickupPosition(groundWidth) {
  return Math.floor(randomBetween(1, 3)) * (groundWidth / 5);
}

export { randomBetween, isWithinBoundsOfXY, pickSpawnPickupPosition };
