import RaceScene from './RaceScene';
import Racer from '../gameObjects/Racer';
import { THREE } from '@enable3d/phaser-extension';
import { createSprite } from '../helperFunctions/Sprite';
import { Transform } from '../helperFunctions/Transform';
import SingleplayerScene from './SingleplayerScene';

export default class CharacterSelectionScene extends RaceScene {   
    constructor() 
    {
        super('CharacterSelectionScene');
        this.characterSherminal;
        this.characterRacers = {};
        this.targetScene;
        this.player1Selected = false;
        this.selectedCharacter2;

        this.ready = false;

        this.characterButtons = {};
    }

    async preload() {
        this.load.image('characterSherminal', '/assets/UI/sherminal.png');
        this.load.image('illusion', '/assets/UI/illusion.png');
        for(const character of this.characters)
        {
            this.load.image(`${character}Portrait`, `assets/UI/${character}charselect.png`);
        }

        this.load.image('trophy', '/assets/UI/shermiecupicon.png');
    }

    init(data){
        super.init();
        this.currentAudio = data.currentAudio;
        this.targetScene = data.targetScene;
    }

    async create() 
    {
        this.loadingScreen = this.add.image(640,360, 'illusion');
        this.loadingScreen.setScale(0.8);

        await new Promise(resolve => this.time.delayedCall(0, resolve));

        this.currentScene = this;
        await super.create()
        await this.createRaceTrack('CharacterSelectionArea');
        
        this.wall = createSprite(
                    this.third.scene,
                    '/assets/skybox/DigitalWorld.png',
                    new THREE.Vector3(0,0,0),
                    new THREE.Vector2(50,50),
        );

        this.characterSherminal = this.add.image(900, 360, 'characterSherminal');
        
        this.characterSherminal.setScale(0.55);
        

        this.third.camera.position.set(0.5,20,5);
     
        this.i = 0;
            for(const character of this.characters)
        {
            //this.load.image(`${character}Portrait`, `assets/UI/${character}charselect.png`);
            this.characterRacers[character] = new Racer(this, new Transform(new THREE.Vector3(0,5,0), new THREE.Euler(0, 0, 0)), `${character}`, `${character}`);
            await this.characterRacers[character].loadModelAsync();
            this.characterRacers[character].body.setCollisionFlags(2);
        }
  
        this.characterButtons['shermie'] = this.changeCharacterButton(750,240,'shermie');
        this.characterButtons['shermald'] = this.changeCharacterButton(900,240,'shermald');
        this.characterButtons['fido'] = this.changeCharacterButton(1050,240,'fido');
        this.characterButtons['kitty'] = this.changeCharacterButton(750,370,'kitty');
        this.characterButtons['r04ch'] = this.changeCharacterButton(900,370,'r04ch');
        this.characterButtons['ratley'] = this.changeCharacterButton(1050,370,'ratley');
        this.characterButtons['snakington'] = this.changeCharacterButton(750,500,'snakington');
        this.characterButtons['charles'] = this.changeCharacterButton(900,500,'charles');
        this.characterButtons['virrel'] = this.changeCharacterButton(1050,500,'virrel');

        //this.clientPlayer = new Racer(this, new Transform(new THREE.Vector3(0,5,0), new THREE.Euler(0, 0, 0)), "PLAYER", "r04ch");
        //this.clientPlayer.body.setCollisionFlags(2);
        //this.clientPlayer.position.set(-2,16,0);
        //this.clientPlayer.body.needUpdate = true;
        //this.clientPlayer.position.set(0,5,0);
        //this.third.camera.lookAt(this.clientPlayer);
        // new Player(this, new THREE.Vector3(50,25,0), "PLAYER2", "Shermald")
        // Spawn the AI car at a starting position (FIXME)
        this.i = 0;
        //this.updatePlayerUI(3,5);
        this.loadingScreen.destroy();
    }

    update() {
        
        for(const character of Object.values(this.characterRacers))
        {
            character.blink();
        }
       //this.characterRacers[3].position.set(-2,this.i,0);
       //this.characterRacers[3].body.needUpdate = true;
        this.i += 0.1;
        //this.clientPlayer.blink();
    }

    changeCharacterButton(positionx, positiony, character){
        const singlePlayerButton = this.add.image(positionx, positiony, `${character}Portrait`);


        singlePlayerButton.setInteractive({ useHandCursor:true});

        singlePlayerButton.on('pointerover', () => {
            //this.characterRacers[character].position.set(-2,16.5,0);
            //this.characterRacers[character].body.needUpdate = true;
            this.moveCharacter(this.characterRacers[character], -2, 16.75, 0);
        });

        singlePlayerButton.on('pointerout', () => {
            this.moveCharacter(this.characterRacers[character], -2, 16.75, 7, false);
        });

        singlePlayerButton.on('pointerdown', () => {
            if(this.targetScene == 'LocalMultiplayerScene')
            {
                if(this.player1Selected == false)
                {
                    this.player1Selected = true;
                    this.selectedCharacter = character;
                }
                else{
                    this.selectedCharacter2 = character
                    /*this.data = {
                        selectedCharacter: this.selectedCharacter,
                        selectedCharacter2: character
                    }
                    this.selectedCharacter2 = character*/
                    this.player1Selected = false;
                    this.currentAudio.pause()
                    //this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);
                    this.nextButtons();
                    this.moveCharacter(this.characterRacers[character], -2, 16.75, 7, false)

                }
            }
            else{
            this.data = {
                selectedCharacter: character
            }
            this.currentAudio.pause()
            //this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);
            this.nextButtons();
            this.moveCharacter(this.characterRacers[character], -2, 16.75, 7, false)
            }
        });
        return singlePlayerButton;
    }

    changeMapButton(positionx, positiony, map){
        const singlePlayerButton = this.add.image(positionx, positiony, 'trophy');


        singlePlayerButton.setInteractive({ useHandCursor:true});

        singlePlayerButton.on('pointerover', () => {
            //this.characterRacers[character].position.set(-2,16.5,0);
            //this.characterRacers[character].body.needUpdate = true;
            this.moveCharacter(this.characterRacers[this.selectedCharacter], -2, 16.75, 0);
        });

        singlePlayerButton.on('pointerout', () => {
            this.moveCharacter(this.characterRacers[this.selectedCharacter], -2, 16.75, 7, false);
        });

        singlePlayerButton.on('pointerdown', () => {
            if(this.targetScene == 'LocalMultiplayerScene')
            {
                if(this.player1Selected == false)
                {
                    this.player1Selected = true;
                }
                else{
                    this.data = {
                        selectedCharacter: this.selectedCharacter,
                        selectedCharacter2: this.selectedCharacter2,
                        selectedRaceTrack: map
                    }
                    this.player1Selected = false;
                    this.currentAudio.pause()
                    this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);

                }
            }
            else{
            this.data = {
                selectedCharacter: this.selectedCharacter,
                selectedRaceTrack: map
            }
            this.currentAudio.pause()
            this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);
            }
        });
    }

    nextButtons(){
        for(const button of Object.values(this.characterButtons))
        {
            if(button)
                button.destroy();
        }

        this.changeMapButton(750,370, this.trackList[1]);
        this.changeMapButton(900,370, this.trackList[2]);
        this.changeMapButton(1050,370, this.trackList[3]);
    }

    moveCharacter(character, x, y, z, over = true)
   {
        if(over){
        character.position.set(-2,16.75,-7);
        character.body.needUpdate = true;
        }

        this.tweens.killTweensOf(character.position);
        this.tweens.add(
            {
                targets: character.position,
                x: x,
                y: y,
                z: z,
                duration: 100,
                onUpdate: () => {
                    character.body.needUpdate = true;
                }

            }
        );
   }

}