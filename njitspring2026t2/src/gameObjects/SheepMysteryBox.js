import { ExtendedObject3D, ThirdPersonControls, THREE } from "@enable3d/phaser-extension";
import { PowerupTypes, SpeedBoost, Virus, Invert, Roach } from "./PowerUps";
import Racer from "./Racer";
import { createSprite } from "../helperFunctions/Sprite";

export default class SheepMysteryBox extends ExtendedObject3D {
    constructor(scene, position) {
        super({ key: "SheepMysteryBox" });
        this.scene = scene;
        this.position.copy(position);

        const scale = 2
        const mesh = scene.third.make.box({
            width: 2.5 * scale,
            height: 2.5 * scale,
            depth: 2.5 * scale
        });

        //mesh.material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        mesh.visible = false;
        this.add(mesh);

        createSprite(
            this,
            '/assets/gameObjects/downloaditem.png',
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector2(5*scale, 5*scale)
        );

        scene.third.add.existing(this);
        scene.third.physics.add.existing(this, { collisionFlags: 6 });

        var self = this
        this.body.on.collision((otherObject, event) => {
            if (otherObject instanceof Racer) 
            {
                console.log('Player collided with box');
                const keys = Object.keys(PowerupTypes);
                const randomIndex = Math.floor(Math.random() * keys.length);
                const randomKey = keys[randomIndex];

                const randomType = PowerupTypes[randomKey];

                self.powerup = self.createPowerup(randomType, otherObject);

                if(otherObject.key == "PLAYER")
                    this.scene.powerupDownload(randomKey);
                // TODO: reset back to getting a random powerup after midterm
                self.givePowerup(otherObject)

                // Destroy box after giving player powerup
                self.scene.third.destroy(self)
                self.scene.third.physics.destroy(self);        
            }
        })
    }

    // update() 
    // {
    //     this.rotation.y += 0.03;
    // }

    createPowerup(type, racer)
    {
        switch (type)
        {
            case PowerupTypes.SpeedBoost:
                return new SpeedBoost();

            case PowerupTypes.Virus:
                return new Virus();
            
            case PowerupTypes.Invert:
                return new Invert();

            case PowerupTypes.Roach:
                return new Roach();

            default:
                console.log(type + ' not found');
        }
    }

    givePowerup(player)
    {
        player.currentPowerup = this.powerup;
    }
}