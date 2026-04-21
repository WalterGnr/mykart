import RaceTrack from "./RaceTrack";

export default class MotherboardTrack extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)

        // BGM setup
        this.BGM = new Audio('assets/music/Loop_of_Doom.wav');
        this.BGM.loop = true;
        this.BGM.volume = 0.5;

        // TODO: set AI waypoints

        this.loadTrackGLB('/assets/tracks/Motherboard.glb')
    }
}