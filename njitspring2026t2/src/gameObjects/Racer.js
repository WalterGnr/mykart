import { ExtendedObject3D, THREE } from "@enable3d/phaser-extension";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { createSprite } from "../helperFunctions/Sprite";

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
        this.blink1;
        this.blink2;
        this.randomInteger = 100;
        this.counter = 0;

        this.drifting = false;
        this.driftDir = 0;          
        this.driftCharge = 0;       
        this.driftTier1 = 150;      
        this.driftTier2 = 300;      
        this.driftTier3 = 500;      
        this.driftBoostSpeed = 0;
        this.driftBoostDecay = 0.4;

        this.visualPivot = new THREE.Object3D();
        this.add(this.visualPivot);
        this.driftTiltTarget = 0;   
        this.driftTiltMax = 0.35;   
        this.driftTiltSpeed = 0.08; 

        // Visual hop on drift start
        this.hopTimer = 0;          // counts up while hop is playing
        this.hopDuration = 50;      // frames the hop lasts 
        this.hopHeight = 0.6;       // how high the kart visually jumps 

        this.driftTexture = new THREE.TextureLoader().load('/assets/gameObjects/drift.png');

        this.driftIndicatorLeft  = this._makeDriftSprite(-0.8);
        this.driftIndicatorRight = this._makeDriftSprite( 0.8);
        this.visualPivot.add(this.driftIndicatorLeft);
        this.visualPivot.add(this.driftIndicatorRight);

        this.driftTierColors = [null, 0xff2a2a, 0xffd400, 0x00ff5a]; //color boxes behind car when drifting colors.

        //this.chooseCharacter(character); 
        this.character = character;
        
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
        this.background = null;
        this.raycaster = new THREE.Raycaster();
        this.suspendStiff = 200;
        this.suspendDamping = 18;
        this.targetHeight = 2.2;

        // Slope-tilt state (mesh only, no collider involvement)
        this.surfaceNormal = new THREE.Vector3(0, 1, 0);
        this.surfacePitch  = 0;

        this.checkpointsCrossed = []
        this.lapsCompleted = 0

        this.isInverted = false;
        this.invertTimeout = null;
        this.isVirus = false;
        this.virusTimeout = null;
        this.baseMaxSpeed = this.maxSpeed;
        this.roachOverlay = null;
        // this.add.text(640,300, key, {
        //         fontFamily: 'Arial',
        //         fontSize: '30px',
        //         color: '#ffffff',
        //         align: 'center',
        //         fixedWidth: 300,
        //         backgroundColor: '#2d2d2d00'
        // }).setPadding(5).setOrigin(0.5);

        // Off-track system
        this.isOffTrack = false;
        this.offTrackTime = 0;
        this.maxOffTrackTime = 3000; // 3 seconds
        this.isRespawning = false;

        // checkpoint respawn system
        this.spawnTransform = spawnTransform;

        // IMPORTANT: clone so it doesn't get mutated accidentally
        this.lastCheckpointTransforms = {
            position: spawnTransform.position.clone(),
            rotation: spawnTransform.rotation.clone(),
            tag: "C_00_X"
        };

        // Flag for if race has started
        this.raceStart = false;

    }

    applyVirus(duration = 5000) {
        if (this.isVirus) return;
    
        this.isVirus = true;
        this.maxSpeed = this.maxSpeed * 0.4;
        this.currSpeed = Math.min(this.currSpeed, this.maxSpeed);

        if (this.virusTimeout) clearTimeout(this.virusTimeout);

        this.virusTimeout = setTimeout(() => {
            this.maxSpeed = this.baseMaxSpeed;
            this.isVirus = false;
        }, duration);
    }

    applyInvert(duration = 5000) {
        console.log('Applying invert to player for duration: ', duration);
        this.isInverted = true;

        if (this.invertTimeout) {
            clearTimeout(this.invertTimeout);
        }

        this.invertTimeout = setTimeout(() => {
            this.isInverted = false;
        }, duration);
    }
    applyRoach(duration = 5000) {
        if (this.roachOverlay) return;
        if (!this.isHumanPlayer) return;

            const container = document.createElement('div');
            container.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none; z-index: 9999;
        `;
        document.body.appendChild(container);
        this.roachOverlay = container;

        const roaches = Array.from({ length: 12 }, () => {
            const img = document.createElement('img');
            img.src = '/assets/models/textures/r04ch.png';
            img.style.cssText = `
                position: absolute;
                width: ${40 + Math.random() * 30}px;
                pointer-events: none;
            `;
            container.appendChild(img); 
            return {
                el: img,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                angle: Math.random() * Math.PI * 2,
                speed: 1.5 + Math.random() * 2.5,
                rotSpeed: (Math.random() - 0.5) * 0.12,
            };
        });

        let animId;
        const animate = () => {
            roaches.forEach(r => {
                r.angle += r.rotSpeed;
                r.x += Math.cos(r.angle) * r.speed;
                r.y += Math.sin(r.angle) * r.speed;

                if (r.x < 0 || r.x > window.innerWidth)  r.angle = Math.PI - r.angle;
                if (r.y < 0 || r.y > window.innerHeight) r.angle = -r.angle;

                r.el.style.left = r.x + 'px';
                r.el.style.top  = r.y + 'px';
                r.el.style.transform = `rotate(${r.angle}rad)`;
            });
            animId = requestAnimationFrame(animate);
        };
        animate();

        setTimeout(() => {
            cancelAnimationFrame(animId);
            container.remove();
            this.roachOverlay = null;
        }, duration);
        this.isRespawning = false;

        //this.lastCheckpointTransforms = spawnTransform; // spawn fallback
        this.lastCheckpointTransforms = {
            position: spawnTransform.position.clone(),
            rotation: spawnTransform.rotation.clone()
        };

        this.offTrackTime = 0;
        this.isOffTrack = false;
        this.maxOffTrackTime = 2000; // 2 seconds
    }
   
    //get track mesh data
    setTrackMesh(mesh) {
        this.trackMesh = mesh;
    }
    setBackgroundMesh(mesh) {
        this.background = mesh;
    }

    stickToTrack() {
        if (!this.trackMesh) return;

        const moveDir = new THREE.Vector3(this.body.velocity.x, 0, this.body.velocity.z);
        const speed = moveDir.length();

        let lookAhead = 0;
        if (speed > 0.1) {
            moveDir.normalize();
            lookAhead = Math.min(2.5, speed * 0.12);
        }

        // Ray origin
        const rayOrigin = this.position.clone().add(moveDir.multiplyScalar(lookAhead));
        rayOrigin.y += 3;

        const rayDir = new THREE.Vector3(0, -1, 0);
        this.raycaster.set(rayOrigin, rayDir);

        // Separate raycasts
        const trackHits = this.raycaster.intersectObject(this.trackMesh, true);
        const bgHits = this.background
            ? this.raycaster.intersectObject(this.background, true)
            : [];

        let groundHit = null;

        // ON TRACK
        if (trackHits.length > 0) {
            groundHit = trackHits[0];
            this.isOffTrack = false;
            this.offTrackTime = 0;
            this.offTrack = false;

            if (groundHit.face) {
                const n = groundHit.face.normal.clone();
                n.transformDirection(groundHit.object.matrixWorld);
                this.surfaceNormal.copy(n);
            }

        } else if (bgHits.length > 0) {
            // OFF TRACK (grass, etc.)
            groundHit = bgHits[0];
            this.isOffTrack = true;
            this.offTrackTime += this.raceScene.game.loop.delta;
            this.offTrack = true;

            if (groundHit.face) {
                const n = groundHit.face.normal.clone();
                n.transformDirection(groundHit.object.matrixWorld);
                this.surfaceNormal.copy(n);
            }

        } else {
            // FALLING — gradually level the visual tilt back to upright
            this.isOffTrack = true;
            this.offTrackTime += this.raceScene.game.loop.delta;
            this.surfaceNormal.lerp(new THREE.Vector3(0, 1, 0), 0.08);

            this.body.applyForce(0, -30, 0);
            return;
        }

        // suspension logic
        const hitP = groundHit.point;
        const targetY = hitP.y + this.targetHeight;
        const currY = this.position.y;
        const difference = targetY - currY;

        const speedFactor = Math.min(1.2, 1 + speed * 0.015);

        const springForce = difference * this.suspendStiff * speedFactor;
        const dampingForce = -this.body.velocity.y * this.suspendDamping;
        let totalForce = springForce + dampingForce;

        if (this.offTrack) {
            totalForce *= 0.9;
            this.currSpeed *= 0.98;
        }

        if (currY < targetY - 0.3) {
            const sinkAmount = targetY - currY;
            totalForce += Math.min(150, sinkAmount * 190 * speedFactor);

            if (this.body.velocity.y < -5) {
                this.body.setVelocity(
                    this.body.velocity.x,
                    -5,
                    this.body.velocity.z
                );
            }
        }

        this.body.applyForce(0, totalForce, 0);

        if (Math.abs(this.body.velocity.y) > 80) {
            this.body.setVelocity(
                this.body.velocity.x,
                Math.sign(this.body.velocity.y) * 80,
                this.body.velocity.z
            );
        }
    }

    _makeDriftSprite(xOffset)
    {
        const mat = new THREE.SpriteMaterial({
            map: this.driftTexture, 
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            depthWrite: false,
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
            sprite.material.opacity = active ? 0.65 + tier * 0.15 : 0;
            if (active) sprite.material.color.setHex(this.driftTierColors[tier]);
        });
    }

    _updateHop()
    {
        if (this.hopTimer <= 0) {
            this.visualPivot.position.y = 0;
            return;
        }
        // 
        const t = this.hopTimer / this.hopDuration;
        this.visualPivot.position.y = Math.sin(t * Math.PI) * this.hopHeight;
        this.hopTimer++;
        if (this.hopTimer > this.hopDuration) this.hopTimer = 0;
    }

    updateVisualTilt()
    {
        // Drift side-tilt (Y axis)
        this.visualPivot.rotation.y += (this.driftTiltTarget - this.visualPivot.rotation.y) * this.driftTiltSpeed;

        // Slope pitch (X axis) — mesh only, colliders are untouched
        const fwd = this.getWorldDirection(new THREE.Vector3());
        fwd.y = 0;
        if (fwd.lengthSq() > 0.001) fwd.normalize();

        // Project the surface normal onto the forward axis to get the slope angle
        const slopeAlongForward = this.surfaceNormal.dot(fwd);
        // Negative sign: going uphill (normal tilts back) → positive pitch → nose up
        const rawPitch   = Math.atan2(-slopeAlongForward, this.surfaceNormal.y);
        const maxPitch   = 0.35; // ~20°
        const targetPitch = Math.max(-maxPitch, Math.min(maxPitch, rawPitch));
        this.surfacePitch += (targetPitch - this.surfacePitch) * 0.1;
        this.visualPivot.rotation.x = this.surfacePitch;

        this._updateHop();
    }

    startDrift(direction, turnSide)
    {
        if (this.drifting) return;
        this.drifting = true;
        this.driftDir = (turnSide === 'left') ? 1 : -1;
        this.driftCharge = 0;
        this.driftTiltTarget = this.driftDir * this.driftTiltMax;
        this.hopTimer = 1; // kick off the hop
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

    moveForward(direction) 
    {
        if (this.currSpeed < this.maxSpeed) {
            this.currSpeed += this.acceleration;
            if (this.currSpeed >= this.maxSpeed) {
                this.currSpeed = this.maxSpeed;
            }
        }
        let dir = direction;

        if (this.isInverted) dir += Math.PI;

        const x = Math.sin(dir) * this.currSpeed;
        const y = this.body.velocity.y;
        const z = Math.cos(dir) * this.currSpeed;

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
        let dir = direction;
        if (this.isInverted) dir += Math.PI;

        const x = Math.sin(dir) * this.currSpeed;
        const z = Math.cos(dir) * this.currSpeed;

        this.body.setVelocity(x, this.body.velocity.y, z);
        this.stickToTrack();
    }

    turnLeft() {
        if (this.currSpeed === 0) return;
        if (this.isInverted) {
            this.body.setAngularVelocityY(-this.turnSpeed);
        } else {
            this.body.setAngularVelocityY(this.turnSpeed);
        }
        this.stickToTrack();
    }

    turnRight() {
        if (this.currSpeed === 0) return;
        if (this.isInverted) {
            this.body.setAngularVelocityY(this.turnSpeed);
        } else {
            this.body.setAngularVelocityY(-this.turnSpeed);
        }
        this.stickToTrack();
    }

    autoCenter() {
        const currAngularVel = this.body.angularVelocity.y;
        if (Math.abs(currAngularVel) > 0.01) {
            this.body.setAngularVelocityY(currAngularVel * 0.95);
        } else {
            this.body.setAngularVelocityY(0);
        }
        this.stickToTrack();
    }

    stop(direction) {
        const coastFriction = 0.994;

        if (this.currSpeed > 0.5) {
            this.currSpeed *= coastFriction;


            const blend = 0.08;
            const targetVx = Math.sin(direction) * this.currSpeed;
            const targetVz = Math.cos(direction) * this.currSpeed;
            const newVx = this.body.velocity.x * (1 - blend) + targetVx * blend;
            const newVz = this.body.velocity.z * (1 - blend) + targetVz * blend;

            this.body.setVelocity(newVx, this.body.velocity.y, newVz);
        } else {
            this.currSpeed = 0;
            this.body.setVelocity(0, this.body.velocity.y, 0);
            this.body.setAngularVelocityY(0);
        }

        this.stickToTrack();
    }

    chooseCharacter(character) 
    {
        return new Promise((resolve, reject) => {
        const characterConfigs = {
            shermie: {
                eyePosition: new THREE.Vector3(-0.11, 1.35, 0.44),
                eyeSize: new THREE.Vector2(0.4, 0.4),
                verticalOffset: 0.5
            },
            shermald: {
                eyePosition: new THREE.Vector3(-0.11, 1.7, 0.44),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.7,
                leftEye: `/assets/models/textures/shermaldlefteye.png`,
                rightEye: `/assets/models/textures/shermaldrighteye.png`
            },
            fido: {
                eyePosition: new THREE.Vector3(-0.11, 3, 0.44),
                eyeSize: new THREE.Vector2(0.5, 0.5),
                verticalOffset: 1
            },
            virrel: {
                eyePosition: new THREE.Vector3(-0.11, 1.3, 0.44),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.5
            },
            r04ch: {
                eyePosition: new THREE.Vector3(-0.11, 0.1, 1),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.5
            },
            kitty: {
                eyePosition: new THREE.Vector3(-0.11, 1.4, 0.32),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.5
            },
            ratley: {
                eyePosition: new THREE.Vector3(-0.11, 1.35, 0.46),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.5
            },
            charles: {
                eyePosition: new THREE.Vector3(-0.08, 1.3, 0.18),
                eyeSize: new THREE.Vector2(0.3, 0.3),
                verticalOffset: 0.5
            },
            snakington: {
                eyePosition: new THREE.Vector3(-0.025, 1.12, 0.2),
                eyeSize: new THREE.Vector2(0.1, 0.1),
                verticalOffset: 0.5
            }
        };

        const config = characterConfigs[character] || characterConfigs.shermie;

        const eyePosition = config.eyePosition.clone();
        const eyeSize = config.eyeSize.clone();
        const verticalOffset = config.verticalOffset;

        eyePosition.y -= verticalOffset;
        
        const model =  `/assets/models/obj/${character}.obj`;
        const textureImage = `/assets/models/textures/${character}.png`;
        const blinkImage = `/assets/models/textures/blink.png`;

        const leftEyeImage = config.leftEye || `/assets/models/textures/${character}eye.png`;
        const rightEyeImage = config.rightEye || leftEyeImage;

        const loader = new OBJLoader();
        const textureLoader = new THREE.TextureLoader();

        loader.load(model, (object) => {
            const texture = textureLoader.load(textureImage);

            object.traverse((child) => {
                if(child.isMesh){
                    child.material = new THREE.MeshStandardMaterial({
                        map: texture
                    });
                }
        });

        object.position.y -= verticalOffset;
        this.visualPivot.add(object);

        const rightEyePosition = new THREE.Vector3(
            -eyePosition.x,
            eyePosition.y,
            eyePosition.z
        );

        this.eye1 = this.createFaceSprite(leftEyeImage, eyePosition, eyeSize);
        this.eye2 = this.createMirroredFaceSprite(rightEyeImage, eyePosition, eyeSize);

        this.blink1 = this.createFaceSprite(blinkImage, eyePosition, eyeSize);
        this.blink2 = this.createMirroredFaceSprite(blinkImage, eyePosition, eyeSize);

        if(this.eye1.material && this.eye2.material && this.blink1.material && this.blink2.material)
        {
            this.eye1.material.transparent = true;
            this.eye2.material.transparent = true;
            this.blink1.material.transparent = true;
            this.blink2.material.transparent = true;

            this.eye1.material.opacity = 1;
            this.eye2.material.opacity = 1;
            this.blink1.material.opacity = 0;
            this.blink2.material.opacity = 0;

        }

        this.counter = 0;

        resolve(this);
    },

    undefined,

    (error) => {
        console.error(`failed to load character model: ${character}`, error);
        reject(error);
    }
    );
    });
    }

    createFaceSprite(image, position, size){
        return createSprite(
            this.visualPivot,
            image,
            position.clone(),
            size.clone()
        );
    }
    
    createMirroredFaceSprite(image, position, size){
        const mirroredPosition = new THREE.Vector3(
            -position.x,
            position.y,
            position.z
        );

        const sprite = createSprite(
            this.visualPivot,
            image,
            mirroredPosition,
            size.clone()
        );

        sprite.scale.x *= -1;
        return sprite;
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
        if (!this.eye1 || !this.eye2 || !this.blink1 || !this.blink2) return;
    
        if (this.eye1.material.opacity === 0 && this.counter % 25 == 0)
        {
            this.eye1.material.opacity = 1;
            this.eye2.material.opacity = 1;

            this.blink1.material.opacity = 0;
            this.blink2.material.opacity = 0;
        }
        if (this.eye1.material.opacity === 1 && this.counter % this.randomInteger == 0)
        {
            this.eye1.material.opacity = 0;
            this.eye2.material.opacity = 0;

            this.blink1.material.opacity = 1;
            this.blink2.material.opacity = 1;
            this.randomInteger = this.randomInt(100, 500);
        }
    }

    getTrackCompletion(checkpointTotal)
    {
        const checkpointWeight = this.checkpointsCrossed.length / checkpointTotal
        return {name: this.key , score: this.lapsCompleted + checkpointWeight}
    }

    async loadModelAsync(){
        await this.chooseCharacter(this.character);
    }
}
