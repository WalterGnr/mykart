import { THREE } from "@enable3d/phaser-extension";
import Racer from "./Racer";

export class AIWaypoint
{
    constructor(position, tag, jitter)
    {
        this.position = position
        this.tag = tag
        this.jitter = jitter
    }
}

export default class AIPlayer extends Racer {
    constructor(scene, spawnTransform, aiWaypoints = [], subpaths = {}, key, character) {
        super(scene, spawnTransform, key, character); 

        this.oldPhysics = { 
            x: 0, y: 0, z: 0,
            rotationAngle: 0
        }

        // Waypoint Initialization
        this.waypoints = []
        this.currentWaypointIndex = 0;
        this.waypointsCrossed = []
        this.subpaths = subpaths
        this.currentSubPath = 'X';

        // --- Add random jitter to each waypoint ---
        for (let i = 0 ; i < aiWaypoints.length; i++)
        {
            const waypoint = aiWaypoints[i]

            let jitterOffset =  new THREE.Vector3(0, 0, 0)

            jitterOffset = new THREE.Vector3(
                (Math.random() - 0.5) * waypoint.jitter,
                0, // keep y the same
                (Math.random() - 0.5) * waypoint.jitter
            )

            waypoint.position = waypoint.position.add(jitterOffset);

            this.waypoints.push(waypoint)
        }

        this.currentWaypoint = this.waypoints[0];

        // --- Randomize acceleration and max speed ---
        this.acceleration = 8 + Math.random() * 4; // 8 to 12
        this.maxSpeed = 50 + Math.random() * 15;  // 50 to 65

        scene.aiRacers.push(this);
        // console.log(`${key} spawned at: `, this.position);
    }

    update() {
        if(!this.raceStart)
            super.stickToTrack();

        super.blink();

        if (!this.waypoints || this.waypoints.length === 0) return;

        if(this.raceStart)
            this.moveToWaypoint();
    }

    moveToWaypoint()
    {
        const dir = new THREE.Vector3().subVectors(this.currentWaypoint.position, this.position).normalize();

        const targetAngle = Math.atan2(dir.x, dir.z);

        // Get current facing direction
        const forward = this.getWorldDirection(new THREE.Vector3());
        const currentAngle = Math.atan2(forward.x, forward.z);

        // Compute shortest angle difference
        let angleDiff = targetAngle - currentAngle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

        const turnThreshold = 0.05;

        // Rotate toward the target
        if (Math.abs(angleDiff) > turnThreshold)
        {
            const turnDir = angleDiff > 0 ? 1 : -1;
            this.body.setAngularVelocityY(turnDir * this.turnSpeed);
        }
        else
        {
            // Stop spinning when aligned
            this.body.setAngularVelocityY(0);
        }

        // Move forward in the current facing direction
        this.moveForward(currentAngle);
    }

    chooseNextWaypoint()
    {
        const nextIndex = (this.currentWaypointIndex + 1) % this.waypoints.length
        const nextWaypoint = this.waypoints[nextIndex]
        
        if (nextWaypoint.tag.endsWith('X'))
        {            
            this.currentWaypointIndex = nextIndex;
            this.currentWaypoint = nextWaypoint
            this.currentSubPath = 'X'
        }
        else if (this.currentSubPath !== 'X')
        {
            if (nextWaypoint.tag.endsWith(this.currentSubPath))
            {
                this.currentWaypointIndex = nextIndex;
                this.currentWaypoint = nextWaypoint
            }
            else // end of subpath
            {
                const subpath = this.subpaths[this.currentSubPath]
                this.currentWaypointIndex = subpath.getEndIndex(this.waypoints)
                this.currentWaypoint = this.waypoints[this.currentWaypointIndex]
            }
        }
        else
        {
            const subpathIDs = Object.keys(this.subpaths)
            this.currentSubPath = subpathIDs[Math.floor(Math.random() * subpathIDs.length)]

            const subpath = this.subpaths[this.currentSubPath]
            
            this.currentWaypointIndex = subpath.getStartIndex(this.waypoints)
            this.currentWaypoint = this.waypoints[this.currentWaypointIndex]
        }
    }

    //ai players move faster had to reduce speed a lot more compared to player
    //adjust as needed 
    stickToTrack() 
    {
        super.stickToTrack();

        if (this.offTrack)
            this.currSpeed *= 0.6;
    }
}