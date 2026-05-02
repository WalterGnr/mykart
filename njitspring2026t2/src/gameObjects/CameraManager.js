export default class CameraManager {
    constructor(camera) { //camera settings: If we need camera higher , lower , closer ,etc here is where you modify it.
        this.camera = camera;
        this.orbitRadius = 10;  
        this.heightOffset = 4;   
        this.lerpFactor = 1.0; // this fix the camera bug
    }

    updateCamera(playerPosition, playerRotation, surfacePitch = 0) {
        // Camera position stays fixed relative to player — no elevation change.
        const targetX = playerPosition.x - Math.sin(playerRotation) * this.orbitRadius;
        const targetZ = playerPosition.z - Math.cos(playerRotation) * this.orbitRadius;
        const targetY = playerPosition.y + this.heightOffset;

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;

        // Only rotate the camera angle (lookAt) based on slope.
        // Looking at a point ahead + higher makes the camera tilt upward on hills
        // without physically moving up — pure vertical rotation effect.
        const sinP  = Math.sin(surfacePitch); // > 0 uphill, < 0 downhill
        const lookX = playerPosition.x + Math.sin(playerRotation) * 3;
        const lookZ = playerPosition.z + Math.cos(playerRotation) * 3;
        const lookY = playerPosition.y + 1 + sinP * 5;
        this.camera.lookAt(lookX, lookY, lookZ);
    }
}