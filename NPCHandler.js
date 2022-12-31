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

			//Adding gamepad button 4 to record
			var gamepadInfo = document.getElementById("gamepad-info");
			var start;
			var rAF = window.mozRequestAnimationFrame ||
  			window.webkitRequestAnimationFrame ||
  			window.requestAnimationFrame;

			var rAFStop = window.mozCancelRequestAnimationFrame ||
			window.webkitCancelRequestAnimationFrame ||
			window.cancelRequestAnimationFrame;

			document.addEventListener("gamepadconnected", function() {
				var gp = navigator.getGamepads()[0];
				gamepadInfo.innerHTML = "Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";
			  
				if(navigator.webkitGetGamepads) {
					var gp = navigator.webkitGetGamepads()[0];
				
					if(gp.buttons[4] == 1) {
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
			  });

			  window.addEventListener("gamepaddisconnected", function() {
				gamepadInfo.innerHTML = "Waiting for gamepad.";
			  
				rAFStop(start);
			  });

			  if(navigator.webkitGetGamepads) {
				// Webkit browser that uses prefixes
				var interval = setInterval(webkitGP, 500);
			  }
			  
			  function webkitGP() {
				var gp = navigator.webkitGetGamepads()[0];
				if(gp) {
				  gamepadInfo.innerHTML = "Gamepad connected at index " + gp.index + ": " + gp.id + ". It has " + gp.buttons.length + " buttons and " + gp.axes.length + " axes.";
				  gameLoop();
				  clearInterval(interval);
				}
			  }



			//Adding press space to record
			document.addEventListener('keydown', keyDown);
		
			function keyDown(e){  
				
				if (e.code=='Space'){
		  
				   //console.log('pressed');
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
		});

		//this.loadingBar.visible = !this.loadingBar.loaded;

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

    update(dt){
        if (this.npcs) this.npcs.forEach( npc => npc.update(dt) );
    }
}

function increment(){
	counter = counter + 1;
	console.log(counter);
}

export { NPCHandler };