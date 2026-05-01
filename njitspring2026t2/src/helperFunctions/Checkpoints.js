import { THREE } from "@enable3d/phaser-extension";
import { Math as PhaserMath } from 'phaser';
import AIPlayer from "../gameObjects/AIPlayer";
import Racer from "../gameObjects/Racer";
import { Transform } from "./Transform";

export function createCheckpoints(raceScene, raceTrack, transforms)
{
    for (let i = 0; i < transforms.length; i++)
    {
        const transform = transforms[i]

        const newPosition = new THREE.Vector3(
            transform.position[0], 
            transform.position[1], 
            transform.position[2]
        )

        const newRotation =  new THREE.Euler(
            PhaserMath.DegToRad(transform.rotation[0]), 
            PhaserMath.DegToRad(transform.rotation[1]), 
            PhaserMath.DegToRad(transform.rotation[2]),
            'XYZ'
        )

        const checkpoint = raceScene.third.make.box(
            { 
                x: newPosition.x,
                y: newPosition.y + 5,
                z: newPosition.z,
                depth: transform.colliderLength,
                height: 20,
            }
        )

        const checkpointRotation = new THREE.Euler(
            newRotation.x,
            newRotation.y,
            newRotation.z,
            'XYZ'
        );

        checkpoint.rotation.copy(checkpointRotation);
        checkpoint.savedRotation = checkpointRotation.clone();

        raceScene.third.physics.add.existing(checkpoint, { collisionFlags: 6 })

        raceTrack.lapCheckpointSensors.push(checkpoint)
        checkpoint.tag = transform.tag;
        checkpoint.aiJitter = transform.aiJitter
        
        checkpoint.body.on.collision((otherObject, event) => {
            if (otherObject instanceof Racer && 
                verifyCheckpoints(otherObject, checkpoint.tag)
            ) {
                console.log(otherObject.key + " " + checkpoint.tag)
                
                otherObject.checkpointsCrossed.push(checkpoint.tag)

                // otherObject.lastCheckpointTransforms = {
                //     position: checkpoint.position.clone(),
                //     rotation: checkpoint.savedRotation.clone()
                // }

                const forward = new THREE.Vector3(0, 0, 1)
                    .applyEuler(checkpoint.rotation)
                    .normalize();

                // convert forward vector → yaw angle
                const yaw = Math.atan2(forward.x, forward.z) - Math.PI / 2;

                otherObject.lastCheckpointTransforms = {
                    position: checkpoint.position.clone(),
                    rotation: checkpoint.savedRotation.clone(),
                    tag: checkpoint.tag
                }

                hasCompletedLap(otherObject, checkpoint.tag, raceTrack.lapCheckpointGoal)

                if (otherObject instanceof AIPlayer) 
                    otherObject.chooseNextWaypoint()
            }
        })
    }
}

export function verifyCheckpoints(racer, checkpointCrossed)
{
    if (checkpointCrossed.includes('C_01') && racer.checkpointsCrossed.length === 0)
        return true;

    let isReachedCheckpointValid = false;
    if (parseInt(checkpointCrossed.substring(2, 4)) === racer.checkpointsCrossed.length + 1)
    {
        if (checkpointCrossed.endsWith('X')) 
            isReachedCheckpointValid = true
        else
        {
            let subpathID = checkpointCrossed[checkpointCrossed.length - 1];
            let lastTag = racer.lastCheckpointTransforms.tag
            let lastCheckpointID = lastTag[lastTag.length - 1]

            if (lastCheckpointID === 'X')
                isReachedCheckpointValid = true
            else
                isReachedCheckpointValid = subpathID === lastCheckpointID
        }
    }

    return isReachedCheckpointValid;
}

export function hasCompletedLap(racer, checkpointCrossed, lapCheckpointGoal)
{
    if (parseInt(checkpointCrossed.substring(2, 4)) === lapCheckpointGoal)
    {
        racer.lapsCompleted++;
        racer.checkpointsCrossed = [];
    }
}