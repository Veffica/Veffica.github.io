import * as THREE from './libs/three137/three.module.js'
import { SFX } from './libs/SFX.js';

class NPC{
	constructor(options){
		const fps = options.fps || 30; //default fps
		
		this.name = options.name | 'NPC';
		
		this.animations = {};	
		
		options.app.scene.add(options.object);
		
		this.object = options.object;
		this.pathLines = new THREE.Object3D();
		this.pathColor = new THREE.Color(0xFFFFFF);
		options.app.scene.add(this.pathLines);

		this.showPath = options.showPath | false;

        this.waypoints = options.waypoints;

        this.dead = false;
		
        this.speed = options.speed;
        this.app = options.app;
        
        if (options.app.pathfinder){
            this.pathfinder = options.app.pathfinder;
            this.ZONE = options.zone;
            this.navMeshGroup = this.pathfinder.getGroup(this.ZONE, this.object.position);	
        }
		
		const pt = this.object.position.clone();
		pt.z += 10;
		this.object.lookAt(pt);
        
        if (options.animations){
            //Use this option to set multiple animations directly
            this.mixer = new THREE.AnimationMixer(options.object);
            options.animations.forEach( (animation) => {
                this.animations[animation.name.toLowerCase()] = animation;
            })
        }
	}

	//Adicionado pra eve pegar aleatoriamente um waypoint
    get randomWaypoint(){
		const index = Math.floor(Math.random()*this.waypoints.length);
		return this.waypoints[index];
	}

	get goKitchen(){
		const index = 4;
		return this.waypoints[index];
	}
	
	setTargetDirection(pt){
		const player = this.object;
		pt.y = player.position.y;
		const quaternion = player.quaternion.clone();
		player.lookAt(pt);
		this.quaternion = player.quaternion.clone();
		player.quaternion.copy(quaternion);
	}

	newPath(pt){
        const player = this.object;
        
        if (this.pathfinder===undefined){
            this.calculatedPath = [ pt.clone() ];
            //Calculate target direction
            this.setTargetDirection( pt.clone() );
            //this.action = 'walk';
            return;
        }

		if (this.sfx) this.sfx.play('footsteps'); //essa parte chamou
        
		console.log(`New path to ${pt.x.toFixed(1)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)}`);	

		const targetGroup = this.pathfinder.getGroup(this.ZONE, pt);
		const closestTargetNode = this.pathfinder.getClosestNode(pt, this.ZONE, targetGroup);
		
		// Calculate a path to the target and store it
		this.calculatedPath = this.pathfinder.findPath(player.position, pt, this.ZONE, this.navMeshGroup);

		if (this.calculatedPath && this.calculatedPath.length) {
			this.action = 'walk';
			
			this.setTargetDirection( this.calculatedPath[0].clone() );

			
		} 
	}
	
	set action(name){
		if (this.actionName == name.toLowerCase()) return;
				
		const clip = this.animations[name.toLowerCase()];

		if (clip!==undefined){
			const action = this.mixer.clipAction( clip );
			switch(name){
				case 'shot':
					action.clampWhenFinished = true;
					action.setLoop( THREE.LoopOnce );
					if (this.sfx) this.sfx.play('groan');
					break;

				case 'run':
					if (this.sfx) this.sfx.play('atmos');
			}
			/*if (name=='shot'){
				action.clampWhenFinished = true;
				action.setLoop( THREE.LoopOnce );
				if (this.sfx) this.sfx.play('groan');
			}else if(name=='run'){
				if (this.sfx) this.sfx.play('atmos');
			}*/
			action.reset();
			const nofade = this.actionName == 'shot';
			this.actionName = name.toLowerCase();
			action.play();
			if (this.curAction){
				if (nofade){
					this.curAction.enabled = false;
				}else{
					this.curAction.crossFadeTo(action, 0.5);
				}
			}
			this.curAction = action;
		}
	}

	initSounds(){
		const assetsPath = `${this.app.assetsPath}factory/sfx/`;
		this.sfx = new SFX(this.app.camera, assetsPath, this.app.listener);
		this.sfx.load('footsteps', true, 0.6, this.object);
		this.sfx.load('groan', false, 0.6, this.object);
		this.sfx.load('shot', false, 0.6, this.object);
		this.sfx.load('atmos', false, 0.6, this.object);
	}
	
	update(dt){
		const speed = this.speed;
		const player = this.object;
		
		if (this.mixer) this.mixer.update(dt);
		
        if (this.calculatedPath && this.calculatedPath.length) {
            const targetPosition = this.calculatedPath[0];

            const vel = targetPosition.clone().sub(player.position);
            
            let pathLegComplete = (vel.lengthSq()<0.01);
            
            if (!pathLegComplete) {
                //Get the distance to the target before moving
                const prevDistanceSq = player.position.distanceToSquared(targetPosition);
                vel.normalize();
                // Move player to target
                if (this.quaternion) player.quaternion.slerp(this.quaternion, 0.1);
                player.position.add(vel.multiplyScalar(dt * speed));
                //Get distance after moving, if greater then we've overshot and this leg is complete
                const newDistanceSq = player.position.distanceToSquared(targetPosition);
                pathLegComplete = (newDistanceSq > prevDistanceSq);
            } 
            
            if (pathLegComplete){
                // Remove node from the path we calculated
                this.calculatedPath.shift();
                if (this.calculatedPath.length==0){ //Quando chega no ultimo ponto do caminho
					player.position.copy( targetPosition );
                    this.action = 'idle';
					if (this.sfx) this.sfx.stop('footsteps');
                }else{
                    this.setTargetDirection( this.calculatedPath[0].clone() ); //Faz o corpo da eve rotacionar em direcao ao ponto que ela está indo
                }
            }
			
        }else{
            //if (this.waypoints!==undefined) this.newPath(this.goKitchen); //Faz o primeiro ponto ser o da cozinha
        }
    }
}

export { NPC };