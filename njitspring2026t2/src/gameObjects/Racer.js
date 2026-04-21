import { ExtendedObject3D } from "@enable3d/phaser-extension";
import { THREE } from '@enable3d/phaser-extension';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export class Transform
{
    constructor(position, rotation)
    {
        this.position = position
        this.rotation = rotation
    }
}

export default class Racer extends ExtendedObject3D 
{
    constructor(scene, spawnTransform, key, character) {
        super({key});

        this.position.copy(spawnTransform.position);
        this.rotation.copy(spawnTransform.rotation);

        this.raceScene = scene;
        this.key = key;
        this.maxSpeed = 15;
        this.currSpeed = 0;
        this.acceleration = 0.5;
        this.breakForce = 0.5;
        this.friction = .98;
        this.maxReverseSpeed = 10;
        this.turnSpeed = 1;

        this.eye1;
        this.eye2;
        this.randomInteger = 100;
        this.counter = 0;

        this.drifting = false;
        this.driftDir = 0;          
        this.driftCharge = 0;       
        this.driftTier1 = 150;      
        this.driftTier2 = 360;      
        this.driftTier3 = 600;      
        this.driftBoostSpeed = 0;
        this.driftBoostDecay = 0.4;

        this.visualPivot = new THREE.Object3D();
        this.add(this.visualPivot);
        this.driftTiltTarget = 0;   
        this.driftTiltMax = 0.35;   
        this.driftTiltSpeed = 0.08; 
        
        this.driftIndicatorLeft  = this._makeDriftSprite(-0.8);
        this.driftIndicatorRight = this._makeDriftSprite( 0.8);
        this.visualPivot.add(this.driftIndicatorLeft);
        this.visualPivot.add(this.driftIndicatorRight);

        this.driftTierColors = [null, 0xffee00, 0xff0000, 0x00aaff]; //color boxes behind car when drifting colors.

        this.chooseCharacter(character); 
        
        scene.third.add.existing(this);
        scene.third.physics.add.existing(this, {
            shape: 'capsule',
            mass: 90,
            collisionFlags: 0,
            friction: 0.9,
            linearDamping: 0.1,
        });

        //dynamic
        this.body.setCollisionFlags(0);
        //allow rotation on all axes and movement as well
        //movments
        this.body.setLinearFactor(1, 1, 1);
        //rotation
        this.body.setAngularFactor(0, 0, 0);

        //raycasting to slide through mesh edges
        this.trackMesh = null;
        this.raycaster = new THREE.Raycaster();
        this.suspendStiff = 180;
        this.suspendDamping = 28;
        this.targetHeight = 2.4;

        this.checkpointsCrossed = []
        this.lapsCompleted = 0

        // this.add.text(640,300, key, {
        //         fontFamily: 'Arial',
        //         fontSize: '30px',
        //         color: '#ffffff',
        //         align: 'center',
        //         fixedWidth: 300,
        //         backgroundColor: '#2d2d2d00'
        // }).setPadding(5).setOrigin(0.5);
    }
   
    //get track mesh data
    setTrackMesh(mesh) {
        this.trackMesh = mesh;
    }

    stickToTrack() {
        if (!this.trackMesh) {
            return;
        }

        const moveDir = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
        const speed = moveDir.length()

        let lookAhead = 0;
        if(speed > 0.1){
            moveDir.normalize();
            lookAhead = Math.min(2.5, speed * 0.12);
        }
        //track player 
        const rayOrigin = this.position.clone().add(moveDir.multiplyScalar(lookAhead));
        rayOrigin.y += 15;
        const rayDir = new THREE.Vector3(0, -1, 0);
        this.raycaster.set(rayOrigin, rayDir);
        const intersects = this.raycaster.intersectObject(this.trackMesh, true);

        if (intersects.length > 0) {
            const hitP = intersects[0].point;
            const targetY = hitP.y + this.targetHeight;
            const currY = this.position.y;
            const difference = targetY - currY;

            const speedFactor = Math.min(1.8, 1 + speed * 0.03);

            const springForce = difference * this.suspendStiff * speedFactor;
            const dampingForce = -this.body.velocity.y * this.suspendDamping;
            let totalForce = springForce + dampingForce;

            if(currY < targetY - 0.3){
                const sinkAmount = targetY - currY;
                totalForce += Math.min(260, sinkAmount * 190 * speedFactor);

                if(this.body.velocity.y < -5){
                    this.body.setVelocity(
                        this.body.velocity.x,
                        -5,
                        this.body.velocity.z
                    );
                }
            }

            this.body.applyForce(0, totalForce, 0);

        } else {
            //gravity 
            this.body.applyForce(0, -30, 0);

        }


        if (Math.abs(this.body.velocity.y) > 25) {
            this.body.setVelocity(this.body.velocity.x, Math.sign(this.body.velocity.y) *25, this.body.velocity.z);
        }
    }

    _makeDriftSprite(xOffset)
    {
        const mat = new THREE.SpriteMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(xOffset, 0.2, -1.2);
        sprite.scale.set(0.6, 0.6, 1);
        return sprite;
    }

    _updateDriftIndicators()
    {
        const tier = this.getDriftTier();
        const active = this.drifting && tier > 0;
        [this.driftIndicatorLeft, this.driftIndicatorRight].forEach(sprite => {
            sprite.material.opacity = active ? 0.85 : 0;
            if (active) sprite.material.color.setHex(this.driftTierColors[tier]);
        });
    }

    updateVisualTilt() //drifting rotation kart
    {
        this.visualPivot.rotation.y += (this.driftTiltTarget - this.visualPivot.rotation.y) * this.driftTiltSpeed;
    }

    startDrift(direction, turnSide)
    {
        if (this.drifting) return;
        this.drifting = true;
        this.driftDir = (turnSide === 'left') ? 1 : -1;
        this.driftCharge = 0;
        this.driftTiltTarget = this.driftDir * this.driftTiltMax;
    }

    updateDrift(direction, steerSide)
    {
        this.driftCharge++;

        const steerInput = (steerSide === 'left') ? 1 : (steerSide === 'right') ? -1 : 0;
        const withDrift   = this.driftDir * steerInput > 0; 
        const againstDrift = this.driftDir * steerInput < 0;

        let rotSpeed;
        if (withDrift)         rotSpeed = this.turnSpeed * 2.0;  
        else if (againstDrift) rotSpeed = this.turnSpeed * 0.2;  
        else                   rotSpeed = this.turnSpeed * 1.3;  

        this.body.setAngularVelocityY(this.driftDir * rotSpeed);

        
        const driftBlend = 0.18; 
        const targetX = Math.sin(direction) * this.currSpeed;
        const targetZ = Math.cos(direction) * this.currSpeed;
        const x = targetX * driftBlend + this.body.velocity.x * (1 - driftBlend);
        const z = targetZ * driftBlend + this.body.velocity.z * (1 - driftBlend);
        this.body.setVelocity(x, this.body.velocity.y, z);

        this.stickToTrack();
        this.updateVisualTilt();
    }


    endDrift()
    {
        if (!this.drifting) return;
        this.drifting = false;

        if      (this.driftCharge >= this.driftTier3) { this.driftBoostSpeed = this.maxSpeed * 1.4;  this.driftBoostDecay = 0.2;  }
        else if (this.driftCharge >= this.driftTier2) { this.driftBoostSpeed = this.maxSpeed * 0.9;  this.driftBoostDecay = 0.3;  }
        else if (this.driftCharge >= this.driftTier1) { this.driftBoostSpeed = this.maxSpeed * 0.28; this.driftBoostDecay = 0.5;  }
        else                                          { this.driftBoostSpeed = 0; }

        this.driftCharge = 0;
        this.driftDir = 0;
        this.driftTiltTarget = 0; 
    }


    applyDriftBoost(direction)
    {
        if (this.driftBoostSpeed <= 0) return;


        this.currSpeed = this.maxSpeed + this.driftBoostSpeed;
        this.driftBoostSpeed = Math.max(0, this.driftBoostSpeed - this.driftBoostDecay);

        const x = Math.sin(direction) * this.currSpeed;
        const z = Math.cos(direction) * this.currSpeed;
        this.body.setVelocity(x, this.body.velocity.y, z);
    }

    getDriftTier()
    {
        if (!this.drifting) return 0;
        if (this.driftCharge >= this.driftTier3) return 3;
        if (this.driftCharge >= this.driftTier2) return 2;
        if (this.driftCharge >= this.driftTier1) return 1;
        return 0;
    }

    moveForward(direction) {

        if (this.currSpeed < this.maxSpeed) {
            this.currSpeed += this.acceleration;
            if (this.currSpeed >= this.maxSpeed) {
                this.currSpeed = this.maxSpeed;
            }
        }
        //console.log(direction)
        
        const x = Math.sin(direction) * this.currSpeed;
        const y = this.body.velocity.y;
        const z = Math.cos(direction) * this.currSpeed;
        this.body.setVelocity(x, y, z);
        this.stickToTrack();
        
    }

    moveBackward(direction) {
        if (this.currSpeed > 0) {
            this.currSpeed -= this.breakForce;
            if (this.currSpeed < 0) {
                this.currSpeed = 0;
            }
        } else {
            this.currSpeed -= this.acceleration * 0.6;
            if (this.currSpeed < -this.maxReverseSpeed) {
                this.currSpeed = -this.maxReverseSpeed;
            }
        }
        const x = Math.sin(direction) * this.currSpeed;
        const y = this.body.velocity.y;
        const z = Math.cos(direction) * this.currSpeed;
        this.body.setVelocity(x, y, z);
        this.stickToTrack();
    }

    turnLeft() {
        this.body.setAngularVelocityY(this.turnSpeed);
        this.stickToTrack();
    }

    turnRight() {
        this.body.setAngularVelocityY(-this.turnSpeed);
        this.stickToTrack();
    }

    autoCenter() {
        const currAngularVel = this.body.angularVelocity.y;
        if (Math.abs(currAngularVel) > 0.01) {
            this.body.setAngularVelocityY(currAngularVel * 0.95);
        } else {
            this.body.setAngularVelocityY(0);
        }
    }

    stop(direction) {
        if (Math.abs(this.currSpeed) > 0) {
            this.currSpeed *= this.friction;
            if (Math.abs(this.currSpeed) < 0.05) {
                this.currSpeed = 0;
            }
            
            const x = Math.sin(direction) * this.currSpeed;
            const y = this.body.velocity.y;
            const z = Math.cos(direction) * this.currSpeed;

            this.body.setVelocity(x,y, z);
        } else {
            this.body.setVelocity(0, this.body.velocity.y, 0);
        }

        this.body.setAngularVelocityY(0);
        
        this.stickToTrack();
    }

    chooseCharacter(character) 
    {
        if(character == "shermald")
        {
            let eyePosition = new THREE.Vector3(-0.11, 1.7, 0.44);
            let eyeSize = new THREE.Vector2(0.3,0.3);
            const model = `/assets/models/obj/${character}.obj`
            const textureImage = `/assets/models/textures/${character}.png`
            const loader = new OBJLoader();
            const textureLoader = new THREE.TextureLoader();

        loader.load(model,
            (object) => {
                const texture = textureLoader.load(textureImage);

                object.traverse((child) => {
                    if(child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: texture
                        });
                    }
                });

                this.visualPivot.add(object);

                this.eye1 = this.raceScene.createSprite(
                    this.visualPivot,
                    `/assets/models/textures/shermaldlefteye.png`,
                    eyePosition,
                    eyeSize
                );
                this.eye2 = this.raceScene.createSprite(
                    this.visualPivot,
                    `/assets/models/textures/shermaldrighteye.png`,
                    new THREE.Vector3(-1 * eyePosition.x, eyePosition.y, eyePosition.z),
                    new THREE.Vector2(eyeSize.x, eyeSize.y)
                );
                this.eye2.scale.x *= -1;

                if (this.eye1.material)
                {
                    this.eye1.material.transparent = true;
                    this.eye2.material.transparent = true;
                }
                if (this.eye2.material)
                {
                    this.eye1.material.opacity = 1;
                    this.eye2.material.opacity = 1;
                }

                this.counter = 0;
            }
        );
        }
        else{
        let eyePosition;
        let eyeSize;
        let verticalOffset = 0;

        if(character == "shermie")
        {
            eyePosition = new THREE.Vector3(-0.11, 1.35, 0.44);
            eyeSize = new THREE.Vector2(0.4,0.4);
            verticalOffset = 0.5;
            eyePosition.y -= verticalOffset
        }
        else if(character == "shermald")
        {
            eyePosition = new THREE.Vector3(-0.11, 1.7, 0.44);
            eyeSize = new THREE.Vector2(0.3,0.3);
            verticalOffset = 0.7;
            eyePosition.y -= verticalOffset
        }
        else if(character == "virrel")
        {
            eyePosition = new THREE.Vector3(-0.11, 1.3, 0.44);
            eyeSize = new THREE.Vector2(0.3,0.3);
            verticalOffset = 0.5;
            eyePosition.y -= verticalOffset
        }
        else if(character == "r04ch")
        {
            eyePosition = new THREE.Vector3(-0.11, 0.1, 1);
            eyeSize = new THREE.Vector2(0.3,0.3);
            verticalOffset = 0.5;
            eyePosition.y -= verticalOffset
        }
        else
        {
            eyePosition = new THREE.Vector3(-0.11, 3, 0.44);
            eyeSize = new THREE.Vector2(0.5,0.5);
            verticalOffset = 1;
            eyePosition.y -= verticalOffset
        }

        const model = `/assets/models/obj/${character}.obj`
        const textureImage = `/assets/models/textures/${character}.png`
        const eyeImage = `/assets/models/textures/${character}eye.png`
        const loader = new OBJLoader();
        const textureLoader = new THREE.TextureLoader();

        loader.load(model,
            (object) => {
                const texture = textureLoader.load(textureImage);

                object.traverse((child) => {
                    if(child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            map: texture
                        });
                    }
                });

                object.position.y -= verticalOffset

                this.visualPivot.add(object);

                this.eye1 = this.raceScene.createSprite(
                    this.visualPivot,
                    eyeImage,
                    eyePosition,
                    eyeSize
                );

                this.eye2 = this.raceScene.createSprite(
                    this.visualPivot,
                    eyeImage,
                    new THREE.Vector3(-1 * eyePosition.x, eyePosition.y, eyePosition.z),
                    new THREE.Vector2(eyeSize.x, eyeSize.y)
                );
                this.eye2.scale.x *= -1;

                if (this.eye1.material)
                {
                    this.eye1.material.transparent = true;
                    this.eye2.material.transparent = true;
                }
                if (this.eye2.material)
                {
                    this.eye1.material.opacity = 1;
                    this.eye2.material.opacity = 1;
                }

                this.counter = 0;
            }
        );
    }
    }

    randomInt(min, max)
    {
        this.number = Math.floor(Math.random() * (max - min + 1)) + min;
        return this.number;
    }

    blink()
    {
        this.counter++;
        this.updateVisualTilt();
        this._updateDriftIndicators();
        if (!this.eye1 || !this.eye2) return;
    
        if (this.eye1.material.opacity === 0 && this.counter % 25 == 0)
        {
            this.eye1.material.opacity = 1;
            this.eye2.material.opacity = 1;
        }
        if (this.eye1.material.opacity === 1 && this.counter % this.randomInteger == 0)
        {
            this.eye1.material.opacity = 0;
            this.eye2.material.opacity = 0;
            this.randomInteger = this.randomInt(100, 500);
        }
    }

    getTrackCompletion(lapGoal, checkpoints, checkpointTotal)
    {
        const checkpointWeight = this.checkpointsCrossed.length / checkpointTotal
        return {name: this.key , score: this.lapsCompleted + checkpointWeight}
    }
}
