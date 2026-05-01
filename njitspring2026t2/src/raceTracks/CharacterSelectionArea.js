import RaceTrack from "./RaceTrack";

export default class CharacterSelectionArea extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)

        this.raceScene.third.load.texture('/assets/tracks/DigitalWorldTrack.png').then(tex => {
            this.raceScene.third.physics.add.ground({ width: 500, height: 500, y: -1 }, { phong: { map: tex } });
        });
    }
}