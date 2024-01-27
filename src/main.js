import * as THREE from '../External Libraries/build/three.module.js';
import { Box } from './box.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { randomBetween, pickSpawnPickupPosition } from './utils.js';
import { PickupBomb } from './pickupBomb.js';
import { levelParams } from './levelParameters.js';
import { GLTFLoader } from '../External Libraries/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

let bombMesh = undefined;
loader.load('../Assets/3d/bomb.glb', (gltf) => {
  bombMesh = gltf.scene;
  bombMesh.children.forEach((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
});

let soldierMesh = undefined;
let soldierAnimations = loader.load('../Assets/3d/Soldier.glb', (gltf) => {
  soldierAnimations = gltf.animations;
  soldierMesh = gltf.scene;
  soldierMesh.scale.set(2, 2, 2);
  gltf.scene.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
});

const button = document.getElementById('start-button');
button.addEventListener('click', start);
const mainMenuDiv = document.getElementById('main-menu');

let blueBackground = undefined;
let purpleBackground = undefined;
const textureLoader = new THREE.TextureLoader();
textureLoader.load('../Assets/2d/space-blue.jpg', function (texture) {
  blueBackground = texture;
});

textureLoader.load('../Assets/2d/space-purple.jpg', function (texture) {
  purpleBackground = texture;
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const fov = 100;
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 500;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
let cameraAngle = 0;
camera.position.set(0, 12, 7);
camera.rotation.x = -0.85;

let currentLevel = 1;
let gameIsOver = false;
let gameIsReallyOver = false;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

var hudCanvas = document.createElement('canvas');

hudCanvas.style.display = 'none';

const width = window.innerWidth;
const height = window.innerHeight;
hudCanvas.width = width;
hudCanvas.height = height;

var cameraHUD = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0, 30);

const sceneHUD = new THREE.Scene();

var hudTexture = new THREE.Texture(hudCanvas);
hudTexture.needsUpdate = true;
var material = new THREE.MeshBasicMaterial({ map: hudTexture });
material.transparent = true;

var planeGeometry = new THREE.PlaneGeometry(width, height);
var plane = new THREE.Mesh(planeGeometry, material);
plane.material.transparent = true;
sceneHUD.add(plane);

let {
  maxNumberOfEnemies,
  maxNumberOfPickupBombs,
  enemyMaxSize,
  enemySpawnRate,
  bombSpawnRate,
  keyDownVelocityX,
  keyDownVelocityZ,
  enemyColor,
  platformColor,
} = levelParams[currentLevel];
const lightAngle = Math.PI / 3.5;

var map = new THREE.TextureLoader().load('../Assets/2d/bomb.svg');
const originX = -width / 2;
const originY = -height / 2;

const bombIndicators = [];
for (let i = 0; i < 3; i++) {
  const bombIndicator = new THREE.Sprite(new THREE.SpriteMaterial({ map: map, color: 0xffffff }));
  bombIndicator.scale.set(100, 75, 1);
  bombIndicator.position.set(originX + 70 + 60 * i, originY + 70);
  bombIndicators.push(bombIndicator);
  sceneHUD.add(bombIndicator);
}

const healthBarWidth = 300;
const healthBarPosition = new THREE.Vector2(width / 2 - 180, -height / 2 + 60);
const HealthBarGeometry = new THREE.PlaneGeometry(healthBarWidth, 40);
var healthBar = new THREE.Mesh(
  HealthBarGeometry,
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
);
healthBar.position.set(healthBarPosition.x, healthBarPosition.y);
sceneHUD.add(healthBar);

const HealthGeometry = new THREE.PlaneGeometry(300, 40);
var health = new THREE.Mesh(HealthGeometry, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
health.position.set(healthBarPosition.x, healthBarPosition.y);
sceneHUD.add(health);

// const controls = new OrbitControls(camera, renderer.domElement);

const groundDepth = 450;
const groundWidth = 30;
const ground = new Box({
  width: groundWidth,
  height: 0.1,
  depth: groundDepth,
  color: platformColor,
  position: new THREE.Vector3(0, -2, -groundDepth / 2 + 5),
});

scene.add(ground);

const keys = {
  a: { isDown: false },
  d: { isDown: false },
  w: { isDown: false },
  s: { isDown: false },
  k: { isDown: false },
  j: { isDown: false },
  space: { isDown: false },
  releasedShift: { signalSent: false },
  mouseLeft: { isDown: false },
  mouseRight: { isDown: false },
};
window.addEventListener('keydown', (event) => {
  switch (event.code) {
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
});

window.addEventListener('keyup', (event) => {
  switch (event.code) {
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
});

// Prevents context menu from popping up when user right clicks. The context menu can still
// be accessed with a right click from the main menu
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('mousedown', (event) => {
  switch (event.button) {
    case 0:
      keys.mouseLeft.isDown = true;
      break;
    case 2:
      keys.mouseRight.isDown = true;
  }
});

window.addEventListener('mouseup', () => {
  switch (event.button) {
    case 0:
      keys.mouseLeft.isDown = false;
      break;
    case 2:
      keys.mouseRight.isDown = false;
  }
});

const jumpVelocity = 0.3;
const cameraDistanceFromPLayer = 10;

const enemyMinSize = 3;

const minDistAwayFromPlayerEnemySpawn = 100;
const maxDistAwayFromPlayerEnemySpawn = 120;

const minDistAwayFromPlayerBombSpawn = 25;
const maxDistAwayFromPlayerBombSpawn = 100;

const player = new Player({
  width: 1.5,
  height: 3,
  depth: 1,
  color: '#00ff83',
  velocity: new THREE.Vector3(0, 0, 0),
  position: new THREE.Vector3(0, 10, 0),
});

scene.add(player);

const lightDistanceAbovePlayerHead = 10;
const playerLight = new THREE.SpotLight(0xffffff, 250);
playerLight.position.set(
  player.position.x,
  player.position.y + lightDistanceAbovePlayerHead,
  player.position.z
);
playerLight.castShadow = true;
scene.add(playerLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);

scene.add(ambientLight);

let enemies = [];
let pickupBombs = [];

function start() {
  if (bombMesh && soldierMesh) {
    resetForNextTime(true);
    mainMenuDiv.style.display = 'none';
    animate();
  }
}

const clock = new THREE.Clock();
function animate() {
  if (!gameIsReallyOver) requestAnimationFrame(animate);

  if (currentLevel == 1) {
    scene.background = blueBackground;
  } else {
    scene.background = purpleBackground;
  }
  if (soldierMesh && soldierAnimations && !player.soldierMesh) {
    player.soldierMesh = soldierMesh;
    player.animationMixer = new THREE.AnimationMixer(soldierMesh);

    const animations = {};
    soldierAnimations
      .filter((animation) => animation.name != 'Tpose')
      .forEach((animation) => {
        animations[animation.name] = player.animationMixer.clipAction(animation);
      });

    player.animations = animations;
    scene.add(soldierMesh);
  }

  if (player.position.z < -groundDepth && currentLevel != 3) {
    currentLevel++;
    if (currentLevel == 3) gameOver('win');
    else resetForNextTime();
  }

  renderer.render(scene, camera);
  renderer.render(sceneHUD, cameraHUD);

  player.velocity.x = 0;
  player.velocity.z = 0;

  if (!gameIsOver) handleKeyPresses(player);

  const abovePlayer = new THREE.Vector3(
    player.position.x,
    player.position.y + lightDistanceAbovePlayerHead,
    player.position.z + 2
  );

  positionAndRotateCamera(camera, player, cameraAngle);
  playerLight.position.lerp(abovePlayer, 0.4);
  playerLight.angle = lightAngle * 0.4 + lightAngle * (player.health / player.healthBar) * 0.6;
  playerLight.target = player;
  player.update(ground, scene, playerLight, clock.getDelta());

  if (player.health <= 0) {
    player.health = 0;
    if (!gameIsOver) gameOver('dead');
  }
  const multScale = player.health / player.healthBar;
  health.scale.set(multScale, 1, 1);
  health.position.set(
    healthBarPosition.x - (healthBarWidth - multScale * healthBarWidth) / 2,
    healthBarPosition.y
  );

  let accountedForBombs = player.numberOfBombs;
  bombIndicators.forEach((bombIndicator) => {
    if (accountedForBombs > 0) bombIndicator.material.opacity = 1;
    else bombIndicator.material.opacity = 0.1;
    accountedForBombs--;
  });
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const bullet = player.bullets[i];
    if (bullet.toDelete) {
      player.bullets.splice(i, 1);
    } else bullet.update(enemies, scene);
  }

  for (let i = player.bombs.length - 1; i >= 0; i--) {
    const bomb = player.bombs[i];
    if (bomb.exploded && bomb.particles.length == 0 && !bomb.explosionLight) {
      player.bombs.splice(i, 1);
    } else bomb.update(ground, scene, enemies, player);
  }

  if (enemies.length < maxNumberOfEnemies && Math.random() < enemySpawnRate) {
    const enemy = new Enemy({
      width: 3,
      height: 5,
      depth: 2,
      velocity: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(
        randomBetween(ground.position.x - groundWidth / 2, ground.position.x + groundWidth / 2),
        5,
        player.position.z -
          randomBetween(minDistAwayFromPlayerEnemySpawn, maxDistAwayFromPlayerEnemySpawn)
      ),
      size: randomBetween(enemyMinSize, enemyMaxSize),
      scene,
      color: enemyColor,
    });

    scene.add(enemy);

    enemies.push(enemy);
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (enemy.canDelete()) {
      enemies.splice(i, 1);
    } else enemy.update(ground, player, scene);
  }

  if (pickupBombs.length < maxNumberOfPickupBombs && Math.random() < bombSpawnRate) {
    const pickupBomb = new PickupBomb({
      position: new THREE.Vector3(
        ground.left + pickSpawnPickupPosition(groundWidth),
        3,
        player.position.z -
          randomBetween(minDistAwayFromPlayerBombSpawn, maxDistAwayFromPlayerBombSpawn)
      ),
      scene: scene,
      bombMesh,
    });

    pickupBombs.push(pickupBomb);
  }
  for (let i = pickupBombs.length - 1; i >= 0; i--) {
    const pickupBomb = pickupBombs[i];
    if (pickupBomb.toDelete) {
      pickupBombs.splice(i, 1);
    } else pickupBomb.update(ground, scene, player);
  }
}

function handleKeyPresses(player) {
  if (keys.a.isDown) player.velocity.x = -keyDownVelocityX;
  else if (keys.d.isDown) player.velocity.x = keyDownVelocityX;

  if (keys.w.isDown) player.velocity.z = -keyDownVelocityZ;
  else if (keys.s.isDown) player.velocity.z = keyDownVelocityZ;

  if (
    (keys.w.isDown || keys.a.isDown || keys.s.isDown || keys.d.isDown) &&
    player.isGrounded(ground)
  ) {
    player.currentAnimation = 'Run';
  } else {
    player.currentAnimation = 'Idle';
  }

  if (keys.space.isDown && player.isGrounded(ground)) {
    player.velocity.y = jumpVelocity;
  }

  if (keys.mouseLeft.isDown) {
    player.shoot(scene);
  }

  if (keys.mouseRight.isDown) {
    player.bomb(scene, bombMesh);
  }

  if (keys.releasedShift.signalSent) {
    keys.releasedShift.signalSent = false;
    cameraAngle = (cameraAngle + 1) % 2;
  }
}

function gameOver(condition) {
  gameIsOver = true;
  if (condition == 'win') {
    document.getElementById('win-text').style.display = 'block';
    setTimeout(() => {
      document.getElementById('win-text').style.display = 'none';
      mainMenuDiv.style.display = 'flex';
      gameIsReallyOver = true;
    }, 3000);
  } else if (condition == 'dead') {
    document.getElementById('dead-text').style.display = 'block';
    setTimeout(() => {
      document.getElementById('dead-text').style.display = 'none';
      mainMenuDiv.style.display = 'flex';
      gameIsReallyOver = true;
    }, 3000);
  }
  // gameIsOver = true;
}

function resetForNextTime(fullReset = false) {
  if (fullReset) {
    gameIsOver = false;
    gameIsReallyOver = false;
    currentLevel = 1;
    scene.add(player);
    scene.add(soldierMesh);
    scene.add(playerLight);
  }

  ({
    maxNumberOfEnemies,
    maxNumberOfPickupBombs,
    enemyMaxSize,
    enemySpawnRate,
    bombSpawnRate,
    keyDownVelocityX,
    keyDownVelocityZ,
    enemyColor,
    platformColor,
  } = levelParams[currentLevel]);
  ground.material.color.setHex(platformColor);
  player.reset();
  player.numberOfBombs = 3;
  enemies.forEach((enemy) => {
    enemy.exploded = true;
    enemy.toDelete = true;
    enemy.update(ground, player, scene);
    enemy.removeParticlesFromScene(scene);
  });
  pickupBombs.forEach((bomb) => {
    scene.remove(bomb.mesh);
    scene.remove(bomb.light);
    bomb.light.dispose();
    bomb.toDelete = true;
    bomb.update(ground, scene, player);
  });
  camera.position.set(
    player.position.x,
    player.position.y,
    player.position.z + cameraDistanceFromPLayer
  );
  playerLight.position.set(
    player.position.x,
    player.position.y + lightDistanceAbovePlayerHead,
    player.position.z
  );
}

const originalCameraPosition = new THREE.Vector3(0, 12, 7);
function positionAndRotateCamera(camera, player, cameraAngle) {
  const player_pos_z = new THREE.Vector3(
    originalCameraPosition.x,
    originalCameraPosition.y,
    player.position.z + cameraDistanceFromPLayer
  );

  const player_pos_y = new THREE.Vector3(
    player.position.x,
    player.position.y + 4 * cameraDistanceFromPLayer,
    player.position.z - 18
  );

  switch (cameraAngle) {
    case 0:
      camera.position.lerp(player_pos_z, 0.05);
      camera.rotation.x = -0.85;
      break;
    case 1:
      camera.position.lerp(player_pos_y, 0.05);
      camera.rotation.x = -Math.PI / 2;
      break;
  }
}
