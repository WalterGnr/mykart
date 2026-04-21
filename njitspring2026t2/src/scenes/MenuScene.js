import RaceScene from "./RaceScene";

export default class MenuScene extends RaceScene {   
    constructor() 
    {
        super('MenuScene');
        this.menuSherminal;
        this.started = false;
        this.clickedContinue = false;
    }

    navitend;
    title;
    titleBG;

    init(data){
        this.started = data.started;
    }

    async preload() {
        this.load.image('bg', '/assets/UI/loadingBackground.jpg');
        this.load.image('titleScreen', '/assets/UI/titleScreen.png');
        this.load.image('menuSherminal', '/assets/UI/sherminal.png');
        this.load.image(`shermie`, `assets/UI/shermiecharselectnoback.png`);

        this.logoSound = new Audio('/assets/music/Shermie_Boot_Up.wav');
        this.currentAudio = new Audio('/assets/music/Shermie_Beginnings.wav');
    }

    async create() {
        this.currentScene = this;
        this.key1 = this.input.keyboard.addKey('ONE');
        this.key2 = this.input.keyboard.addKey('TWO');
        this.key3 = this.input.keyboard.addKey('THREE');
        this.key4 = this.input.keyboard.addKey('FOUR');


        if(this.started != true){

        this.background = this.add.image(640,360, 'bg');
        this.shermie = this.add.image(1050,500,"shermie");
        this.shermie.setScale(5);
        this.continueText = this.add.text(200, 300, "Hey! Click to Play or Press your Controller Button to Connect it \nif you want to play my game!",
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            })
        this.background.setInteractive({ useHandCursor:true});
        this.background.on('pointerdown', () => {
            if(this.clickedContinue == false){
                this.clickedContinue = true;
                this.continueText.destroy();
                this.shermie.destroy();
                //delayed call calls a function after a certain amount of milliseconds passes.
                this.startMenuIntro();
            }
        });
        }
        else
            this.titleScreen();
    }

    update() 
    {
        //Polling to skip menu straight to scene.
        if(this.key1.isDown) 
        {
            this.currentAudio.pause()
            this.scene.start("SingleplayerScene");
        }
        else if(this.key2.isDown)
        {
            this.currentAudio.pause()
            this.scene.start("LocalMultiplayerScene");
        }
        else if(this.key3.isDown)
        {
            this.currentAudio.pause()
            this.scene.start("OnlineMultiplayerScene");
        }
        else if(this.key4.isDown)
        {
            this.currentAudio.pause()
            this.scene.start("CharacterSelectionScene");
        }
        //Controller Check
        const pads = this.input.gamepad.gamepads;
        for (let pad of pads){
            if(!pad) continue;

            //Check if button pressed
            if(pad.buttons.some(button => button.pressed)){
                if(this.clickedContinue == false){
                    this.clickedContinue = true;
                    this.continueText.destroy();
                    this.shermie.destroy();
                    //delayed call calls a function after a certain amount of milliseconds passes.
                    this.startMenuIntro();
            }
            }
        }
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
                targetScene: targetScene
            }
            this.sceneSwitch(this.menuSherminal, 900, 360, 0.55, 'CharacterSelectionScene', this.data);
        });
    }

    //Makes navitend logo appear.
    navitendLogo(){
        this.navitend = this.add.text(600, 360, "navitend",
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff'
            })
        
        this.logoSound.currentTime = 0;
        this.logoSound.play()
    }

    //Hides navitend logo.
    navitendHide(){
        this.navitend.destroy();
    }

    //Makes title screen appear.
    titleScreen(){
        this.titleBG = this.add.image(640,360, 'titleScreen');
        this.title = this.add.text(350, 100, "Shermie Kart",
            {
                fontFamily: 'Arial',
                fontSize: '92px',
                color: '#ffee00'
            })


        this.titleBG.setInteractive({ useHandCursor:true});
        this.titleBG.on('pointerup', () => {
            this.menuSherminal = this.add.image(640, 380, 'menuSherminal');
            this.menuSherminal.setScale(0.33);
            this.togglePlayButtons();
        })

        this.currentAudio.currentTime = 0;
        this.currentAudio.play();
    }

    //Toggle the scene buttons
    togglePlayButtons(){
        this.changeSceneButton(640,340,'Single Player', 'SingleplayerScene','#0400ff');
        this.changeSceneButton(640,380,'Local Multiplayer', 'LocalMultiplayerScene', '#f700ff');
        this.changeSceneButton(640,420,'Online Multiplayer', 'OnlineMultiplayerScene', '#00ff37');
    }

    startMenuIntro(){
        this.time.delayedCall(1000, this.navitendLogo, [], this);
        this.time.delayedCall(3000, this.navitendHide, [], this);
        this.time.delayedCall(5000, this.titleScreen, [], this);
    }
}