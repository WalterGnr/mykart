import RaceScene from "./RaceScene";

export default class WinScene extends RaceScene {   
    constructor() 
    {
        super('WinScene');
        this.winSherminal;
    }

    navitend;
    title;
    titleBG;

    init(data){
        this.started = data.started;
    }

    async preload() {
        this.load.image('titleScreen', '/assets/UI/titleScreen.png');
        this.load.image('winSherminal', '/assets/UI/sherminal.png');
        this.load.image('winFlag', '/assets/UI/shermieFlag.png' );
        this.currentAudio = new Audio('/assets/music/ShermieBoard.wav');
    }

    async create() {

        this.titleScreen();
    }

    update() 
    {
    }

    //Function creates a button that changes to desired scene.
    changeSceneButton(positionx, positiony, name, targetScene, color){
        const singlePlayerButton = this.add.text(positionx,positiony, name, {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff',
            align: 'center',
            fixedWidth: 275,
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
            //this.currentAudio.pause()
            //this.scene.start(targetScene);
            this.data = {
                currentAudio: this.currentAudio,
                started: true
            }
            this.currentAudio.pause();
            this.sceneSwitch(this.winSherminal, positionx, positiony, 0.33, targetScene, this.data);
        });
    }


    //Makes title screen appear.
    titleScreen(){
        this.titleBG = this.add.image(640,360, 'titleScreen');
        this.winSherminal = this.add.image(640, 255, 'winSherminal');
        this.winSherminal.setScale(0.45);
        this.winFlag1 = this.add.image(180, 600, 'winFlag');
        this.winFlag1.setScale(0.2);
        this.winFlag2 = this.add.image(1180, 600, 'winFlag');
        this.winFlag2.setScale(0.2);
        this.title = this.add.text(460, 200, "You Win!",
            {
                fontFamily: 'Arial',
                fontSize: '92px',
                color: '#ffee00'
            });
            this.togglePlayButtons();

        this.currentAudio.currentTime = 0;
        this.currentAudio.play();
    }

    //Toggle the scene buttons
    togglePlayButtons(){
        this.changeSceneButton(640,380,'Menu', 'MenuScene','#f6ff00');
    }
}