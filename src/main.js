var type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}
PIXI.utils.sayHello(type)

var stage = new PIXI.Container();
var renderer = PIXI.autoDetectRenderer(512, 512);
var Loader = PIXI.loader;
var Sprite = PIXI.Sprite;
var Container = PIXI.Container;
var Text = PIXI.Text;
var root = document.getElementById('root');
root.appendChild(renderer.view);

Loader
  .add("./img/atlas/treasureHunter.json")
  .load(setup);

var dungeon,
    explorer,
    treasure,
    door,
    state,
    healthBar,
    gameScene,
    gameOverScene,
    message,
    isTreasureTaken = false;
    blobs = [];

function setup() {
  state = play;
  gameScene = new Container();
  stage.addChild(gameScene);

  gameOverScene = new Container();
  stage.addChild(gameOverScene);
  gameOverScene.visible = false;
  initSprites()
  healthBar();
  initControl();

  message = new Text(
    "The End!",
    {fontFamily: "Futura", fontSize: "64px", fill: "white"}
  );
  message.x = 120;
  message.y = stage.height / 2 - 32;
  gameOverScene.addChild(message);

  gameLoop();
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  state();
  renderer.render(stage);
}

function play() {

  explorer.x += explorer.vx;
  explorer.y += explorer.vy;
  var explorerHit = false;
  var containerOptions = { x: 32, y: 32, width: 480, height: 480 };

  contain(explorer, containerOptions);

  blobs.forEach(function(blob){

      blob.y += blob.vy;

      var blobHitsWall = contain(blob, containerOptions);

      if(blobHitsWall === "top" || blobHitsWall === "bottom") {
        blob.vy *= -1; // change direction
      }
      if(hitTestRectangle(explorer, blob)) {
        explorerHit = true;
      }

  });
  if(explorerHit) {
    explorer.alpha = 0.5;

    if(healthBar.outer.width === 0) {
      healthBar.outer.width = 0
    }
    else {
        healthBar.outer.width -= 1;
    }
  } else {
    explorer.alpha = 1;
  }

  if(door.y + door.height === explorer.y && door.x === explorer.x) {
        if(isTreasureTaken) {
          state = end;
          message.text = "You won!";
        } else {
          explorer.y = door.height;
        }

  }

  if(hitTestRectangle(explorer, treasure)) {
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 8;
    isTreasureTaken = true;
  }

  if(healthBar.outer.width === 0) {
    state = end;
    message.text = "You lose!"
  }
}

function end() {
    gameScene.visible = false;
    gameOverScene.visible = true;
}

function initSprites() {
  var id = Loader.resources["./img/atlas/treasureHunter.json"].textures;
  dungeon = new Sprite(id["dungeon.png"]);
  gameScene.addChild(dungeon);

  explorer = new Sprite(id["explorer.png"]);
  explorer.position.set(68, stage.height / 2 - explorer.height / 2);
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);

  treasure = new Sprite(id["treasure.png"]);
  treasure.position.set(stage.width - treasure.width - 48, stage.height / 2 - treasure.height / 2);
  gameScene.addChild(treasure);

  door = new Sprite(id["door.png"]);
  door.position.set(32, 0);
  gameScene.addChild(door);

  var blobsNumber = 6,
      spacing = 48,
      xOffset = 150,
      speed = 2,
      direction = 1;

  for(var i = 0; i < blobsNumber; i++) {
    blob = new Sprite(id["blob.png"]);
    blob.position.set(
      spacing * i + xOffset,
      randomInt(0, stage.height - blob.height)
    );
    blob.vy = speed * direction;
    direction *= -1;

    blobs.push(blob);
    gameScene.addChild(blob);
  }
}

function healthBar() {
    healthBar = new Container();
    healthBar.position.set(stage.width - 170, 3);
    gameScene.addChild(healthBar);

    var innerBar = new PIXI.Graphics();
    innerBar.beginFill(0x000000);
    innerBar.drawRect(0, 0, 128, 8);
    innerBar.endFill();
    healthBar.addChild(innerBar);

    var outerBar = new PIXI.Graphics();
    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, 128, 8);
    outerBar.endFill();
    healthBar.addChild(outerBar);

    healthBar.outer = outerBar;
}

function initControl() {
  var left = keyboard(37),
      up = keyboard(38),
      right = keyboard(39),
      down = keyboard(40);

  left.press = function() {
    explorer.vx = -5;
    explorer.vy = 0;
  };
  left.release = function() {
    if (!right.isDown && explorer.vy === 0) explorer.vx = 0;
  }

  right.press = function() {
    explorer.vx = 5;
    explorer.vy = 0;
  };
  right.release = function() {
    if (!left.isDown && explorer.vy === 0) explorer.vx = 0;
  };

  up.press = function() {
    explorer.vy = -5;
    explorer.vx = 0;
  };
  up.release = function() {
    if (!down.isDown && explorer.vx === 0) explorer.vy = 0;
  };

  down.press = function() {
    explorer.vy = 5;
    explorer.vx = 0;
  };
  down.release = function() {
    if (!up.isDown && explorer.vx === 0) explorer.vy = 0;
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  key.downHandler = function(event) {
    if(event.keyCode === key.code) {
      if(key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };
  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

function hitTestRectangle(r1, r2) {
  //Define the variables we'll need to calculate
  var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
  //hit will determine whether there's a collision
  hit = false;
  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;
  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;
  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;
  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;
  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {
    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {
      //There's definitely a collision happening
      hit = true;
    } else {
      //There's no collision on the y axis
      hit = false;
    }
  } else {
    //There's no collision on the x axis
    hit = false;
  }
  //`hit` will be either `true` or `false`
  return hit;
};

function contain(sprite, container, isTreasureTaken) {
  var  collision = undefined;

  if(sprite.x < container.x) {
    sprite.x = container.x;
    collision = "left";
  }

  if(sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = "right";
  }

  if(sprite.y < container.y) {
    sprite.y = container.y;
    collision = "top";
  }
  // sprite.y + sprite.height - нижний край спрайта
  if(sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = "bottom";
  }
  return collision;
}
