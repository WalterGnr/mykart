import { THREE } from '@enable3d/phaser-extension'
import RaceTrack from "./RaceTrack";

export default class CharacterSelectionArea extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)

        this.aiWaypoints = [
            new THREE.Vector3(160, 0, 180),   // spawn

            new THREE.Vector3(0, 0, 180),
            new THREE.Vector3(-80, 0, 180),

            // left side going downward
            new THREE.Vector3(-180, 0, 80),
            new THREE.Vector3(-180, 0, -30),
            new THREE.Vector3(-140, 0, -140),

            // bottom straight
            new THREE.Vector3(0, 0, -200),
            new THREE.Vector3(130, 0, -200),

            // right side going upward
            new THREE.Vector3(200, 0, -80),
            new THREE.Vector3(200, 0, 30),
            new THREE.Vector3(180, 0, 130)
        ];

        this.raceScene.third.load.texture('/assets/tracks/DigitalWorldTrack.png').then(tex => {
            this.raceScene.third.physics.add.ground({ width: 500, height: 500, y: -1 }, { phong: { map: tex } });
        });
    }
}