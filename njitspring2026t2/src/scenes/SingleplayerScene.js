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
        this.selectedRaceTrack = data.selectedRaceTrack ?? this.trackList[1];

        this.clientPlayer = null;
        this.cameraManager = null;
        this.currentTrack = null;
        this.currentAudio = null;
        this.aiRacers = [];
        this.racerCompletionOrder = [];
        this.gamepads = [];

        this.paused = false;
        this.ready = false;
    }
     
    preload(){
        super.preload();
        this.load.image('loadingScreen', '/assets/UI/titleScreen.png');
    }

    async create()  
    {
        this.createLoadingScreen();
    
        this.currentScene = this;
        await super.create()

        this.updateLoadingScreen(1);

        this.cameraManager = new CameraManager(this.third.camera);
        await this.createRaceTrack(this.selectedRaceTrack)

        this.updateLoadingScreen(3);

        await this.currentTrack.loadData();

        this.updateLoadingScreen(5);
        
        this.clientPlayer = new Player(this, this.currentTrack.getRandomSpawnTransform(), "PLAYER", this.selectedCharacter);
 
        await this.clientPlayer.loadModelAsync();

        this.updateLoadingScreen(7);

        this.updateLoadingScreen(7);

        const aiAmount = 7
        await this.createAIRacers(aiAmount)

        this.updateLoadingScreen(9);

        this.currentAudio = this.currentTrack.startBGM();
        this.createPlayerUI();

        this.racerCompletionOrder.push({name: this.clientPlayer.key, score: 0})
        for (let i = 0; i < aiAmount; i++)
        {
            this.racerCompletionOrder.push({name: this.aiRacers[i].key, score: 0})
        }

        this.racerCompletionOrder.sort((a, b) => b.score - a.score)

        this.hideLoadingScreen();

    }

    update() {
        if(!this.ready)return;
        super.update();
        if (!this.clientPlayer || !this.cameraManager || !this.currentTrack) return;
        
        if(!this.raceStarted)
            this.startRace();

        // check if any racers have completed the track
        if (this.currentTrack.hasCompletedTrack(this.clientPlayer.lapsCompleted))
            this.winRace()

        const currentTrack = this.currentTrack
        const playerProgress = this.clientPlayer.getTrackCompletion(currentTrack.lapCheckpointGoal)

        const playerTrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === 'PLAYER')[0]
        playerTrackCompletion.score = playerProgress.score

        for (let i = 0; i < this.aiRacers.length; i++)
        {
            const racer = this.aiRacers[i]

            const aiProgress = racer.getTrackCompletion(currentTrack.lapCheckpointGoal)

            const aiTrackCompletion = this.racerCompletionOrder.filter(racer => racer.name === `COM${i + 1}`)[0]
            aiTrackCompletion.score = aiProgress.score
        }

        this.racerCompletionOrder.sort((a, b) => b.score - a.score)

        const playerPlacement = this.racerCompletionOrder.indexOf(playerTrackCompletion)
        //console.log(playerPlacement + 1)

        this.updatePlayerUI(this.clientPlayer.lapsCompleted + 1, playerPlacement + 1)
    }
}