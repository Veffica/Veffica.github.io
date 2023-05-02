class Umaclass{
    constructor(){

const container = document.createElement( 'div' );
document.body.appendChild( container );

    var start;

    var rAF = window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.requestAnimationFrame;

    var rAFStop = window.mozCancelRequestAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.cancelRequestAnimationFrame;

window.addEventListener("gamepadconnected", function() {
//  var gp = navigator.getGamepads()[0];
//  gamepadInfo.innerHTML = "Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";

  gameLoop();
  start = rAF(gameLoop);
});

window.addEventListener("gamepaddisconnected", function() {
  //gamepadInfo.innerHTML = "Waiting for gamepad.";

  rAFStop(start); //Faz o gameloop parar de rodar
});

function gameLoop() {
    if(navigator.webkitGetGamepads) {
      var gp = navigator.webkitGetGamepads()[0];
  
      if(gp.buttons[0] == 1) {
        console.log('botao 0');
      } else if(gp.buttons[1] == 1) {
        console.log('botao 1');;
      } else if(gp.buttons[2] == 1) {
          console.log('botao 2');;
      } else if(gp.buttons[3] == 1) {
          console.log('botao 3');;
      }else if(gp.buttons[4] == 1) {
          console.log('botao 4');;
      }else if(gp.buttons[5] == 5) {
          console.log('botao 3');;
      }
    } else {
      var gp = navigator.getGamepads()[0];
  
      if(gp.buttons[0].value > 0 || gp.buttons[0].pressed == true) {
          console.log('botao 0 segundo');
      } else if(gp.buttons[1].value > 0 || gp.buttons[1].pressed == true) {
          console.log('botao 1 segundo');
      } else if(gp.buttons[2].value > 0 || gp.buttons[2].pressed == true) {
          console.log('botao 2 segundo');
      } else if(gp.buttons[3].value > 0 || gp.buttons[3].pressed == true) {
          console.log('botao 3 segundo');;
      }else if(gp.buttons[4].value > 0 || gp.buttons[3].pressed == true) {
        console.log('botao 4 segundo');;
    }else if(gp.buttons[5].value > 0 || gp.buttons[3].pressed == true) {
        console.log('botao 5 segundo');;
    }
    }
  
  
    var start = rAF(gameLoop);
  };


    }
}

export {Umaclass};