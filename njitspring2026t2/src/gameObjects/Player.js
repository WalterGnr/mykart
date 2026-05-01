import Racer from "./Racer";


export default class Player extends Racer 
{
    constructor(scene, spawnTransform, key, character) 
    {
        super(scene, spawnTransform, key, character);

        this.maxSpeed = 60;
        this.turnSpeed = 1;

        this.oldPhysics = { 
            x: 0, y: 0, z: 0,
            rotationAngle: 0
        }
        this.isHumanPlayer = true;
        this.currentPowerup = null;
        this.ePressedLastFrame = false;
        this.eKey = this.raceScene.input.keyboard.addKey('E');
    }

    activatePowerup() 
    {
        console.log('E was pressed, the currentPowerup: ', this.currentPowerup);
        if (!this.currentPowerup) return;
        this.raceScene.powerUpClear();
        console.log('Activating: ', this.currentPowerup.name);
        this.currentPowerup.activate(this, this.raceScene);
        this.currentPowerup = null;
    }

    update() 
    {
        super.blink();
        const eDown = this.eKey.isDown;

        if (eDown && !this.ePressedLastFrame) 
        {
            this.activatePowerup();
        }

        this.ePressedLastFrame = eDown;

        // const {x, y, z} = this.body.velocity
        // const speed = Math.sqrt(x*x + y*y + z*z)
        // console.log(speed)
    }
}