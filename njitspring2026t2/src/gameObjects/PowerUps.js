import { ExtendedObject3D, THREE } from '@enable3d/phaser-extension';
import { createSprite } from "../helperFunctions/Sprite";
import Racer from './Racer';

export const PowerupTypes = {
    'Virus': 0,
    'SpeedBoost': 1,
    'Invert': 2,
    'Roach': 3,
}
function getRacer(object) {
    let obj = object;
    while (obj) {
        if (obj.applyInvert) return obj;
        obj = obj.parent;
    }
    return null;
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

        /*const mesh = scene.third.make.sphere({ radius: 0.5 });
        mesh.material = new THREE.MeshPhongMaterial({ color: 0x3366ff });
        this.add(mesh);*/

        createSprite(
            this,
            '/assets/gameObjects/virusitem.png',
            new THREE.Vector3(0,0,0),
            new THREE.Vector2(1.5, 1.5)
        );

        this.projectileSpeed = Math.max(user.currSpeed * 1.5, 20);
        this.trackMesh = user.trackMesh;
        this.raycaster = new THREE.Raycaster();
        this.targetHeight = 3;

        const y = -this.rotation.y;
        const x = Math.sin(y) * this.projectileSpeed;
        const z = Math.cos(y) * this.projectileSpeed;
        this.body.setVelocity(-x, 0, -z)
        this.body.setGravity(0, 0, 0);

        var self = this
        this.body.on.collision((otherObject, event) => {
            console.log('Virus hit: ', otherObject, otherObject.key, otherObject.constructor.name);
            if (otherObject.applyVirus && otherObject !== user)
            {
                otherObject.applyVirus(5000);
                scene.third.destroy(self)
                scene.third.physics.destroy(self);      
            }
        })
        this._update = () => self._stickToTrack();
        scene.events.on('update', this._update)
    }
    _stickToTrack() {
        if (!this.trackMesh || !this.body) return;

        const rayOrigin = this.position.clone();
        rayOrigin.y += 10;
        this.raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObject(this.trackMesh, true);

        if (intersects.length > 0) {
            const targetY = intersects[0].point.y + this.targetHeight;
            const diff = targetY - this.position.y;
            if (Math.abs(diff) < 5) {
                this.body.setVelocity(
                    this.body.velocity.x,
                    diff * 20,
                    this.body.velocity.z
                );
            }
        }
    }
}
class InvertProjectile extends ExtendedObject3D
{
    constructor(user, scene)
    {
        super({ key: 'InvertProjectile' })

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

        /*const mesh = scene.third.make.sphere({ radius: 0.5 });
        mesh.material = new THREE.MeshPhongMaterial({ color: 0xff00ff });
        this.add(mesh);*/

        createSprite(
            this,
            '/assets/gameObjects/invertitem.png',
            new THREE.Vector3(0,0,0),
            new THREE.Vector2(1.5, 1.5)
        );

        this.projectileSpeed = Math.max(user.currSpeed * 1.5, 20);
        this.trackMesh = user.trackMesh;
        this.raycaster = new THREE.Raycaster();
        this.targetHeight = 3;

        const y = -this.rotation.y;
        const x = Math.sin(y) * this.projectileSpeed;
        const z = Math.cos(y) * this.projectileSpeed;
        this.body.setVelocity(-x, 0, -z)
        this.body.setGravity(0, 0, 0);

        var self = this
        this.body.on.collision((otherObject, event) => {
            console.log('Invert hit: ', otherObject.key, otherObject.constructor.name);
            if (otherObject.applyInvert && otherObject !== user)
            {
                console.log('Invert hit player');
                otherObject.applyInvert(5000);

                scene.third.destroy(self)
                scene.third.physics.destroy(self);      
            }
        })
        this._update = () => self._stickToTrack();
        scene.events.on('update', this._update);
    }
    _stickToTrack(){
        if (!this.trackMesh || !this.body) return;

        const rayOrigin = this.position.clone();
        rayOrigin.y += 10;
        this.raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObject(this.trackMesh, true);

        if (intersects.length > 0) {
            const targetY = intersects[0].point.y + this.targetHeight;
            const diff = targetY - this.position.y;
            if (Math.abs(diff) < 5) {
                this.body.setVelocity(
                    this.body.velocity.x,
                    diff * 20,
                    this.body.velocity.z
                );
            }
        }
    }
}

class RoachProjectile extends ExtendedObject3D
{
    constructor(user, scene)
    {
        super({ key: 'RoachProjectile' })

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

        /*
        const mesh = scene.third.make.sphere({ radius: 0.5 });
        mesh.material = new THREE.MeshPhongMaterial({ color: 0xff00ff });
        this.add(mesh);*/

        createSprite(
            this,
            '/assets/gameObjects/roachitem.png',
            new THREE.Vector3(0,0,0),
            new THREE.Vector2(1.5, 1.5)
        );

        this.projectileSpeed = Math.max(user.currSpeed * 1.5, 20);
        this.trackMesh = user.trackMesh;
        this.raycaster = new THREE.Raycaster();
        this.targetHeight = 3;
        const y = -this.rotation.y;
        const x = Math.sin(y) * this.projectileSpeed;
        const z = Math.cos(y) * this.projectileSpeed;
        this.body.setVelocity(-x, 0, -z)
        this.body.setGravity(0, 0, 0);

        var self = this
        this.body.on.collision((otherObject, event) => {
            console.log('Roach hit: ', otherObject.key, otherObject.constructor.name);
            if (otherObject.applyRoach && otherObject !== user)
            {
                console.log('Roach hit player');
                otherObject.applyRoach(5000);

                scene.third.destroy(self)
                scene.third.physics.destroy(self);      
            }
        })
        this._update = () => self._stickToTrack();
        scene.events.on('update', this._update);
    }
    _stickToTrack(){
        if (!this.trackMesh || !this.body) return;

        const rayOrigin = this.position.clone();
        rayOrigin.y += 10;
        this.raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObject(this.trackMesh, true);

        if (intersects.length > 0) {
            const targetY = intersects[0].point.y + this.targetHeight;
            const diff = targetY - this.position.y;
            if (Math.abs(diff) < 5) {
                this.body.setVelocity(
                    this.body.velocity.x,
                    diff * 20,
                    this.body.velocity.z
                );
            }
        }
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
    constructor() {
        super('Speed');
    }

    activate(user, scene) {
        this.activateSpeedBoost(user);
    }

    activateSpeedBoost(user, multiplier = 1.5, duration = 1000) {
        // Añade el boost como velocidad extra sobre maxSpeed, acumulándose con el drift boost
        user.powerupBoostSpeed = user.maxSpeed * multiplier;
        setTimeout(() => { user.powerupBoostSpeed = 0; }, duration);
    }
}

export class Invert extends PowerUps 
{
    constructor() 
    {
        super('Invert');
    }

    activate(user, scene) 
    {
        new InvertProjectile(user, scene);
    }
}

export class Roach extends PowerUps 
{
    constructor() 
    {
        super('Roach');
    }

    activate(user, scene) 
    {
        new RoachProjectile(user, scene);
    }
}