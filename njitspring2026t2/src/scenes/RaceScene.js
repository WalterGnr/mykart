import { Scene3D, THREE } from '@enable3d/phaser-extension';
import AIPlayer, { AIWaypoint } from '../gameObjects/AIPlayer';
import { playerControllerInputChecks, playerKeyInputChecks } from '../helperFunctions/PlayerMovement';
import CharacterSelectionArea from '../raceTracks/CharacterSelectionArea';
import HelpDeskTrack from '../raceTracks/HelpDeskTrack';
import MotherboardTrack from '../raceTracks/MotherboardTrack';
import ShermieRoadTrack from '../raceTracks/ShermieRoadTrack';
import TestTrack from '../raceTracks/TestTrack';
import TerminalTrack from '../raceTracks/TerminalTrack';

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
            'r04ch',
            'kitty',
            'ratley',
            'charles',
            'snakington'
        ]

        this.aiRacers = []
        this.trackList = [
            'TestTrack',
            'HelpDeskTrack',
            'MotherboardTrack',
            'ShermieRoadTrack',
            'TerminalTrack'
        ]
        this.currentTrackIndex = 0
        this.currentTrack = null

        //UI Elements
        this.currentScene;
        this.paused = false;
        this.shermieFlag;
        this.sherminal;
        this.lapUI = [];
        this.lapUIBack = [];
        this.placeUI = [];
        this.resumeButton;
        this.menuButton;
        this.lapNumber = [];
        this.placeNumber = [];
        this.currentAudio;
        this.selectedCharacter = "shermie";
        this.loadingScreen; 
        this.ready;
        this.raceStarted = false;
        this.playerGo = false;
        this.powerupItem;

        this.racerCompletionOrder = []
        this.trackMesh = undefined
        this.debug = false
    }

    init() 
    {
        this.accessThirdDimension({ antialias: true });
        this.raceStarted = false;
        this.playerGo = false;
    }

    async preload()
    {
        this.third.load.preload('skybox', 'assets/skybox/DigitalWorld.png');
        this.load.image('flag', '/assets/UI/shermieFlag.png');
        this.load.image('sherminal', '/assets/UI/sherminal.png');

        for(let i = 0; i <= 10; i++){
            this.load.image(`loaditem${i}`, `/assets/UI/loaditem${i}.png`);
        }

        this.load.image(`boostItem`, `/assets/UI/boostitem.png`);
        this.load.image(`firewallItem`, `/assets/UI/firewall.png`);
        this.load.image(`roachItem`, `/assets/UI/roachitem.png`);
        this.load.image(`virusItem`, `/assets/UI/virusitem.png`);
        this.load.image(`invertItem`, `/assets/UI/invertitem.png`);
        
    }

    async create()
    {
        if(this.anims.exists('downloading')){
            this.anims.remove('downloading');
        }

        this.anims.create({
                key: 'downloading',
                frames: Array.from({ length: 11}, (_, i) => ({
                    key: `loaditem${i}`
                })),
                frameRate:12,
                repeat: 0
            });
            
        // Initialize 3D Space
        const { orbitControls } = await this.third.warpSpeed('-sky', '-ground', 'orbitControls');
        this.orbitControls = orbitControls

        await this.createSkyBox(2000, 'skybox');

        // Racer Controls
        this.keys = {
            accelerate: this.input.keyboard.addKey('W'),
            brake: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            accelerate2: this.input.keyboard.addKey('UP'),
            brake2: this.input.keyboard.addKey('DOWN'),
            left2: this.input.keyboard.addKey('LEFT'),
            right2: this.input.keyboard.addKey('RIGHT'),
            drift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            drift2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL),
            printPosition: this.input.keyboard.addKey('P'),
            pause: this.input.keyboard.addKey('ESC'),
            win: this.input.keyboard.addKey('N'),
            debugToggle: this.input.keyboard.addKey('O')
        };

        for (let i = 0; i < this.input.gamepad.total; i++)
        {
            this.gamepads[i] = this.getGamepad(i);
        }

        //On resume from pause menu
        this.events.on('resume', () => {
            this.togglePauseMenuOff();
        })

        this.offTrackText = this.add.text(640, 200, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            color: '#ffffff',          // white text
            stroke: '#000000',         // black outline
            strokeThickness: 6,        // thickness of outline
            align: 'center'
        }).setOrigin(0.5);

        this.offTrackText.setVisible(false);
    }

    update()
    {
        if (!this.clientPlayer || !this.cameraManager || !this.currentTrack) return;

        // calculate clientPlayer and camera rotation
        this.clientPlayer.update();
        const theta = this.getNewCameraAngle(this.clientPlayer)

        if(this.playerGo && !this.debug){
            if(this.gamepads[0])
                playerControllerInputChecks(this.clientPlayer, theta, this.gamepads[0]);
            else
                playerKeyInputChecks(this.clientPlayer, theta, this.keys);
        }
        else
            this.clientPlayer.stickToTrack();


        // Update AI
        for (let i = 0; i < this.aiRacers.length; i++) {
            this.aiRacers[i].update();
        }

        if (!this.debug)
        {
            this.cameraManager.updateCamera(this.clientPlayer.position, theta);
        }

        // check if any racers have completed the track
        if (this.currentTrack.hasCompletedTrack(this.clientPlayer.lapsCompleted))
        {
            // TODO: implement me
            console.log(this.clientPlayer.key + " finished lap")
        }

        // handle off-track respawn
        if (
            this.clientPlayer.isOffTrack &&
            this.clientPlayer.offTrackTime > this.clientPlayer.maxOffTrackTime &&
            !this.clientPlayer.isRespawning
        ) {
            // prevent instant loop
            this.clientPlayer.offTrackTime = 0;

            this.currentTrack.handlePitRespawn(this.clientPlayer);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePauseMenuOn();

        // Debug Keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.win)) this.winRace();
        if (Phaser.Input.Keyboard.JustDown(this.keys.debugToggle))
        {
            this.debug = !this.debug

            if (this.debug)
            {
                this.third.physics.debug.enable()
                this.clientPlayer.body.setVelocity(0, 0, 0);
                this.clientPlayer.body.setAngularVelocity(0, 0, 0);
            }
            else
            {
                this.third.physics.debug.disable()
            }

            this.orbitControls.enabled = this.debug
        }

        // console.log(
        //     "OffTrack:", this.clientPlayer.isOffTrack,  // Offtrack status
        //     "Time:", this.clientPlayer.offTrackTime
        // );

        this.updateOffTrackUI();
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
        else if (trackName === 'TerminalTrack')
            this.currentTrack = new TerminalTrack(this, trackName)
        else if (trackName === 'CharacterSelectionArea')
            this.currentTrack = new CharacterSelectionArea(this, trackName)
        else console.log(`${trackName} not in trackList`)
    }

    // UI Functions
    createPlayerUI(multiplayer = false)
    {
        if (multiplayer)
        {
            this.sherminal = this.add.image(130,70, 'sherminal');
            this.sherminal.setScale(0.10);
            this.lapUIBack = this.add.rectangle(150,325, 140, 60, 1,0.5);
            this.shermieFlag = this.add.image(130,330, 'flag');
            this.shermieFlag.setScale(0.05);
            this.sherminal2 = this.add.image(130,420, 'sherminal');
            this.sherminal2.setScale(0.10);
            this.lapUIBack2 = this.add.rectangle(150,685, 140, 60, 1,0.5);
            this.shermieFlag2 = this.add.image(130,690, 'flag');
            this.shermieFlag2.setScale(0.05);
        }
        else
        {
            this.sherminal = this.add.image(130,115, 'sherminal');
            this.sherminal.setScale(0.15);
            this.lapUIBack[0] = this.add.rectangle(130,657, 200, 100, 1,0.5);
            this.shermieFlag = this.add.image(100,660, 'flag');
            this.shermieFlag.setScale(0.08);
        }
    }

    updatePlayerUI(lapNumber = this.lapNumber[0], placeNumber = this.placeNumber[0], player = 1, multiplayer = false)
    {
        if(this.paused == false){
            this.placeNumber[player-1] = placeNumber;
            this.lapNumber[player-1] = lapNumber;
            if(multiplayer && player == 1){
                this.lapPosX = 160;
                this.lapPosY = 310;
                this.placePosX = 1180;
                this.placePosY = 250;
                this.lapFontSize = '30px';
                this.placeFontSize = '100px';
            }
            else if(multiplayer && player == 2){
                this.lapPosX = 160;
                this.lapPosY = 670;
                this.placePosX = 1180;
                this.placePosY = 620;
                this.lapFontSize = '30px';
                this.placeFontSize = '100px';
            }
            else{
                this.lapPosX = 140;
                this.lapPosY = 635;
                this.placePosX = 1180;
                this.placePosY = 570;
                this.lapFontSize = '55px';
                this.placeFontSize = '150px';
            }

            if (this.lapUI[player-1]) this.lapUI[player-1].destroy();
            if (this.placeUI[player-1]) this.placeUI[player-1].destroy();
            this.lapUI[player-1] = this.add.text(this.lapPosX, this.lapPosY, this.lapNumber[player-1] + "/" + this.currentTrack.lapGoal,
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: this.lapFontSize,
                    color: '#ffffff'
                });
            this.placeUI[player-1] = this.add.text(this.placePosX, this.placePosY, this.placeNumber[player-1],
                {
                    fontFamily: '"Press Start 2P"',
                    fontSize: this.placeFontSize,
                    color: '#f05C22'
                });
            this.placeUI[player-1].setShadow(3, 3, '#000000', 0);
        }
    }

    updateOffTrackUI() {
        const player = this.clientPlayer;

        if (!player) return;

        if (player.isOffTrack && !player.isRespawning) {
            const timeLeft = Math.max(
                0,
                (player.maxOffTrackTime - player.offTrackTime) / 1000
            );

            this.offTrackText.setText(
                `OFF TRACK!\nRespawning in ${timeLeft.toFixed(1)}`
            );

            this.offTrackText.setVisible(true);
        } else {
            this.offTrackText.setVisible(false);
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

            });
    }

    togglePauseMenuOff()
    {
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

    async createAIRacers(amount)
    {
        if (!this.currentTrack)
        {
            console.log("current race track not loaded")
            return;
        }

        const loadPromises = [];

        for (let i = 0; i < amount; i++) {
            const spawnTransform = this.currentTrack.getRandomSpawnTransform();

            let aiWaypoints = []
            for (let i = 0; i < this.currentTrack.lapCheckpointSensors.length; i++)
            {
                const checkpoint = this.currentTrack.lapCheckpointSensors[i]
                const newWaypoint = new AIWaypoint(checkpoint.position.clone(), checkpoint.tag, checkpoint.aiJitter)

                aiWaypoints.push(newWaypoint);
            }

            const ai = new AIPlayer(
                this, 
                spawnTransform, 
                aiWaypoints,
                this.currentTrack.subpaths,
                `COM${i + 1}`,
                this.characters[i+1]
                //Math.floor(Math.random() * this.characters.length)
            );
            loadPromises.push(ai.loadModelAsync());
        }
        await Promise.all(loadPromises);
    }

    createLoadingScreen(){
        this.loadingBackground = this.add.image(640,360, 'bg');
        this.loadingScreen = this.add.image(640,360, 'loaditem0');
        this.loadingScreen.setScale(1.3);
    }

    updateLoadingScreen(phase){
        this.children.bringToTop(this.loadingBackground);
        this.loadingScreen.destroy();
        this.loadingScreen = this.add.image(640,360, `loaditem${phase}`);
        this.loadingScreen.setScale(1.3);
    }

    hideLoadingScreen(){
        this.updateLoadingScreen(10);
        this.time.delayedCall(1000, () => {
            this.loadingScreen.destroy();
            this.loadingBackground.destroy();
            this.ready = true;

        });
    }

    startRace(){
        this.raceStarted = true;

        let i = 3;

        this.time.addEvent({
            delay: 1000,
            repeat: 3,
            callback: () => {
                if(this.countdown) this.countdown.destroy();

                this.countdown = this.add.text(640, 100, i > 0 ? `${i}` : 'GO!', {
                    fontFamily: '"Press Start 2P"',
                    fontSize: '100px',
                    color: '#f05C22'
                });

                this.countdown.setShadow(3, 3, '#000000', 0);

                this.countdown.setOrigin(0.5,0);
                
                if (i === 0){
                    this.time.delayedCall(1000, () => {
                        this.countdown.destroy();
                    });
                    this.time.delayedCall(100, () => {
                        //Start AI Racers
                        for (let i = 0; i < this.aiRacers.length; i++)
                        {
                            const racer = this.aiRacers[i]

                            racer.raceStart = true;
                        }
                        this.playerGo = true;
                    });
                }

                this.tweens.add({
                    targets: this.countdown,
                    scale: { from: 0.5, to: 1},
                    duration: 200,
                    ease: 'Back.Out'
                });
                i--;
            }
        });

    }

    powerupDownload(powerup){
        this.downloading = this.add.sprite(130,125, 'loaditem0').play('downloading');
        
        const powerupImages = {
            Virus: 'virusItem',
            SpeedBoost: 'boostItem',
            Invert: 'invertItem',
            Roach: 'roachItem'
        };

        const texture = powerupImages[powerup];

        this.downloading.once('animationcomplete-downloading', () => {
            this.downloading.destroy();

            if(texture){
            this.powerupItem = this.add.image(130, 120, texture);
        } else{
            console.log(powerup + ' not found');
        }
        })
    }

    powerUpClear(){
        if(this.powerupItem)
            this.powerupItem.destroy();
    }
}