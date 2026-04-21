import { THREE } from '@enable3d/phaser-extension'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Racer, { Transform } from '../gameObjects/Racer'
import { Math as PhaserMath } from 'phaser'
import SheepMysteryBox from '../gameObjects/SheepMysteryBox'
import Player from '../gameObjects/Player'

export default class RaceTrack
{
    constructor(scene, trackName)
    {
        this.name = trackName
        this.raceScene = scene
        this.BGM = null
        this.bgmStarted = false

        // track data
        this.dataFilePath = ''
        this.lapCheckpointSensors = []
        this.lapCheckpointTags = []
        this.racerStartTransforms = []
        this.waypoints = []
        this.lapGoal = 0
        this.mysteryBoxGroups = []
    }

    startBGM()
    {
        if (this.BGM && !this.bgmStarted)
        {
            this.BGM.currentTime = 0;
            this.BGM.play();
            this.bgmStarted = true;
        }
        return this.BGM;
    }

    getRandomSpawnTransform()
    {
        const index = Math.floor(Math.random() * this.racerStartTransforms.length);
        const newSpawn = this.racerStartTransforms[index]

        this.racerStartTransforms = this.racerStartTransforms.filter(
            transform => transform !== newSpawn
        )

        return newSpawn
    }

    loadTrackGLB(path)
    {
        const loader = new GLTFLoader();
        loader.load(path, (glb) => {
            const track = glb.scene;
            track.scale.set(5, 5, 5);

            track.traverse((child) => {
                if (child.isMesh)
                    child.material.wireframe = false; 
            });

            this.raceScene.third.scene.add(track);
            
            if (this.raceScene.clientPlayer)
                this.raceScene.clientPlayer.setTrackMesh(track);

            if (this.raceScene.aiRacers)
            {
                for(let i = 0; i < this.raceScene.aiRacers.length; i++)
                {
                    this.raceScene.aiRacers[i].setTrackMesh(track);
                }
            }

            if (this.raceScene.localPlayers)
            {
                for(let i = 1; i < this.raceScene.localPlayers.length; i++)
                {
                    this.raceScene.localPlayers[i].player.setTrackMesh(track);
                    console.log(this.raceScene.localPlayers[i].player.trackMesh)
                }
            }

            this.raceScene.trackMesh = track
        })
    }

    async loadData()
    {
        try 
        {
            const response = await fetch(this.dataFilePath);
            if (!response.ok)
                throw new Error('JSON loaded incorrectly');

            const json = await response.json();
            
            this.lapGoal = json.lapGoal

            // create checkpoint sensors
            this.createCheckpoints(json.lapCheckpointTransforms, json.lapCheckpointLength);

            // set up racer starting line transforms
            const {spacing, rotation, row1Start, row2Start, columnStart, yStart} = json.racerStartTransforms

            for (let i = 1; i <= 4; i++)
            {
                this.racerStartTransforms.push(new Transform(
                    new THREE.Vector3(row1Start + spacing*i, yStart, columnStart - spacing*i),
                    new THREE.Euler(0, PhaserMath.DegToRad(rotation), 0)
                ));
            }
            for (let i = 1; i <= 4; i++)
            {
                this.racerStartTransforms.push(new Transform(
                    new THREE.Vector3(row2Start + spacing*i, yStart, columnStart - spacing*i),
                    new THREE.Euler(0, PhaserMath.DegToRad(rotation), 0)
                ));
            }

            // TODO: mystery box positions + respawning logic
            json.mysteryBoxPositions.forEach(data => {
                const group = this.createMysteryBoxGroup(data)
                this.mysteryBoxGroups.push(group);
            });
        } 
        catch (error) { console.error('Error fetching JSON:', error); }
    }

    createMysteryBoxGroup(data)
    {
        let mysteryBoxGroup = []
        const bounds = Math.trunc(data.amount / 2)

        for (let i = -bounds; i <= bounds; i++)
        {
            const centerX = data.centerPosition[0]
            const centerZ = data.centerPosition[2]
            const angle = PhaserMath.DegToRad(data.rotationOffset)

            const position = new THREE.Vector3(
                centerX + i*data.padding,
                data.centerPosition[1],
                centerZ + i*data.padding,
            );

            position.x = (position.x - centerX)*Math.cos(angle) - (position.z - centerZ)*Math.sin(angle) + centerX

            position.z = (position.x - centerX)*Math.sin(angle) - (position.z - centerZ)*Math.cos(angle) + centerZ

            mysteryBoxGroup.push(new SheepMysteryBox(this.raceScene, position));
        }
        return mysteryBoxGroup
    }

    createCheckpoints(transforms, checkpointLength)
    {
        let positions = [...transforms.map(t => {
            return new THREE.Vector3(t.position[0], t.position[1], t.position[2])
        })]   

        const curveLength = positions.length * 2

        const curve = new THREE.CatmullRomCurve3(positions);
        const smoothedTransforms = curve.getPoints(curveLength);

        let curveTransforms = []
        for (let i = 0; i < smoothedTransforms.length; i++)
        {
            const normalizeIndex = Math.floor(i * transforms.length / smoothedTransforms.length)
            let transform = transforms[normalizeIndex]

            const newRotation =  new THREE.Euler(
                PhaserMath.DegToRad(transform.rotation[0]), 
                PhaserMath.DegToRad(transform.rotation[1]), 
                PhaserMath.DegToRad(transform.rotation[2])
            )

            const newTransform = new Transform(smoothedTransforms[i], newRotation)

            curveTransforms.push(newTransform)
        }

        curveTransforms.forEach(transform => {
            const checkpoint = this.raceScene.third.make.box(
                { 
                    x: transform.position.x,
                    y: transform.position.y + 13,
                    z: transform.position.z,
                    depth: checkpointLength,
                    height: 80,
                }
            )

            checkpoint.rotation.copy(
                new THREE.Euler(
                    transform.rotation.x, 
                    transform.rotation.y, 
                    transform.rotation.z
                )
            );

            this.raceScene.third.physics.add.existing(checkpoint, { collisionFlags: 6 })

            this.lapCheckpointSensors.push(checkpoint)
            checkpoint.tag = `Checkpoint #${this.lapCheckpointSensors.length}`
            this.lapCheckpointTags.push(checkpoint.tag)
            
            
            checkpoint.body.on.collision((otherObject, event) => {
                if (otherObject instanceof Racer && 
                    this.verifyCheckpoints(otherObject, checkpoint.tag)
                ) {
                    // console.log(otherObject.key + " " + checkpoint.tag)
                    
                    otherObject.checkpointsCrossed.push(checkpoint.tag)

                    this.hasCompletedLap(otherObject, checkpoint.tag)
                }
            })
        });
    }

    verifyCheckpoints(racer, checkpointCrossed)
    {
        if (checkpointCrossed === 'Checkpoint #1' && racer.checkpointsCrossed.length === 0)
            return true;

        const slicedCheck = this.lapCheckpointTags.slice(0, this.lapCheckpointTags.indexOf(checkpointCrossed))
        const isReachedCheckpointValid = slicedCheck.every((element, index) => element === racer.checkpointsCrossed[index]) && 
                                         !racer.checkpointsCrossed.includes(checkpointCrossed)

        return isReachedCheckpointValid;
    }

    hasCompletedLap(racer, checkpointCrossed)
    {
        if (checkpointCrossed === this.lapCheckpointTags[this.lapCheckpointTags.length - 1])
        {
            racer.lapsCompleted++;
            racer.checkpointsCrossed = [];
        }
    }

    hasCompletedTrack(lapCount)
    {
        return lapCount >= this.lapGoal
    }
}
