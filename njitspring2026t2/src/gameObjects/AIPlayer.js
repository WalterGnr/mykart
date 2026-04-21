import { THREE } from "@enable3d/phaser-extension";
import Racer from "./Racer";

export default class AIPlayer extends Racer {
    constructor(scene, spawnTransform, waypoints = [], key, character) {
        super(scene, spawnTransform, key, character); 

        this.oldPhysics = { 
            x: 0, y: 0, z: 0,
            rotationAngle: 0
        }

        // Waypoints
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
        this.waypointsCrossed = []

        // --- Randomize acceleration and max speed ---
        this.acceleration = 8 + Math.random() * 4; // 8 to 12
        this.maxSpeed = 50 + Math.random() * 15;  // 50 to 65

        scene.aiRacers.push(this);
        console.log(`${key} spawned at: `, this.position);
    }

    update() {
        super.stickToTrack();
        super.blink();

        if (!this.waypoints || this.waypoints.length === 0) return;

        this.moveToWaypoint();
    }

    moveToWaypoint()
    {
        const target = this.waypoints[this.currentWaypointIndex]
        const dir = new THREE.Vector3().subVectors(target, this.position).normalize();

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
}