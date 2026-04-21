import Player from '../gameObjects/Player';
import io from 'socket.io-client';
import RaceScene from './RaceScene';
import CameraManager from '../gameObjects/CameraManager';

export default class OnlineMultiplayerScene extends RaceScene {   
    constructor() 
    {
        super('OnlineMultiplayerScene');
        this.currentPlayers = { }
        this.socket = null
    }
    
    init(data){
        super.init();
        this.selectedCharacter = data.selectedCharacter ?? 'shermie';
    }

    async create() 
    {
        this.currentScene = this;
        await super.create()
        this.cameraManager = new CameraManager(this.third.camera);

        await this.createRaceTrack(this.trackList[1])
        await this.currentTrack.loadData();

        this.currentAudio = this.currentTrack.startBGM();
        this.createPlayerUI();

        // Server Init
        var self = this // NOTE: socket events require a reference to the scene
        this.socket = io('http://localhost:8081');

        this.socket.on('connect', function () {
            console.log('Connected!');
        });

        this.socket.on('currentPlayers', function (players) {
            Object.keys(players).forEach(function (id) {
                self.addPlayer(players[id])
            })

            self.clientPlayer = self.currentPlayers[self.socket.id]
        })

        this.socket.on('newPlayer', function (playerInfo) {
            self.addPlayer(playerInfo)
        })

        this.socket.on('playerDisconnected', function (playerID) {
            var player = self.currentPlayers[playerID].removeFromParent()
            self.third.destroy(player);
            self.third.physics.destroy(player);

            delete self.currentPlayers[playerID]
        })

        this.socket.on('playerMoved', function (playerInfo) {
            const player = self.currentPlayers[playerInfo.id]
            player.body.setCollisionFlags(2)

            player.position.set(playerInfo.x, playerInfo.y, playerInfo.z)
            player.rotation.y = playerInfo.rotationAngle

            player.body.needUpdate = true

            player.body.once.update(() => {
                player.body.setCollisionFlags(0)

                player.body.setVelocity(0, 0, 0)
                player.body.setAngularVelocity(0, 0, 0)
            })
        });
    }

    update() 
    {
        super.update()
        if (!this.clientPlayer || !this.cameraManager) return

        // if (this.currentTrack.hasCompletedTrack(this.clientPlayer.lapsCompleted))
            // this.winRace()

        // TODO: update any AI players
        
        // socket behavior
        const { x: currentX, y: currentY, z: currentZ } = this.clientPlayer.position
        const currentRot = this.clientPlayer.rotation.y

        const currentPhysics = {
            x: currentX,
            y: currentY,
            z: currentZ,
            rotationAngle: currentRot
        }

        // emit player movement
        this.socket.emit('playerMovement',{
            x: currentX,
            y: currentY,
            z: currentZ,
            rotationAngle: currentRot
        })
        

        // save old position data
        this.clientPlayer.oldPhysics = currentPhysics

        this.updatePlayerUI(this.clientPlayer.lapsCompleted + 1)
    }

    addPlayer(playerInfo)
    {
        const newPlayer = new Player(this, this.currentTrack.getRandomSpawnTransform(), playerInfo.id, this.selectedCharacter);
        newPlayer.setTrackMesh(this.trackMesh)
        this.currentPlayers[playerInfo.id] = newPlayer
    }
}