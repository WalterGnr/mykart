export default class CameraManager {
    constructor(camera) { //camera settings: If we need camera higher , lower , closer ,etc here is where you modify it.
        this.camera = camera;
        this.orbitRadius = 10;  
        this.heightOffset = 4;   
        this.lerpFactor = 1.0; // this fix the camera bug
    }

    updateCamera(playerPosition, playerRotation, surfacePitch = 0) {
        const sinP = Math.sin(surfacePitch); // > 0 uphill, < 0 downhill

        const targetX = playerPosition.x - Math.sin(playerRotation) * this.orbitRadius;
        const targetZ = playerPosition.z - Math.cos(playerRotation) * this.orbitRadius;
        // Raise the camera when climbing so the player sees the road ahead
        const targetY = playerPosition.y + this.heightOffset + sinP * 3;

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;

        // Look at a point slightly ahead of the kart, shifted up/down by slope.
        // This makes the camera naturally "see" uphill/downhill.
        const lookX = playerPosition.x + Math.sin(playerRotation) * 2;
        const lookZ = playerPosition.z + Math.cos(playerRotation) * 2;
        const lookY = playerPosition.y + 1.5 + sinP * 6;
        this.camera.lookAt(lookX, lookY, lookZ);
    }
}