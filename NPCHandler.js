import {NPC} from './NPC.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from './libs/three/jsm/DRACOLoader.js';
import { Skeleton, Raycaster } from './libs/three/three.module.js';
import * as THREE from './libs/three137/three.module.js';

let counter = 0;
let npc;
let frase;
let gazeBandeira = false;
let botaoMic;

class NPCHandler{
    constructor( game ){
        this.game = game;
        this.botao;
        this.loadEve();
        this.npc
		this.checkForGamepad();		
}

	checkForGamepad(){
        const gamepads = {};

        const self = this;

        function gamepadHandler(event, connecting) {
            const gamepad = event.gamepad;

            if (connecting) {
                gamepads[gamepad.index] = gamepad;
                self.gamepad = gamepad;
            }else {
                delete self.gamepad;
                delete gamepads[gamepad.index];
                //if (self.touchController) self.showTouchController(true); 
            }
        }

      window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
      window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);
    }

	gamepadHandler(){
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.gamepad.index];
        const fire = gamepad.buttons[4].pressed;
        this.botao = gamepad.buttons[5].pressed;
        if (fire) {
			console.log('chamou voice por botão 4');
			voice();
		}

        else if(this.botao){
            console.log('apertou botao 5');
        }
    }

    //Esse update não pode tirar pq é ele que atualiza quando o botão é apertado
    update(dt){
        if (this.npcs) this.npcs.forEach( npc => npc.update(dt) );

        if (this.gamepad){  
            this.gamepadHandler();
        }
    }

	initMouseHandler(){
		const raycaster = new Raycaster();
    	this.game.renderer.domElement.addEventListener( 'click', raycast, false );
			
    	const self = this;
    	const mouse = { x:0, y:0 };

    	
    	function raycast(e){
    		
			mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

			//2. set the picking ray from the camera position and mouse coordinates
			raycaster.setFromCamera( mouse, self.game.camera );    

			//3. compute intersections
			const intersects = raycaster.intersectObject( self.game.navmesh );
			
			if (intersects.length>0){
				const pt = intersects[0].point;
				console.log(pt);
				self.npcs[0].newPath(pt, true);
			}	
		}
    }

    loadEve(){
        const loader = new GLTFLoader( ).setPath(`${this.game.assetsPath}`);
		const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../libs/three137/draco/' );
        loader.setDRACOLoader( dracoLoader );
        //this.loadingBar.visible = true;
		
		// Load a GLTF resource
		loader.load(
			// resource URL
			`eve2.glb`,
			// called when the resource is loaded
			gltf => {
				if (this.game.pathfinder){
					this.initNPCs(gltf);
				}else{
					this.gltf = gltf;
				}
			},
			// called while loading is progressing
			xhr => {

				//this.loadingBar.update( 'swat-guy', xhr.loaded, xhr.total );

			},
			// called when loading has errors
			err => {

				//console.error( err );

			}
		);
	}

	initNPCs(gltf = this.gltf){
		const gltfs = [gltf];
		this.waypoints= this.game.waypoints; //Adcionado pra Eve ir pros waypoints
		this.npcs = [];
		
		gltfs.forEach(gltf => {
			const object = gltf.scene;

			object.traverse(function(child){
				if (child.isMesh){
					child.castShadow = true;
				}
			});

			const options = {
				object: object,
				speed: 0.8,
				animations: gltf.animations,
				waypoints: this.waypoints,
				app: this.game,
				//showPath: false,
				zone: 'factory',
				name: 'swat-guy',
			};

			npc = new NPC(options);
			npc.object.position.copy(this.waypoints[1]); //Ponto inicial em que eve estará: corredor
			npc.object.scale.set(1.2,1.2,1.2);
			npc.action = 'idle';
			
			//npc.newPath(this.waypoints[2]); //Ponto que a eve vai: porta de entrada
			//npc.object.position.set(1.63,-0.13,-6.60);
			
			this.npcs.push(npc);

			//Adding press space to record e chama a funcão keydown
			document.addEventListener('keydown', keyDown);
			
		});

		this.game.startRendering();
	}

	get kitchenPoint(){
		return this.waypoints[0];
	}

	get doorPoint(){
		return this.waypoints[1];
	}

	get tvPoint(){
		return this.waypoints[2];
	}

	get corridorPoint(){
		return this.waypoints[3];
	}

	get sofaPoint(){
		return this.waypoints[4];
	}

}

function increment(){
	counter = counter + 1;
	console.log(counter);
}

function keyDown(e){  
				
	if (e.code=='Space'){
		voice();
	}
}	

function click(){
	console.log('chamou voice por click');
	changeMicColor();
	voice();
}

function changeMicColor(){
	botaoMic.style.cssText = "background:green;";
	setInterval(()=> { 	botaoMic.style.cssText = "background:pink;";
	},9000);
}



function voice(){

	console.log('chamou voice');
	const SpeechRecognition =  window.SpeechRecognition || window.webkitSpeechRecognition;

	  let recognition = new SpeechRecognition(); //criou uma instance

	  recognition.onstart = () => {  //inicia quando aperta espaço
	  }

	  recognition.onspeechend = () => {  //inicia quando para de ouvir pessoa falando
	  recognition.stop();
	  }

	  recognition.onresult = (result) => {   //mostra no console o resultado da frase falada atraves de uma arrow function
	  var fraseTwo = result.results[0][0].transcript;
	  var frase = fraseTwo.toLowerCase();
	  console.log(frase);

	  detection(frase);
	   }			   
	   recognition.start();
}

function detection(algo){

	frase = algo;	
	
	switch(frase){
						  
		case 'go to the kitchen':
			increment();
			npc.newPath(npc.waypoints[0]);
			break;

		case 'go to the kitchen.':
			increment();
			npc.newPath(npc.waypoints[0]);
			break;

		case 'door':
			increment();  
			npc.newPath(npc.waypoints[1]);
			//npc.action = 'firing';
			break;

		  case 'go to the TV room':
			//npc.action = 'Firing';
			increment(); 
			npc.newPath(npc.waypoints[2]);
			break;
		
		case 'go back':
			increment();
			npc.newPath(npc.waypoints[3]);
			npc.action='run';
			break;

		case 'go to the corridor':
			increment();
			npc.newPath(npc.waypoints[3]);
			break;
			
		case 'go to the middle':
			increment();
			npc.newPath(npc.waypoints[4]);
			break;

		case 'die':
			npc.action='shot'
			increment();
			//npc.newPath(npc.waypoints[4]);
			break;

			
		case 'shoot':
			increment();
			npc.action='Firing';

			//npc.newPath(npc.waypoints[4]);
			break;

        case 'hello':
            gazeBandeira = true;
            console.log(gazeBandeira);

		
		default:
			npc.action = 'Idle'; 

		  }	
}

export { NPCHandler };