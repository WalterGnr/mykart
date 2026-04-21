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
    }

    update() 
    {
        super.blink();
    }
}