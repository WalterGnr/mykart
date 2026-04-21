import Player from '../gameObjects/Player';
import RaceScene from './RaceScene';
import CameraManager from '../gameObjects/CameraManager';
import { Transform } from '../gameObjects/Racer';
import Racer from '../gameObjects/Racer';
import { THREE } from '@enable3d/phaser-extension';
import AIPlayer from '../gameObjects/AIPlayer';
import SheepMysteryBox from '../gameObjects/SheepMysteryBox';

export default class CharacterSelectionScene extends RaceScene {   
    constructor() 
    {
        super('CharacterSelectionScene');
        this.characterSherminal;
        this.characterRacers = {};
        this.targetScene;
        this.player1Selected = false;
        this.selectedCharacter2;
    }

    async preload() {
        this.load.image('characterSherminal', '/assets/UI/sherminal.png');
        for(const character of this.characters)
        {
            this.load.image(`${character}Portrait`, `assets/UI/${character}charselect.png`);
        }
    }

    init(data){
        super.init();
        this.currentAudio = data.currentAudio;
        this.targetScene = data.targetScene;
    }

    async create() 
    {
        this.currentScene = this;
        await super.create()
        await this.createRaceTrack(this.trackList[4]);
        
        this.wall = this.createSprite(
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
            this.characterRacers[character].body.setCollisionFlags(2);
        }
  
        this.changeCharacterButton(900,240,'shermie');
        this.changeCharacterButton(800,370,'shermald');
        this.changeCharacterButton(1000,370,'fido');
        this.changeCharacterButton(800,500,'virrel');
        this.changeCharacterButton(1000,500,'r04ch');
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
    }

    update() {
        /*for(const character of this.characterRacers)
        {
            character.position.set(-2,this.i,0);
            character.body.needUpdate = true;
        }*/
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
            this.moveCharacter(this.characterRacers[character], -2, 16.5, 0);
        });

        singlePlayerButton.on('pointerout', () => {
            this.moveCharacter(this.characterRacers[character], -2, 16.5, 7, false);
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
                    this.data = {
                        selectedCharacter: this.selectedCharacter,
                        selectedCharacter2: character
                    }
                    this.player1Selected = false;
                    this.currentAudio.pause()
                    this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);

                }
            }
            else{
            this.data = {
                selectedCharacter: character
            }
            this.currentAudio.pause()
            this.sceneSwitch(this.characterSherminal, 130, 115, .15, this.targetScene, this.data);
            }
        });
    }

    moveCharacter(character, x, y, z, over = true)
   {
        if(over){
        character.position.set(-2,16.5,-7);
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