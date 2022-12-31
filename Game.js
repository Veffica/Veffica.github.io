import * as THREE from '../libs/three137/three.module.js';
import { GLTFLoader } from '../libs/three137/GLTFLoader.js';
//import { RGBELoader } from '../libs/three137/RGBELoader.js';
import { NPCHandler } from './NPCHandler.js';
import { User } from './User.js';
import { Controller } from './Controller.js';
//import { LoadingBar } from '../libs/LoadingBar.js';
import { Pathfinding } from '../libs/pathfinding/Pathfinding.js';
import {OrbitControls} from '../libs/three137/OrbitControls.js';

class Game{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.clock = new THREE.Clock();

        //this.loadingBar = new LoadingBar();
        //this.loadingBar.visible = false;

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.001, 5000 );


		this.camera.position.set(-3.83, 1.5, -5.11);
		
		let col = 0x201510;
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( col );
		this.scene.fog = new THREE.Fog( col, 100, 200 );

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
		this.scene.add(ambient);

        const light = new THREE.DirectionalLight();
        light.position.set( 4, 20, 20 );
		light.target.position.set(-2, 0, 0);
		light.castShadow = true;
		//Set up shadow properties for the light
		light.shadow.mapSize.width = 1024; 
		light.shadow.mapSize.height = 512; 
		light.shadow.camera.near = 0.5; 
		light.shadow.camera.far = 50;
		const d = 30; 
		light.shadow.camera.left = -d;
		light.shadow.camera.bottom = -d*0.25;
		light.shadow.camera.right = light.shadow.camera.top = d;
		this.scene.add(light);
		this.light = light;
	
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.shadowMap.enabled = true;
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        //this.setEnvironment();

		const controls = new OrbitControls(this.camera, this.renderer.domElement)
		controls.update();
		
		this.load();
		
		window.addEventListener( 'resize', this.resize.bind(this) );
	}

	initPathfinding(navmesh){
		//let dinner = new THREE.Vector3(1.63,-0.13,-6.60);
		//let kitchen = new THREE.Vector3(-4.53,-0.13,-5.19);
		//let tvRoom = new THREE.Vector3(-2.67,-0.13,-8.87);
		//let corridor = new THREE.Vector3(-1.21,-0.16,-1.15);

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
	
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }
    
    /*setEnvironment(){
        const loader = new RGBELoader().setPath(this.assetsPath);
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( 'hdr/factory.hdr', 
		texture => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          this.scene.environment = envMap;

		  this.loadingBar.visible = !this.loadingBar.loaded;
        }, 
		xhr => {
			this.loadingBar.update( 'envmap', xhr.loaded, xhr.total );
		},
		err => {
            console.error( err.message );
        } );
    }*/
    
	load(){
        this.loadEnvironment();
		this.npcHandler = new NPCHandler(this);
		this.user = new User(this, new THREE.Vector3(-3.83, -0.13, -5.11), 0.875 ); //Os tres parametros sao: a propria classe Game, a posição onde quero que o player fique, a direção em que ele vai apontar
			//o head está 0.875 para fazer a camera apontar com as setas para a direção correta
			this.user.rotateY = Math.PI/4;
	}

    loadEnvironment(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}`);
        
        //this.loadingBar.visible = true;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'house5.glb',
			// called when the resource is loaded
			gltf => {

				this.scene.add( gltf.scene );
                this.factory = gltf.scene;

				gltf.scene.traverse( child => {
					if (child.isMesh){
						if (child.name == 'navmesh'){
							this.navmesh = child;
							this.navmesh.geometry.rotateX( Math.PI/2 );
							this.navmesh.quaternion.identity();
							this.navmesh.position.set(0,0,0);
							child.material.visible = true;
							child.material.transparent = true;
							child.material.opacity = 0.5;
	
						}
					}
				});

				this.controller = new Controller(this);

				this.scene.add(this.navmesh);

                this.renderer.setAnimationLoop( this.render.bind(this) );

				this.initPathfinding(this.navmesh);

				//this.loadingBar.visible = !this.loadingBar.loaded;
			},
			// called while loading is progressing
			xhr => {

				//this.loadingBar.update('environment', xhr.loaded, xhr.total);
				
			},
			// called when loading has errors
			err => {

				//console.error( err );

			}
		);
	}			
    
	startRendering(){
		this.renderer.setAnimationLoop( this.render.bind(this) );
	}

	render() {
		const dt = this.clock.getDelta();

		if (this.npcHandler !== undefined ) this.npcHandler.update(dt);
		if (this.user !== undefined && this.user.ready ){
			this.user.update(dt);
			if (this.controller !== undefined) this.controller.update(dt);
		}

        this.renderer.render( this.scene, this.camera );

    }
}

export { Game };