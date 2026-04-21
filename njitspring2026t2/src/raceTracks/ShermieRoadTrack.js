import RaceTrack from "./RaceTrack";

export default class ShermieRoadTrack extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)
        this.BGM = new Audio('assets/music/ShermieBoard.wav');
        this.BGM.loop = true;
        this.BGM.volume = 0.5;

        // TODO: set AI waypoints

        this.loadTrackGLB('/assets/tracks/ShermieRoad.glb')
    }
}