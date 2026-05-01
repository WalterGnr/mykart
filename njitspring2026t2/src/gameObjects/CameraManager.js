export default class CameraManager {
    constructor(camera) { //camera settings: If we need camera higher , lower , closer ,etc here is where you modify it.
        this.camera = camera;
        this.orbitRadius = 10;  
        this.heightOffset = 4;   
        this.lerpFactor = 1.0; // this fix the camera bug
    }

    updateCamera(playerPosition, playerRotation, surfacePitch = 0) {
        const targetX = playerPosition.x - Math.sin(playerRotation) * this.orbitRadius;
        const targetZ = playerPosition.z - Math.cos(playerRotation) * this.orbitRadius;
        const targetY = playerPosition.y + this.heightOffset;

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;

        // Shift the lookAt point up/down based on the kart's slope pitch so the
        // player can see where they're going on hills and descents.
        const slopeLookOffset = Math.sin(surfacePitch) * 4;
        this.camera.lookAt(playerPosition.x, playerPosition.y + 1 + slopeLookOffset, playerPosition.z);
    }
}