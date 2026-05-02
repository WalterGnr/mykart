export default class CameraManager {
    constructor(camera) { //camera settings: If we need camera higher , lower , closer ,etc here is where you modify it.
        this.camera = camera;
        this.orbitRadius = 10;
        this.heightOffset = 4;
        this.lerpFactor = 1.0; // this fix the camera bug

        // Camera-side pitch suspension:
        this.smoothedPitch = 0;
        this.pitchLerpSpeed = 0.04; // lower = smoother
    }

    updateCamera(playerPosition, playerRotation, surfacePitch = 0) {
        this.smoothedPitch += (surfacePitch - this.smoothedPitch) * this.pitchLerpSpeed;
        const sinP = Math.sin(this.smoothedPitch); // > 0 uphill, < 0 downhill

        const targetX = playerPosition.x - Math.sin(playerRotation) * this.orbitRadius;
        const targetZ = playerPosition.z - Math.cos(playerRotation) * this.orbitRadius;
        const targetY = playerPosition.y + this.heightOffset - sinP * 2.7; // physical displacement of the camera

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;

        const lookX = playerPosition.x + Math.sin(playerRotation) * 3;
        const lookZ = playerPosition.z + Math.cos(playerRotation) * 3;
        const lookY = playerPosition.y + 1 + sinP * 9;  //value to modify camera rotation while uphill/downhill
        this.camera.lookAt(lookX, lookY, lookZ);
    }
}