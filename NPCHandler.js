import {NPC} from './NPC.js';
import {GLTFLoader} from '../libs/three137/GLTFLoader.js';
import {DRACOLoader} from '../libs/three137/DRACOLoader.js';
import {Skeleton, Raycaster} from '../libs/three137/three.module.js';

let counter = 0;
let npc;

class NPCHandler{
    constructor( game ){
        this.game = game;
		//this.loadingBar = this.game.loadingBar;
        this.load();
		this.initMouseHandler();
	//	this.checkForGamepad();

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

    load(){
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
			npc.object.position.copy(this.waypoints[3]); //Ponto inicial em que eve estará: corredor
			npc.action = 'idle';
			//npc.newPath(this.waypoints[4]); //Ponto que a eve vai: porta de entrada
			//npc.object.position.set(1.63,-0.13,-6.60);
			
			this.npcs.push(npc);

			//Adding gamepad
			this.checkForGamepad();

			document.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
       		document.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);

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

	checkForGamepad(){
        const gamepads = {};

        const self = this;

        function gamepadHandler(event, connecting) {
            const gamepad = event.gamepad;

            if (connecting) {
                gamepads[gamepad.index] = gamepad;
                self.gamepad = gamepad;
            }
        }

        //document.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
        //document.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);
    }

	gamepadHandler(){
        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[this.gamepad.index];
        
        const fire = gamepad.buttons[4].pressed;
       
        if (fire) {
			console.log('apertou o botão e deu certo')
			const SpeechRecognition =  window.SpeechRecognition || window.webkitSpeechRecognition;
	 
	  let recognition = new SpeechRecognition(); //criou uma instance

	  recognition.onstart = () => {  //inicia quando aperta espaço
		  //console.log("starting listening, speak in microphone");
	  }

	  recognition.onspeechend = () => {  //inicia quando para de ouvir pessoa falando
		  //console.log("stopped listening");
		  recognition.stop();
	  }

	  recognition.onresult = (result) => {   //mostra no console o resultado da frase falada atraves de uma arrow function
	  var frase = result.results[0][0].transcript;
	  console.log(frase);
	  
			  switch(frase){
						  
				case 'go to the kitchen':
					increment();
					npc.newPath(npc.waypoints[0]);
					break;

				case 'go to the Kitchen':
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
					npc.action='Shot'
					increment();
					//npc.newPath(npc.waypoints[4]);
					break;

					
				case 'shoot':
					increment();
					npc.action='Firing';

					//npc.newPath(npc.waypoints[4]);
					break;
				
				default:
					npc.action = 'Idle'; 
  
				  }		
	   }			   
	   recognition.start();
		}
    }

    update(dt){
        if (this.npcs) this.npcs.forEach( npc => npc.update(dt) );

		if (this.gamepad){
            this.gamepadHandler();
    }
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

function voice(){
	const SpeechRecognition =  window.SpeechRecognition || window.webkitSpeechRecognition;
	 
	  let recognition = new SpeechRecognition(); //criou uma instance

	  recognition.onstart = () => {  //inicia quando aperta espaço
		  //console.log("starting listening, speak in microphone");
	  }

	  recognition.onspeechend = () => {  //inicia quando para de ouvir pessoa falando
		  //console.log("stopped listening");
		  recognition.stop();
	  }

	  recognition.onresult = (result) => {   //mostra no console o resultado da frase falada atraves de uma arrow function
	  var frase = result.results[0][0].transcript;
	  console.log(frase);
	  
			  switch(frase){
						  
				case 'go to the kitchen':
					increment();
					npc.newPath(npc.waypoints[0]);
					break;

				case 'go to the Kitchen':
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
					npc.action='Shot'
					increment();
					//npc.newPath(npc.waypoints[4]);
					break;

					
				case 'shoot':
					increment();
					npc.action='Firing';

					//npc.newPath(npc.waypoints[4]);
					break;
				
				default:
					npc.action = 'Idle'; 
  
				  }		
	   }			   
	   recognition.start();
}

export { NPCHandler };