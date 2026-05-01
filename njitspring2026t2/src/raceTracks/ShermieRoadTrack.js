import RaceTrack from "./RaceTrack";

export default class ShermieRoadTrack extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)
        this.BGM = new Audio('assets/music/Loop_of_Doom.wav');
        this.BGM.loop = true;
        this.BGM.volume = 0.5;

        this.dataFilePath = './data/ShermieRoadTrack.json'

        this.loadTrackGLB('/assets/tracks/ShermieRoadTrack.glb', '/assets/tracks/ShermieRoadB.glb');
    }
}