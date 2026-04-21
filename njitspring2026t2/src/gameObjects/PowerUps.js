import { ExtendedObject3D, THREE } from '@enable3d/phaser-extension';
import Racer from './Racer';

export const PowerupTypes = {
    'Virus': 0,
    'SpeedBoost': 1,
}

class PowerUps 
{
    constructor(name) 
    {
        this.name = name;
    }

    activate(user, scene) { }
}

class VirusProjectile extends ExtendedObject3D
{
    constructor(user, scene)
    {
        super({ key: 'VirusProjectile' })

        const offsetDistance = 5
        const angle = user.rotation.y - Math.PI * 0.5
        const spawnPosition = new THREE.Vector3(
            user.position.x + Math.cos(angle) * offsetDistance,
            user.position.y + 1.1,
            user.position.z + Math.sin(angle) * offsetDistance
        )

        this.position.copy(spawnPosition);
        this.rotation.y = user.rotation.y;

        scene.third.add.existing(this)
        scene.third.physics.add.existing(this, {
            shape: 'sphere',
            ignoreScale: true,
            height: 0.8,
            radius: 0.4,
        })

        const mesh = scene.third.make.sphere({ radius: 0.5 });
        mesh.material = new THREE.MeshPhongMaterial({ color: 0x3366ff });
        this.add(mesh);

        this.speed = user.speed * 1.5
        const y = -this.rotation.y;
        const x = Math.sin(y) * this.speed;
        const z = Math.cos(y) * this.speed;
        this.body.setVelocity(-x, 0, -z)

        var self = this
        this.body.on.collision((otherObject, event) => {
            if (otherObject instanceof Racer)
            {
                // TODO: make other racer get hurt
                scene.third.destroy(self)
                scene.third.physics.destroy(self);      
            }
        })
    }
}

export class Virus extends PowerUps 
{
    constructor() 
    {
        super('Virus');
    }

    activate(user, scene) 
    {
        new VirusProjectile(user, scene);
    }
}

export class SpeedBoost extends PowerUps {
    constructor(originalSpeed) {
        super('Speed');
        this.originalSpeed = originalSpeed
    }

    activate(user, scene) {
        this.activateSpeedBoost(user);
    }

    activateSpeedBoost(user, multiplier = 1.5, decayRate = 0.3)
    {
        // Adds to the racer's powerupBoostSpeed so it stacks with
        // any active drift boost instead of overwriting currSpeed.
        const boostAmount = user.maxSpeed * multiplier;
        user.applyPowerupBoost(boostAmount, decayRate);
    }
}
