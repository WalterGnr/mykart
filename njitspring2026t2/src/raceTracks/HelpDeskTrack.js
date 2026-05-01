import RaceTrack from "./RaceTrack";

export default class HelpDeskTrack extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)

        // BGM setup
        this.BGM = new Audio('assets/music/BAAAA.wav');
        this.BGM.loop = true;
        this.BGM.volume = 0.5;

        this.dataFilePath = './data/HelpDeskTrack.json'

        // load maps
        this.loadTrackGLB('/assets/tracks/HelpDeskTrack.glb', '/assets/tracks/HelpDeskB.glb');
    }
}