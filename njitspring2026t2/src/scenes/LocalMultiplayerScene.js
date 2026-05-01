import { THREE } from '@enable3d/phaser-extension';
import CameraManager from '../gameObjects/CameraManager';
import { gameResolution } from '../main';
import { playerControllerInputChecks, playerKeyInputChecks } from '../helperFunctions/PlayerMovement';
import Player from '../gameObjects/Player';
import { Transform } from '../helperFunctions/Transform'
import RaceScene from './RaceScene';

class LocalPlayerObject
{
    constructor(player, camera, cameraManager, cameraOffset, gamepad)
    {
        this.player = player
        this.camera = camera
        this.cameraManager = cameraManager
        this.cameraOffset = cameraOffset
        this.gamepad = gamepad
    }
}

export default class LocalMultiplayerScene extends RaceScene {   
    constructor() 
    {
        super('LocalMultiplayerScene');
        this.localPlayers = [];
        this.cameras = [];

        this.cameraOffsets = [
            new THREE.Vector4(0, 360, 1280, 360),
            new THREE.Vector4(0, 0, 1280, 360),
        ]
    }

    init(data){
        super.init();
        this.selectedCharacter = data.selectedCharacter ?? 'shermie';
        this.selectedCharacter2 = data.selectedCharacter2 ?? 'shermald';

        this.clientPlayer = null;
        this.cameraManager = null;
        this.currentTrack = null;
        this.currentAudio = null;
        this.aiRacers = [];
        this.racerCompletionOrder = [];
        this.gamepads = [];
    }

    async create() 
    {
        this.currentScene = this;
        const playerCount = 2;

        await super.create();
    
        // disable internal rendering
        this.third.render = () => {};
        this.third.composer = null;
        this.third.renderer.autoClear = false;
        this.third.renderer.setScissorTest(true);
        
        // create level
        await this.createRaceTrack(this.trackList[1])
        await this.currentTrack.loadData();

        this.currentAudio = this.currentTrack.startBGM();
        //this.createPlayerUI();
        
        // initialize game objects
        for (let i = 0; i < playerCount; i++)
        {
            var camera;
            this.playerCharacter;
            if(i==0)
                this.playerCharacter = this.selectedCharacter;
            else
                this.playerCharacter = this.selectedCharacter2;
            
             const newPlayer = new Player(this, this.currentTrack.getRandomSpawnTransform(), `P${i+1}`, this.playerCharacter);

            if (i == 0)
            {
                camera = new THREE.PerspectiveCamera(
                    50,
                    1280 / 720,
                    0.1,
                    2000
                );

                this.clientPlayer = newPlayer;
                console.log("other.camera" + camera.far);
            }
            else 
            {
                camera = this.third.camera;
                console.log("third.camera" + camera.far);
                camera.updateMatrixWorld(true);
            }

            const cameraManager = new CameraManager(camera);
            if (i == 0) this.cameraManager = cameraManager;

            const newPlayerObject = new LocalPlayerObject(
                newPlayer,
                camera,
                cameraManager,
                this.cameraOffsets[i],
                this.gamepads[i]
            )

            this.localPlayers.push(newPlayerObject);
        }

        for (let i = 0; i < this.input.gamepad.total; i++)
        {
            this.gamepads[i] = this.getGamepad(i);
        }

        const aiAmount = 6
        this.createAIRacers(aiAmount)

        for (let i = 0; i < playerCount; i++)
        {
            this.racerCompletionOrder.push({name: this.localPlayers[i].player.key, score: 0})
        }
        for (let i = 0; i < aiAmount; i++)
        {
            this.racerCompletionOrder.push({name: this.aiRacers[i].key, score: 0})
        }

        this.createPlayerUI(true);
    }

    update() 
    {
        if (!this.clientPlayer || this.localPlayers.length == 0 || !this.currentTrack) return;

        // check if any racers have completed the track
        this.localPlayers.forEach(obj => {
            if (this.currentTrack.hasCompletedTrack(obj.player.lapsCompleted))
            {
                this.winRace()
            }
        })

        // clientPlayer updates
        this.clientPlayer.update()
        const theta = this.getNewCameraAngle(this.clientPlayer)
        if(this.input.gamepad.total > 0){
            playerControllerInputChecks(this.clientPlayer, theta, this.gamepads[0]);
        }
        else
            playerKeyInputChecks(this.clientPlayer, theta, this.keys);
    
        this.cameraManager.updateCamera(this.clientPlayer.position, theta);
        if(this.gamepads[0] == null)
            this.gamepads[0] = this.getGamepad(0);
      
        // other player updates
        this.localPlayers.forEach(playerObject => {
            if (playerObject.player !== this.clientPlayer){
                const player = playerObject.player;
                player.update();
                const theta = this.getNewCameraAngle(player);
                if(this.input.gamepad.total > 0){
                    playerControllerInputChecks(player, theta, playerObject.gamepad)
                }
                else
                    playerKeyInputChecks(player, theta, this.keys, 2);


                if(playerObject.gamepad == null)
                    playerObject.gamepad = this.getGamepad(1); //fix for more players, currently just 2.
                
                playerObject.cameraManager.updateCamera(player.position, theta);

                playerObject.camera.updateMatrixWorld(true);
            }
        });

        const currentTrack = this.currentTrack
        const player1Progress = this.clientPlayer.getTrackCompletion(currentTrack.lapCheckpointGoal)
        const player2Progress = this.localPlayers[1].player.getTrackCompletion(currentTrack.lapCheckpointGoal)

        const player1TrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === 'P1')[0]
        const player2TrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === 'P2')[0]

        player1TrackCompletion.score = player1Progress.score
        player2TrackCompletion.score = player2Progress.score

        for (let i = 0; i < this.aiRacers.length; i++) {
            this.aiRacers[i].update();
        }

        for (let i = 0; i < this.aiRacers.length; i++)
        {
            const racer = this.aiRacers[i]

            const aiProgress = racer.getTrackCompletion(currentTrack.lapCheckpointGoal)

            const aiTrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === `COM${i + 1}`)[0]
            aiTrackCompletion.score = aiProgress.score
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) this.togglePauseMenuOn();

        this.racerCompletionOrder.sort((a, b) => b.score - a.score)

        const player1Placement = this.racerCompletionOrder.indexOf(player1TrackCompletion)
        const player2Placement = this.racerCompletionOrder.indexOf(player2TrackCompletion)

        this.updatePlayerUI(this.clientPlayer.lapsCompleted + 1, player1Placement + 1,1, true)
        this.updatePlayerUI(this.localPlayers[1].player.lapsCompleted + 1, player2Placement + 1,2, true)

        console.log(this.localPlayers[1].player.body.velocity)

        // update displays
        const renderer = this.third.renderer;
        const { width, height } = gameResolution;

        //renderer.autoClear = false;
        ///renderer.setScissorTest(true);
        //renderer.clear();

        for(let i = 0; i < this.localPlayers.length; i++)
        {
            const camera = this.localPlayers[i].camera;

            camera.aspect = width / (height * 0.5);
            camera.updateProjectionMatrix();
            camera.updateMatrixWorld(true);

            const cameraOffset = this.localPlayers[i].cameraOffset;
            renderer.setViewport(cameraOffset.x, cameraOffset.y, cameraOffset.z, cameraOffset.w);
            renderer.setScissor(cameraOffset.x, cameraOffset.y, cameraOffset.z, cameraOffset.w);

            renderer.render(this.third.scene, camera);

            if (i < this.localPlayers.size - 1) {
                renderer.clearDepth();
                this.third.scene.updateMatrixWorld(true);
            }
        }
    }
}