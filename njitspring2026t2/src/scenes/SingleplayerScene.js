import CameraManager from '../gameObjects/CameraManager';
import Player from '../gameObjects/Player';
import RaceScene from './RaceScene';

export default class SingleplayerScene extends RaceScene {   
    constructor() {
        super('SingleplayerScene');
    }

    init(data){
        super.init();
        this.selectedCharacter = data.selectedCharacter ?? 'shermie';
    }

    async create() 
    {
        this.currentScene = this;
        await super.create()
        // this.third.physics.debug.enable()

        this.cameraManager = new CameraManager(this.third.camera);
        await this.createRaceTrack(this.trackList[1])
        await this.currentTrack.loadData();
        
        this.clientPlayer = new Player(this, this.currentTrack.getRandomSpawnTransform(), "PLAYER", this.selectedCharacter);
        
        const aiAmount = 0
        this.createAIRacers(aiAmount)

        this.currentAudio = this.currentTrack.startBGM();
        this.createPlayerUI();

        this.racerCompletionOrder.push({name: this.clientPlayer.key, score: 0})
        for (let i = 0; i < aiAmount; i++)
        {
            this.racerCompletionOrder.push({name: this.aiRacers[i].key, score: 0})
        }
    }

    update() {
        super.update();
        if (!this.clientPlayer || !this.cameraManager || !this.currentTrack) return;

        // check if any racers have completed the track
        if (this.currentTrack.hasCompletedTrack(this.clientPlayer.lapsCompleted))
            this.winRace()

        const currentTrack = this.currentTrack
        const playerProgress = this.clientPlayer.getTrackCompletion(currentTrack.lapGoal, currentTrack.lapCheckpointSensors, currentTrack.lapCheckpointTags.length)

        const playerTrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === 'PLAYER')[0]
        playerTrackCompletion.score = playerProgress.score

        for (let i = 0; i < this.aiRacers.length; i++)
        {
            const racer = this.aiRacers[i]

            const aiProgress = racer.getTrackCompletion(currentTrack.lapGoal, currentTrack.lapCheckpointSensors, currentTrack.lapCheckpointTags.length)

            const aiTrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === `COM${i + 1}`)[0]
            aiTrackCompletion.score = aiProgress.score
        }

        this.racerCompletionOrder.sort((a, b) => b.score - a.score)

        const playerPlacement = this.racerCompletionOrder.indexOf(playerTrackCompletion)

        this.updatePlayerUI(this.clientPlayer.lapsCompleted + 1, playerPlacement + 1)
    }
}