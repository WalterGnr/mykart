import RaceScene from "./RaceScene";

export default class PauseScene extends RaceScene {   
    constructor() 
    {
        super('PauseScene');
        this.targetScene = 'MenuScene';
        this.pauseSherminal;
        this.resumeButton = null;
        this.menuButton = null;
        this.background;
    }

    init(data)
    {
        this.targetScene = data.targetScene;
        this.shermieFlag = data.shermieFlag;
        this.sherminal = data.sherminal;
        this.lapUI = data.lapUI;
        this.placeUI = data.placeUI;
        this.currentAudio = data.currentAudio;
        this.lapUIBack = data.lapUIBack;
        this.currentScene = data.currentScene;
    }

    async preload() 
    {
        this.load.image('flag', '/assets/UI/shermieFlag.png');
        this.load.image('pauseSherminal', '/assets/UI/sherminal.png');
        this.load.image('cyberBackground', '/assets/skybox/DigitalWorld.png');
    }

    async create()
    {
        this.background = this.add.image(1000, 500, 'cyberBackground');
        this.pauseSherminal = this.add.image(640, 360, 'pauseSherminal');
        this.pauseSherminal.setScale(0.55);
        this.createPauseButtons();
    }

    update() { }

    //Function creates a button that changes to desired scene.
    changeSceneButton(positionx, positiony, name, targetScene, color, transition, data = null){
        const singlePlayerButton = this.add.text(positionx,positiony, name, {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff',
            align: 'center',
            fixedWidth: 300,
            backgroundColor: '#2d2d2d00'
        }).setPadding(5).setOrigin(0.5);

        singlePlayerButton.setShadow(3, 3, color, 3, false, true);

        singlePlayerButton.setInteractive({ useHandCursor:true});

        singlePlayerButton.on('pointerover', () => {
            singlePlayerButton.setBackgroundColor('#8d8d8d');
        });

        singlePlayerButton.on('pointerout', () => {
            singlePlayerButton.setBackgroundColor('#2d2d2d00');
        });

        singlePlayerButton.on('pointerdown', () => {
            if(transition == 'resume'){
                if(data == null){
                this.scene.resume(targetScene);
                this.scene.stop();
                this.hidePauseUI();
                }
            }
            else{
                this.clearPlayerUI();
                this.stopAudio();
                if(data == null)
                    this.sceneSwitch(this.pauseSherminal, 640, 380, 0.33, targetScene, null);
                else
                    this.sceneSwitch(this.pauseSherminal, 640, 380, 0.33, targetScene, data);
            }
        });
        return singlePlayerButton;
    }

    hidePauseUI(){
        if(this.resumeButton != null)
            this.resumeButton.destroy();
        if(this.menuButton != null)
            this.menuButton.destroy();
        if(this.pauseSherminal != null)
            this.pauseSherminal.destroy();
        if(this.background != null)
            this.background.destroy();
    }

    clearPlayerUI(){
        this.sherminal.destroy();
        this.shermieFlag.destroy();
        for(let i = 0; i < this.lapUI.length; i++){ //lapUI, placeUI, lapUIBack length should be the same
            if(this.lapUI[i] != null)
                this.lapUI[i].destroy();
            if(this.placeUI[i] != null)
                this.placeUI[i].destroy();
            if(this.lapUIBack[i] != null)
                this.lapUIBack[i].destroy();
        }
    }

    stopAudio(){
        if(this.currentAudio){
            this.currentAudio.pause();
        }
    }


    //Create the pause buttons
    createPauseButtons(){
        this.resumeButton = this.changeSceneButton(640, 250, "Resume", this.targetScene, '#2d2d2d00', 'resume');
        this.menuData = {
            started: true
        };
        this.menuButton = this.changeSceneButton(640, 300, "Menu", 'MenuScene', '#2d2d2d00', 'start', this.menuData)
    }
}