import RaceTrack from "./RaceTrack";

export default class TerminalTrack extends RaceTrack 
{
    constructor(scene, trackName)
    {
        super(scene, trackName)

        // BGM setup
        this.BGM = new Audio('assets/music/ShermieBoard.wav');
        this.BGM.loop = true;
        this.BGM.volume = 0.5;

        this.dataFilePath = './data/TerminalTrack.json'

        // load maps
        this.loadTrackGLB('/assets/tracks/TerminalTrack.glb', '/assets/tracks/TerminalB.glb');
    }
}