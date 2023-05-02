import * as THREE from 'three';

			import { VRButton } from 'three/addons/webxr/VRButton.js';
            import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
            import {Pathfinding} from './libs/pathfinding/Pathfinding.js';

            import { NPCHandler } from './NPCHandler.js';
            
            import { GazeController } from './libs/GazeController.js'

            import {JoyStick} from './libs/Toon3D.js';
            import { SFX } from './libs/SFX.js';

            var frase = 'sem informação em frase';
            var gazeBandeira = false;

            class Game{
                constructor(){
                this.container = document.createElement( 'div' );
				document.body.appendChild( this.container );

                this.scene = new THREE.Scene();
				this.scene.background = new THREE.Color( 0x505050 );

                this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 );
				//this.camera.position.set( 0, 1.6, 3 );
                this.camera.position.set( 0, 1.6, 0 );

                this.dolly = new THREE.Object3D(  );
                this.dolly.position.set(0, 0, 0);
                this.dolly.add( this.camera );
                this.dummyCam = new THREE.Object3D();
                this.camera.add( this.dummyCam );
                
                this.scene = new THREE.Scene();
                this.scene.add( this.dolly );

				this.scene.add( this.camera );

                const ambient = new THREE.HemisphereLight(0xFFFFFF, 0xAAAAAA, 0.8);
                this.scene.add(ambient);

                this.clock = new THREE.Clock();
                this.up = new THREE.Vector3(0,1,0);
                this.origin = new THREE.Vector3();
                this.workingVec3 = new THREE.Vector3();
                this.workingQuaternion = new THREE.Quaternion();
                this.raycaster = new THREE.Raycaster();

				this.renderer = new THREE.WebGLRenderer( { antialias: true } );
				this.renderer.setPixelRatio( window.devicePixelRatio );
				this.renderer.setSize( window.innerWidth, window.innerHeight );
				//this.renderer.outputEncoding = THREE.sRGBEncoding;
				this.renderer.xr.enabled = true;
				this.container.appendChild( this.renderer.domElement );

				//

                window.addEventListener( 'resize', this.onWindowResize.bind(this) );


				//

				document.body.appendChild( VRButton.createButton( this.renderer ) );

                this.animate();
                this.load();

                }

                load(){
             
                    const self = this;
                     this.loadEnvironment()
                     this.npcHandler = new NPCHandler(this);
                     console.log(this.npcHandler.botao);
             
                    //Add para testar no celular
                         self.joystick = new JoyStick({
                             onMove: self.onMove.bind(self)
                         });        
                 }

                 loadEnvironment(){
                    const loader = new GLTFLoader( );
                                        
                    // Load a glTF resource
                    loader.load(
                        // resource URL
                        //'house8.glb',
                        'assets/house9.glb',
                        // called when the resource is loaded
                        gltf => {
            
                            this.scene.add( gltf.scene );
                            this.factory = gltf.scene;
            
                            gltf.scene.traverse( child => {
                                if (child.isMesh){
                                    if (child.name == 'PROXY'){
                                        this.navmesh = child;
                                        this.navmesh.geometry.rotateX( Math.PI/2 );
                                        this.navmesh.quaternion.identity();
                                        this.navmesh.position.set(0,0,0);
                                        child.material.visible = false;
                                        child.material.transparent = true;
                                        child.material.opacity = 0.5;
                
                                    }
                                }
                            });
                        
                            this.scene.add(this.navmesh);
            
                            this.renderer.setAnimationLoop( this.render.bind(this) );
            
                            //this.initPathfinding(self.navmesh); //qualquer coisa muda pra this.navmesh
            
                            //this.loadingBar.visible = !this.loadingBar.loaded;
                            //Added for VR:
                            //self.setupXR();
                        },
                        // called while loading is progressing
                        xhr => {
            
                            //this.loadingBar.update('environment', xhr.loaded, xhr.total);
                            
                        },
                        // called when loading has errors
                        err => {
            
                            console.error( err );
            
                        }
                    );
                }
                
                initPathfinding(navmesh){		
                    this.waypoints = [
                        new THREE.Vector3(1.63,-0.13,-6.60), //cozinha
                        new THREE.Vector3(-4.53,-0.13,-5.19), //porta de entrada
                        new THREE.Vector3(-2.67,-0.13,-8.87), //sala
                        new THREE.Vector3(-1.21,-0.13,-1.15), //corredor
                        new THREE.Vector3(-1.1,-0.13,-5.6) //corredor perto do sofa
                    ];
                    this.pathfinder = new Pathfinding();
                    this.pathfinder.setZoneData('factory', Pathfinding.createZone(navmesh.geometry, 0.02));
                    if (this.npcHandler.gltf !== undefined) this.npcHandler.initNPCs();
                }

                onWindowResize() {

                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
    
                    this.renderer.setSize( window.innerWidth, window.innerHeight );
    
                }

                animate() {

                    this.renderer.setAnimationLoop( this.render.bind(this) );
    
                }

                render() {

                    this.renderer.render(this.scene, this.camera);    
                }

                startRendering(){
                    this.renderer.setAnimationLoop( this.render.bind(this) );
                    
                    this.initSounds(this);
                }

                initSounds(){
                    this.listener = new THREE.AudioListener();
                    this.camera.add(this.listener);
                    this.sfx = new SFX(this.camera,`${this.assetsPath}factory/sfx/`, this.listener);
                    this.sfx.load('atmos');
                    this.npcHandler.npcs.forEach(npc => npc.initSounds());
                }
            
                //talvez essa seja a parte responsável pela inversão
                onMove( forward, turn ){
                    if (this.dolly){
                        this.dolly.userData.forward = forward; 
                        this.dolly.userData.turn = -turn;
                    }
                }

                moveDolly(dt){

                    if (this.navmesh === undefined) return;
                    
                    const wallLimit = 1.3;
                    const speed = 0.5;
                    let pos = this.dolly.position.clone();
                    pos.y += 1;
                    
                    let dir = new THREE.Vector3();
                    //Store original dolly rotation
                    const quaternion = this.dolly.quaternion.clone();
                    //Get rotation for movement from the headset pose
                    this.dolly.quaternion.copy( this.dummyCam.getWorldQuaternion(this.workingQuaternion) );
                    this.dolly.getWorldDirection(dir);
                    dir.negate();
                    this.raycaster.set(pos, dir);
                    
                    let blocked = false;
                    
                    let intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance < wallLimit) blocked = true;
                    }
                    
                    if (!blocked){
                        this.dolly.translateZ(-dt*speed);
                        pos = this.dolly.getWorldPosition( this.origin );
                    }
                    
                    //cast left
                    dir.set(-1,0,0);
                    dir.applyMatrix4(this.dolly.matrix);
                    dir.normalize();
                    this.raycaster.set(pos, dir);
            
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance<wallLimit) this.dolly.translateX(wallLimit-intersect[0].distance);
                    }
            
                    //cast right
                    dir.set(1,0,0);
                    dir.applyMatrix4(this.dolly.matrix);
                    dir.normalize();
                    this.raycaster.set(pos, dir);
            
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance<wallLimit) this.dolly.translateX(intersect[0].distance-wallLimit);
                    }
            
                    //cast down
                    dir.set(0,-1,0);
                    pos.y += 1.5;
                    this.raycaster.set(pos, dir);
                    
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        this.dolly.position.copy( intersect[0].point );
                    }
            
                    //Restore the original rotation
                    this.dolly.quaternion.copy( quaternion );
                }
                   
                moveDollyJoystick(dt){
                    if (this.navmesh === undefined) return;
                    
                    const wallLimit = 1.3;
                    const speed = 0.5;
                    let pos = this.dolly.position.clone();
                    pos.y += 1;
                    
                    let dir = new THREE.Vector3();
                    //Store original dolly rotation
            
                //    if(this.joystick===undefined){
                //        const quaternion = this.dolly.quaternion.clone();
                //        //Get rotation for movement from the headset pose
                //        this.dolly.quaternion.copy( this.dummyCam.getWorldQuaternion(this.workingQuaternion) );
                //        this.dolly.getWorldDirection(dir);
                //        dir.negate();
                //    } else {
                        this.dolly.getWorldDirection(dir);
                        if(this.dolly.userData.forward>0){
                            dir.negate();
                        }else{
                            dt = -dt;
                //        }
                    }
            
                    this.raycaster.set(pos, dir);
                    
                    let blocked = false;
                    
                    let intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance < wallLimit) blocked = true;
                    }
                    
                    if (!blocked){
                        this.dolly.translateZ(-dt*speed);
                        pos = this.dolly.getWorldPosition( this.origin );
                    }
                    
                    //cast left
                    dir.set(-1,0,0);
                    dir.applyMatrix4(this.dolly.matrix);
                    dir.normalize();
                    this.raycaster.set(pos, dir);
            
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance<wallLimit) this.dolly.translateX(wallLimit-intersect[0].distance);
                    }
            
                    //cast right
                    dir.set(1,0,0);
                    dir.applyMatrix4(this.dolly.matrix);
                    dir.normalize();
                    this.raycaster.set(pos, dir);
            
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        if (intersect[0].distance<wallLimit) this.dolly.translateX(intersect[0].distance-wallLimit);
                    }
            
                    //cast down
                    dir.set(0,-1,0);
                    pos.y += 1.5;
                    this.raycaster.set(pos, dir);
                    
                    intersect = this.raycaster.intersectObject(this.navmesh);
                    if (intersect.length>0){
                        this.dolly.position.copy( intersect[0].point );
                    }
            
                    //Restore the original rotation
                    //this.dolly.quaternion.copy( quaternion ); TIREI PARA TESTAR COM JOYSTICK PQ TAVA DANDO ERRO
                }

                render( timestamp, frame ){
                    const dt = this.clock.getDelta();
            
                    let moved = false;
            
                    //Adding joystick part
                    if (this.joystick !== undefined ){
                        if(this.dolly.userData.forward !== undefined){
                            if(this.dolly.userData.forward !== 0){
                                this.moveDollyJoystick(dt);
                                moved = true;
                            }
                            this.dolly.rotateY(this.dolly.userData.turn*dt);
                        }
                    }
            
            
                    if (this.npcHandler !== undefined ) this.npcHandler.update(dt);
            
                    if(this.npcHandler.botao){
                      console.log('botão ativado');
                    }
                    
                    if (this.renderer.xr.isPresenting===false){
                        //this.fullsize();
                    }
            
                    if (this.renderer.xr.isPresenting){
            
                        //I added
                        let moveGaze = false;
                    
                        //if ( gazeBandeira && this.gazeController!==undefined){
                            if ( this.npcHandler.botao && this.gazeController!==undefined || gazeBandeira){
                            this.gazeController.update();
                            console.log('chamou');
                            moveGaze = (this.gazeController.mode == GazeController.Modes.MOVE);
                        }
            
                        if (this.selectPressed || moveGaze){
                            this.moveDolly(dt);
                            if (this.boardData){
                                const scene = this.scene;
                                const dollyPos = this.dolly.getWorldPosition( new THREE.Vector3() );
                                let boardFound = false;
                                Object.entries(this.boardData).forEach(([name, info]) => {
                                    const obj = scene.getObjectByName( name );
                                    if (obj !== undefined){
                                        const pos = obj.getWorldPosition( new THREE.Vector3() );
                                    }
                                });
                            }
                        }
                        //finish what I added
            
                    }
                    
                    if ( this.immersive != this.renderer.xr.isPresenting){
                        this.onWindowResize();
                        this.immersive = this.renderer.xr.isPresenting;
                    }
            
                    if (this.controller !== undefined) this.controller.update(dt);
                    
                    this.renderer.render(this.scene, this.camera); //apagar esse
                } //nao pegar esse

            }

            
function keyDDown(e){  
				
    if (e.code=='KeyA'){
        //console.log('apertou espaço');
        //voiceSecond()
        //connectionTimeout();
        gazeBandeira = !gazeBandeira;
        console.log(gazeBandeira);
    }
}

function voiceSecond(){
    console.log('chamou voice em game');

    const SpeechRecognition =  window.SpeechRecognition || window.webkitSpeechRecognition;

    let recognition = new SpeechRecognition(); //criou uma instance

    recognition.onstart = () => {  //inicia quando aperta espaço
        //console.log("starting listening, speak in microphone");
    }

    recognition.onspeechend = () => {  //inicia quando para de ouvir pessoa falando
        //console.log("stopped listening");
        recognition.stop();
    }

    recognition.onresult = function resultado(result){   //mostra no console o resultado da frase falada atraves de uma arrow function
    frase = result.results[0][0].transcript;
    console.log(frase);

    connectionTimeout(frase);

   // return frase;
    }
    recognition.start();

}

function connectionTimeout(para){
    frase = frase;

    console.log(frase);
    switch(frase){
        
    case 'hello':
    console.log('caminhando e cantando, seguindo a canção');
    gazeBandeira = true;
    break;

    case 'stop':
    console.log('parou');
    gazeBandeira = false;
    break;

    default:
    //console.log('nothing happened'); 

    }
}

function controle(){ 
      var start;
  
      var rAF = window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.requestAnimationFrame;
  
      window.addEventListener("gamepadconnected", function() {

      gameLoop();
      start = rAF(gameLoop);
  });
  
  function gameLoop() {
      
        var gp = navigator.getGamepads()[0];
    
      if(gp.buttons[5].value > 0) {
          console.log('botao 5 segundo');;
      }
      }
    
    
      var start = rAF(gameLoop);
    };

            export {Game};