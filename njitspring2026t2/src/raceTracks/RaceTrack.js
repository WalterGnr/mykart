import { THREE } from '@enable3d/phaser-extension'
import { Math as PhaserMath } from 'phaser'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Racer from '../gameObjects/Racer'
import SheepMysteryBox from '../gameObjects/SheepMysteryBox'
import { createCheckpoints } from '../helperFunctions/Checkpoints'
import { Transform } from '../helperFunctions/Transform'

export class SubPath
{
    constructor(startTag, endTag)
    {
        this.startTag = startTag
        this.endTag = endTag
    }

    getStartIndex(checkpointList)
    {
        return checkpointList.findIndex(checkpoint => 
            checkpoint.tag === this.startTag
        )
    }

    getEndIndex(checkpointList)
    {
        return checkpointList.findIndex(checkpoint => 
            checkpoint.tag === this.endTag
        )
    }
}

export default class RaceTrack {
    constructor(scene, trackName) {
        this.name = trackName
        this.raceScene = scene
        this.BGM = null
        this.bgmStarted = false

        this.dataFilePath = ''
        this.lapCheckpointSensors = []
        this.subpaths = {}
        this.racerStartTransforms = []
        this.waypoints = []
        this.lapGoal = 0
        this.mysteryBoxGroups = []
    }

    startBGM() {
        if (this.BGM && !this.bgmStarted) {
            this.BGM.currentTime = 0
            this.BGM.play()
            this.bgmStarted = true
        }
        return this.BGM;
    }

    getRandomSpawnTransform() {
        const index = Math.floor(Math.random() * this.racerStartTransforms.length)
        const newSpawn = this.racerStartTransforms[index]

        this.racerStartTransforms = this.racerStartTransforms.filter(
            transform => transform !== newSpawn
        )

        return newSpawn
    }

    loadTrackGLB(path, path2)
    {
        const loader = new GLTFLoader();
        loader.load(path, (glb) => {
            const track = glb.scene
            track.scale.set(5, 5, 5)

            track.traverse((child) => {
                if (child.isMesh)
                    child.material.wireframe = false; 
            });

            this.raceScene.third.scene.add(track);
            
            if (this.raceScene.clientPlayer)
                this.raceScene.clientPlayer.setTrackMesh(track)

            if (this.raceScene.aiRacers) { 
                for (let i = 0; i < this.raceScene.aiRacers.length; i++) {
                    this.raceScene.aiRacers[i].setTrackMesh(track)
                }
            }

            if (this.raceScene.localPlayers)
            {
                for(let i = 1; i < this.raceScene.localPlayers.length; i++)
                {
                    this.raceScene.localPlayers[i].player.setTrackMesh(track);
                }
            }

            this.raceScene.trackMesh = track
        })

        //apply same raycasting logic Stick to track function will mainly be for the track
        //if stick to track detects off track background mess will apply slow down effect ... 

        const loader2 = new GLTFLoader();
        loader2.load(path2, (glb) => {
            const background = glb.scene;
            background.scale.set(5, 5, 5);
            
            this.raceScene.third.scene.add(background);

            background.traverse((child) => {
                if (child.isMesh)
                    child.material.wireframe = false;
            });

            if (this.raceScene.clientPlayer)
                this.raceScene.clientPlayer.setBackgroundMesh(background);

            if (this.raceScene.aiRacers) {
                for (let i = 0; i < this.raceScene.aiRacers.length; i++) {
                    this.raceScene.aiRacers[i].setBackgroundMesh(background);
                }
            }

            if (this.raceScene.localPlayers) {
                for (let i = 1; i < this.raceScene.localPlayers.length; i++) {
                    this.raceScene.localPlayers[i].player.setBackgroundMesh(background);
                    
                }
            }

            this.raceScene.background = background;
        });
    }

    async loadData()
    {
        try 
        {
            const response = await fetch(this.dataFilePath);
            if (!response.ok)
                throw new Error('JSON loaded incorrectly')

            const json = await response.json()

            this.lapGoal = json.lapGoal

            // create checkpoint sensors
            this.lapCheckpointGoal = json.lapCheckpointGoal;

            json.subpaths.forEach(obj => {
                this.subpaths[obj.id] = new SubPath(obj.startTag, obj.endTag)
            })

            createCheckpoints(this.raceScene, this, json.lapCheckpointTransforms);
            this.createBottomPitSensor(-50)

            const { 
                spacing,
                rotation,
                row1Start,
                row2Start,
                columnStart,
                yStart
            } = json.racerStartTransforms

            for (let i = 0; i < 4; i++) {
                this.racerStartTransforms.push(new Transform(
                    new THREE.Vector3(row1Start + spacing * i, yStart, columnStart - spacing * i),
                    new THREE.Euler(0, PhaserMath.DegToRad(rotation), 0, 'XYZ')
                ))
            }

            for (let i = 0; i < 4; i++) {
                this.racerStartTransforms.push(new Transform(
                    new THREE.Vector3(row2Start + spacing * i, yStart, columnStart - spacing * i),
                    new THREE.Euler(0, PhaserMath.DegToRad(rotation), 0, 'XYZ')
                ))
            }

            json.mysteryBoxPositions.forEach(data => {
                const group = this.createMysteryBoxGroup(data)
                this.mysteryBoxGroups.push(group)
            })

        } catch (error) {
            console.error('Error fetching JSON:', error)
        }
    }

    createMysteryBoxGroup(data) {
        let mysteryBoxGroup = []
        let bounds = 0
        let i = 0
        //let bounds = Math.round(data.amount / 2)
        if (data.amount % 2 == 0)
        {
            i = -(Math.floor(data.amount / 2.0))
            bounds = Math.floor(data.amount / 2.0)
        }
        else
        {
            i = -(Math.floor(data.amount / 2.0))
            bounds = Math.floor(data.amount / 2.0) + 1
        }

        
        while(i < bounds) {
            const centerX = data.centerPosition[0]
            const centerZ = data.centerPosition[2]
            const angle = PhaserMath.DegToRad(data.rotationOffset)

            const position = new THREE.Vector3(
                centerX + i * data.padding,
                data.centerPosition[1],
                centerZ + i * data.padding,
            )

            position.x =
                (position.x - centerX) * Math.cos(angle) -
                (position.z - centerZ) * Math.sin(angle) +
                centerX

            position.z =
                (position.x - centerX) * Math.sin(angle) -
                (position.z - centerZ) * Math.cos(angle) +
                centerZ

            mysteryBoxGroup.push(new SheepMysteryBox(this.raceScene, position))
            i++;
        }

        return mysteryBoxGroup
    }

    hasCompletedTrack(lapCount) {
        return lapCount >= this.lapGoal
    }

    createBottomPitSensor(yLevel = -50) {
        const pit = this.raceScene.third.make.box({
            x: 0,
            y: yLevel,
            z: 0,
            width: 2000,
            depth: 2000,
            height: 5
        })

        pit.visible = false

        this.raceScene.third.physics.add.existing(pit, {
            collisionFlags: 6
        })

        pit.body.on.collision((otherObject) => {
            if (!(otherObject instanceof Racer)) return;
            if (otherObject.isRespawning) return;

            console.log("Reached the pit respawn code")
            this.handlePitRespawn(otherObject);
        });

        this.pitSensor = pit
    }
    
    handlePitRespawn(racer) {
        if (!racer.lastCheckpointTransforms || racer.isRespawning) return;

        racer.isRespawning = true;
        racer.offTrackTime = 0;
        racer.isOffTrack = false;

        // Decide spawn point correctly
        const t = racer.checkpointsCrossed.length === 0
            ? racer.spawnTransform
            : racer.lastCheckpointTransforms;

        // STOP all motion
        racer.currSpeed = 0;
        racer.body.setVelocity(0, 0, 0);
        racer.body.setAngularVelocity(0, 0, 0);
        racer.body.setAngularFactor(0, 0, 0);

        // TEMP disable physics collision response
        racer.body.setCollisionFlags(2);

        // TELEPORT
        racer.body.setPosition(
            t.position.x,
            t.position.y + 5,
            t.position.z
        );

        racer.body.setRotation(
            t.rotation.x,
            t.rotation.y,
            t.rotation.z
        );

        racer.body.needUpdate = true;

        // SYNC visual mesh
        racer.position.copy(racer.body.position);
        racer.rotation.set(
            t.rotation.x,
            t.rotation.y,
            t.rotation.z
        );

        // RESTORE physics
        setTimeout(() => {
            racer.body.setCollisionFlags(0);
            racer.body.setAngularFactor(1, 1, 1);
            racer.isRespawning = false;
        }, 250);

        console.log(`${racer.key} respawned`);
    }
}