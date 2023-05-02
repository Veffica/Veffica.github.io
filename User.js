import { Group, 
    Object3D,
    Vector3,
    LoopOnce,
    Quaternion,
    Raycaster,
    AnimationMixer, 
    SphereGeometry, 
    MeshBasicMaterial, 
    Mesh } from './libs/three137/three.module.js';
import { GLTFLoader } from './libs/three137/GLTFLoader.js';
import { DRACOLoader } from './libs/three137/DRACOLoader.js';

class User{
constructor(game, pos, heading){
   this.root = new Group();
   this.root.position.copy( pos );
   this.root.rotation.set( 0, heading, 0, 'XYZ' );

   this.game = game;

   this.camera = game.camera;
   this.raycaster = new Raycaster();

   game.scene.add(this.root);

   this.loadingBar = game.loadingBar;

   this.load();

   this.initMouseHandler();
}

initMouseHandler(){
   this.game.renderer.domElement.addEventListener( 'click', raycast, false );
       
   const self = this;
   const mouse = { x:0, y:0 };
   
   function raycast(e){
       
       mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
       mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

       //2. set the picking ray from the camera position and mouse coordinates
       self.raycaster.setFromCamera( mouse, self.game.camera );    

       //3. compute intersections
       const intersects = self.raycaster.intersectObject( self.game.navmesh );
       
       if (intersects.length>0){
           const pt = intersects[0].point;
           console.log(pt);

           self.root.position.copy(pt);
       }	
   }
}

set position(pos){
   this.root.position.copy( pos );
}

addSphere(){
   const geometry = new SphereGeometry( 0.1, 8, 8 );
   const material = new MeshBasicMaterial( { color: 0xFF0000 });
   const mesh = new Mesh( geometry, material );
   this.root.add(mesh);
}

load(){
   const loader = new GLTFLoader( ).setPath(`${this.game.assetsPath}`);
   const dracoLoader = new DRACOLoader();
   dracoLoader.setDecoderPath( '../../libs/three137/draco/' );
   loader.setDRACOLoader( dracoLoader );
   
   // Load a glTF resource
   loader.load(
       // resource URL
       'player.glb',
       // called when the resource is loaded
       gltf => {
           this.root.add( gltf.scene );
           this.object = gltf.scene;

           const scale = .7;
           this.object.scale.set(scale, scale, scale);

           this.object.traverse( child => {
               if ( child.isMesh){
                   child.castShadow = true;
               }
           });

           this.animations = {};

           gltf.animations.forEach( animation => {
               this.animations[animation.name.toLowerCase()] = animation;
           })

           this.mixer = new AnimationMixer(gltf.scene);
       
           this.action = 'idle';

           this.ready = true;
       },
       // called while loading is progressing
       xhr => {
       },
       // called when loading has errors
       err => {
       }
   );
}

update(dt){
   if (this.mixer) this.mixer.update(dt);

}
}

export { User };