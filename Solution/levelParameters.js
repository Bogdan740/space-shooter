// Parameters for each level (there are 2 levels)

const level1Parameters = {
  enemyColor: 0xff0000,
  platformColor: 0x0000ff,
  maxNumberOfEnemies: 5,
  maxNumberOfPickupBombs: 1,
  enemyMaxSize: 9,
  enemySpawnRate: 0.011,
  bombSpawnRate: 0.001,
  keyDownVelocityX: 0.25,
  keyDownVelocityZ: 0.25,
};

const level2Parameters = {
  enemyColor: 0xa020f0,
  platformColor: 0xffa500,
  maxNumberOfEnemies: 6,
  maxNumberOfPickupBombs: 1,
  enemyMaxSize: 10,
  enemySpawnRate: 0.013,
  bombSpawnRate: 0.0007,
  keyDownVelocityX: 0.25,
  keyDownVelocityZ: 0.25,
};

const levelParams = {
  1: level1Parameters,
  2: level2Parameters,
};

export { levelParams };
