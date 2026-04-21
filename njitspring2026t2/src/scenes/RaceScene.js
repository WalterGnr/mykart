import { Scene3D, THREE } from '@enable3d/phaser-extension';
import TestTrack from '../raceTracks/TestTrack';
import HelpDeskTrack from '../raceTracks/HelpDeskTrack';
import AIPlayer from '../gameObjects/AIPlayer'
import MotherboardTrack from '../raceTracks/MotherboardTrack';
import ShermieRoadTrack from '../raceTracks/ShermieRoadTrack';
import CharacterSelectionArea from '../raceTracks/CharacterSelectionArea';

export default class RaceScene extends Scene3D
{
    constructor(key)
    {
        super({ key });

        this.clientPlayer = null
        this.cameraManager = null
        this.keys = { }
        this.gamepads = []
        this.characters = [
            'shermie',
            'shermald',
            'fido',
            'virrel',
            'r04ch'
        ]

        this.aiRacers = []
        this.waypointTags = []

        this.trackList = [
            'TestTrack',
            'HelpDeskTrack',
            'MotherboardTrack',
            'ShermieRoadTrack',
            'CharacterSelectionArea'
        ]
        this.currentTrackIndex = 0
        this.currentTrack = null

        //UI Elements
        this.currentScene;
        this.paused = false;
        this.shermieFlag;
        this.sherminal;
        this.lapUI;
        this.lapUIBack;
        this.placeUI;
        this.resumeButton;
        this.menuButton;
        this.lapNumber = 1;
        this.placeNumber = 1;
        this.currentAudio;
        this.selectedCharacter = "shermie";

        this.racerCompletionOrder = []
        this.trackMesh = undefined
    }

    init() 
    {
        this.accessThirdDimension({ antialias: true });
    }

    async preload()
    {
        this.third.load.preload('skybox', 'assets/skybox/DigitalWorld.png');
        this.load.image('flag', '/assets/UI/shermieFlag.png');
        this.load.image('sherminal', '/assets/UI/sherminal.png');
        
    }

    async create()
    {
        // Initialize 3D Space
        await this.third.warpSpeed('-sky', '-ground', '-orbitControls');
        await this.createSkyBox(2000, 'skybox');

        // Racer Controls
        this.keys = {
            accelerate: this.input.keyboard.addKey('W'),
            brake: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            drift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            printPosition: this.input.keyboard.addKey('P'),
            pause: this.input.keyboard.addKey('ESC'),
            win: this.input.keyboard.addKey('N')

        };

        for (let i = 0; i < this.input.gamepad.total; i++)
        {
            this.gamepads[i] = this.getGamepad(i);
        }

        //On resume from pause menu
        this.events.on('resume', () => {
            this.togglePauseMenuOff();
        })
    }

    update()
    {
        if (!this.clientPlayer || !this.cameraManager || !this.currentTrack) return;

        // calculate clientPlayer and camera rotation
        this.clientPlayer.update();
        const theta = this.getNewCameraAngle(this.clientPlayer)
        if(this.gamepads[0])
            this.playerControllerInputChecks(this.clientPlayer, theta, this.gamepads[0]);
        else
            this.playerKeyInputChecks(this.clientPlayer, theta);


        // Update AI
        for (let i = 0; i < this.aiRacers.length; i++) {
            this.aiRacers[i].update();
        }

        this.cameraManager.updateCamera(this.clientPlayer.position, theta);
    }

    // Scene-Init Functions
    async createSkyBox(len, textureName) 
    {
        const loader = new THREE.CubeTextureLoader()

        const skyboxBox = loader.load([
            'assets/skybox/DigitalWorldCube.png',
            'assets/skybox/DigitalWorldCube.png',
            'assets/skybox/DigitalWorldCube.png',
            'assets/skybox/DigitalWorldCube.png',
            'assets/skybox/DigitalWorldCube.png',
            'assets/skybox/DigitalWorldCube.png'
        ])

        //this.third.scene.background = skybox;
        this.third.scene.environment = skyboxBox; //makes skybox reflected on environment*/
        this.skyBox = this.third.make.box({ width: len, height: len, depth: len });
        this.third.load.texture(textureName).then(tex => {
            this.skyBox.material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
            this.third.scene.add(this.skyBox);
        });
    }

    async createRaceTrack(trackName)
    {
        if (trackName === 'TestTrack')
            this.currentTrack = new TestTrack(this, trackName)
        else if (trackName === 'HelpDeskTrack')
            this.currentTrack = new HelpDeskTrack(this, trackName)
        else if (trackName === 'MotherboardTrack')
            this.currentTrack = new MotherboardTrack(this, trackName)
        else if (trackName === 'ShermieRoadTrack')
            this.currentTrack = new ShermieRoadTrack(this, trackName)
        else if (trackName === 'CharacterSelectionArea')
            this.currentTrack = new CharacterSelectionArea(this, trackName)
        else console.log(`${trackName} not in trackList`)
    }

    // UI Functions
    createPlayerUI(multiplayer = false)
    {
        if(multiplayer)
        {
            this.sherminal = this.add.image(130,70, 'sherminal');
            this.sherminal.setScale(0.10);
            this.lapUIBack = this.add.rectangle(150,325, 140, 60, 1,0.5);
            this.shermieFlag = this.add.image(130,330, 'flag');
            this.shermieFlag.setScale(0.05);
            this.lapUI = this.add.text(160, 310, this.lapNumber + "/3",
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '30px',
                    color: '#ffffff'
                })
            this.placeUI = this.add.text(1180, 250, this.placeNumber,
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '100px',
                    color: '#f05C22'
                })
            this.placeUI.setShadow(3, 3, '#000000', 0);
            this.sherminal2 = this.add.image(130,420, 'sherminal');
            this.sherminal2.setScale(0.10);
            this.lapUIBack2 = this.add.rectangle(150,685, 140, 60, 1,0.5);
            this.shermieFlag2 = this.add.image(130,690, 'flag');
            this.shermieFlag2.setScale(0.05);
            this.lapUI2 = this.add.text(160, 670, this.lapNumber + "/3",
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '30px',
                    color: '#ffffff'
                })
            this.placeUI2 = this.add.text(1180, 620, this.placeNumber,
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '100px',
                    color: '#f05C22'
                })
            this.placeUI2.setShadow(3, 3, '#000000', 0);

        }
        else{
        this.sherminal = this.add.image(130,115, 'sherminal');
        this.sherminal.setScale(0.15);
        this.lapUIBack = this.add.rectangle(130,657, 200, 100, 1,0.5);
        this.shermieFlag = this.add.image(100,660, 'flag');
        this.shermieFlag.setScale(0.08);
        this.lapUI = this.add.text(140, 635, this.lapNumber + "/" + this.lapTotal,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '55px',
                color: '#ffffff'
            })
        this.placeUI = this.add.text(1180, 570, this.placeNumber,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '150px',
                color: '#f05C22'
            })
        this.placeUI.setShadow(3, 3, '#000000', 0);
        }


    }

    updatePlayerUI(lapNumber = this.lapNumber, placeNumber = this.placeNumber)
    {
        if(this.paused == false){
        this.lapUI.destroy();
        this.placeUI.destroy();
        this.lapUI = this.add.text(140, 635, lapNumber + "/" + this.currentTrack.lapGoal,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '55px',
                color: '#ffffff'
            })
        this.placeUI = this.add.text(1180, 570, placeNumber,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: '150px',
                color: '#f05C22'
            })
        this.placeUI.setShadow(3, 3, '#000000', 0);
        }
    }

    togglePauseMenuOn()
    {
        this.paused = true;
        this.pauseData = {
            targetScene: this.scene.key,
            sherminal: this.sherminal,
            shermieFlag: this.shermieFlag,
            lapUI: this.lapUI,
            placeUI: this.placeUI,
            currentAudio: this.currentAudio,
            lapUIBack: this.lapUIBack,
            currentScene: this.currentScene
        };
        this.sceneSwitch(this.sherminal, 640, 360, 0.55, 'PauseScene', this.pauseData, true);
   }

   sceneSwitch(sherminal, x, y, scale, scene, data = null, pause = false){
        this.tweens.add(
                {
                    targets: sherminal,
                    x: x,
                    y: y,
                    scale: scale,
                    duration: 100,
                    onComplete: () => {
                        if(pause == true){
                            if(data != null)
                                this.scene.launch(scene, data);
                            else
                                this.scene.launch(scene);
                            this.sherminal.setVisible(false);
                            this.time.delayedCall(0, () => {
                                this.scene.pause();
                        });}
                        else{
                            if(data != null){
                                console.log(this.currentScene);
                                this.scene.stop(this.currentScene);
                                this.scene.start(scene, data);
                            }
                            else{
                                console.log(this.currentScene);
                                this.scene.stop(this.currentScene);
                                this.scene.start(scene);
                            }}
                    }

                }
            );
    }

    togglePauseMenuOff(){
        this.paused = false;
        this.sherminal.setVisible(true);
        this.moveSherminal(this.sherminal, 130, 115, 0.15);
    }

    moveSherminal(sherminal, x, y, scale)
    {
        this.tweens.add(
            {
                targets: sherminal,
                x: x,
                y: y,
                scale: scale,
                duration: 100,
            }
        );
    }

    winRace()
    {
        this.currentAudio.pause();
        this.sceneSwitch(this.sherminal, 640,255,0.45,'WinScene');
    }

    // Player-Related Functions
    playerKeyInputChecks(player, direction) 
    {
        const driftHeld = this.keys.drift.isDown;
        const leftHeld  = this.keys.left.isDown;
        const rightHeld = this.keys.right.isDown;
        const accelHeld = this.keys.accelerate.isDown;
        const brakeHeld = this.keys.brake.isDown;

        const steerSide = leftHeld ? 'left' : rightHeld ? 'right' : null;

        // --- Drift input ---
        if (driftHeld && accelHeld && steerSide && !player.drifting)
        {
            // Initiate drift — lock direction from whichever turn key is held
            player.startDrift(direction, steerSide);
        }

        if (player.drifting)
        {
            if (driftHeld)
            {
                // Continue drift — steer input widens/tightens but doesn't override direction
                player.updateDrift(direction, steerSide);
            }
            else
            {
                // Drift button released — fire boost
                player.endDrift();
            }
        }
        else
        {
            // Normal steering
            if (leftHeld)       player.turnLeft();
            else if (rightHeld) player.turnRight();
            else                player.autoCenter();
        }

        // --- Acceleration ---
        if (!player.drifting)
        {
            if (accelHeld)      player.moveForward(direction);
            else if (brakeHeld) player.moveBackward(direction);
            else if (!leftHeld && !rightHeld) player.stop(direction);
        }
        else
        {
            // Keep speed up while drifting
            if (accelHeld) player.moveForward(direction);
        }

        // Drift boost decays every frame regardless
        player.applyDriftBoost(direction);

        if (this.keys.printPosition.isDown) console.log(player.position);
        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePauseMenuOn();
        if (Phaser.Input.Keyboard.JustDown(this.keys.win))this.winRace();
    }

    playerControllerInputChecks(player, direction, gamepad)
    {
        if (this.input.gamepad.total == 0 || !gamepad)
        {
            // console.log("no controller connected");
            player.stickToTrack()
            return;
        }
        
        const driftHeld = gamepad.R1;
        const leftHeld  = gamepad.left;
        const rightHeld = gamepad.right;
        const accelHeld = gamepad.A;
        const brakeHeld = gamepad.B;
        
        const steerSide = leftHeld ? 'left' : rightHeld ? 'right' : null;

        // --- Drift input ---
        if (driftHeld && accelHeld && steerSide && !player.drifting)
        {
            // Initiate drift — lock direction from whichever turn key is held
            player.startDrift(direction, steerSide);
        }

        if (player.drifting)
        {
            if (driftHeld)
            {
                // Continue drift — steer input widens/tightens but doesn't override direction
                player.updateDrift(direction, steerSide);
            }
            else
            {
                // Drift button released — fire boost
                player.endDrift();
            }
        }
        else
        {
            // Normal steering
            if (leftHeld)       player.turnLeft();
            else if (rightHeld) player.turnRight();
            else                player.autoCenter();
        }

        // --- Acceleration ---
        if (!player.drifting)
        {
            if (accelHeld)      player.moveForward(direction);
            else if (brakeHeld) player.moveBackward(direction);
            else if (!leftHeld && !rightHeld) player.stop(direction);
        }
        else
        {
            // Keep speed up while drifting
            if (accelHeld) player.moveForward(direction);
        }

        // Drift boost decays every frame regardless
        player.applyDriftBoost(direction);
/*
        if (gamepad.left) player.turnLeft();
        else if (gamepad.right) player.turnRight();
        else player.stop(direction); //was player.stop()

        if (gamepad.A) player.moveForward(direction);
        else if (gamepad.B) player.moveBackward(direction);
        else player.stop(direction);*/
    }

    getNewCameraAngle(player)
    {
        const rotation = player.getWorldDirection(new THREE.Vector3()?.setFromEuler?.(player.rotation) || player.rotation);
        const angle = Math.atan2(rotation.x, rotation.z);
        return angle;
    }

    getGamepad(index)
    {
        switch (index)
        {
            case 3:
                return this.input.gamepad.pad4;

            case 2:
                return this.input.gamepad.pad3;

            case 1:
                return this.input.gamepad.pad2;
        
            default:
                return this.input.gamepad.pad1;
            
        }
    }

    createSprite(gameObject, texturePath, pos, scale = new THREE.Vector2(1,1), color = 0xffffff){
        const map = new THREE.TextureLoader().load(texturePath);
        const material = new THREE.SpriteMaterial( { map: map, color } );
        const sprite = new THREE.Sprite( material );
        sprite.position.set(pos.x, pos.y, pos.z);
        sprite.scale.set(scale.x,scale.y,1);
        gameObject.add(sprite);
        return sprite;
    }

    // AI functions
    createAIRacers(amount)
    {
        if (!this.currentTrack)
        {
            console.log("current race track not loaded")
            return;
        }

        for (let i = 0; i < amount; i++) {
            const spawnTransform = this.currentTrack.getRandomSpawnTransform();

            // Clone waypoints for this AI
            let aiWaypoints = [...this.currentTrack.lapCheckpointSensors.map(p => p.position.clone())];

            // --- Add random jitter to each waypoint ---
            const jitterAmount = 16; // max deviation in any direction (x/z)
            aiWaypoints = aiWaypoints.map(p => {
                return p.clone().add(new THREE.Vector3(
                    (Math.random() - 0.5) * jitterAmount,
                    0, // keep y the same
                    (Math.random() - 0.5) * jitterAmount
                ));
            });
            

            // Smooth the path using Catmull-Rom spline
            const curve = new THREE.CatmullRomCurve3(aiWaypoints);
            const smoothedWaypoints = curve.getPoints(aiWaypoints.length + 7);

            this.createAIWaypoints(smoothedWaypoints)

            const ai = new AIPlayer(
                this, 
                spawnTransform, 
                smoothedWaypoints, 
                `COM${i + 1}`,
                this.characters[Math.floor(Math.random() * (this.characters.length -1 - 0 + 1)) + 0]
            );

            // Stagger start slightly to avoid collision
            this.time.delayedCall(i * 500, () => {
                ai.currSpeed = 10; // initial speed
            });
        }
    }

    createAIWaypoints(list)
    {
        let i = 1
        list.forEach(position => {
            const waypoint = this.third.make.box({
                x: position.x,
                y: position.y - 13,
                z: position.z,
                width: 7,
                height: 20,
                depth: 7
            });

            waypoint.tag = `Waypoint #${i}`
            this.waypointTags.push(waypoint.tag)

            this.third.physics.add.existing(waypoint, { collisionFlags: 6 });

            waypoint.body.on.collision((otherObject, event) => {
                if (otherObject instanceof AIPlayer &&
                    this.verifyWaypoints(otherObject, waypoint.tag)
                ) {
                    otherObject.currentWaypointIndex = (otherObject.currentWaypointIndex + 1) % otherObject.waypoints.length;

                    otherObject.waypointsCrossed.push(waypoint.tag)

                    this.resetWaypointChecks(otherObject, waypoint.tag)
                }
            })

            i++;
        });
    }

    verifyWaypoints(racer, waypointCrossed)
    {
        if (waypointCrossed === 'Waypoint #1' && racer.waypointsCrossed.length === 0)
            return true;

        const slicedCheck = this.waypointTags.slice(0, this.waypointTags.indexOf(waypointCrossed))
        const isReachedWaypointValid = slicedCheck.every((element, index) => element === racer.waypointsCrossed[index]) && 
                                         !racer.waypointsCrossed.includes(waypointCrossed)

        return isReachedWaypointValid;
    }

    resetWaypointChecks(racer, waypointCrossed)
    {
        if (waypointCrossed === this.waypointTags[this.waypointTags.length - 1])
        {
            racer.currentTrackIndex = 0
            racer.waypointsCrossed = [];
            // console.log(racer.key + " reset waypoint checks")
        }
    }
}