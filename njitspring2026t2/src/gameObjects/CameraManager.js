export default class CameraManager {
    constructor(camera) { //camera settings: If we need camera higher , lower , closer ,etc here is where you modify it.
        this.camera = camera;
        this.orbitRadius = 10;  
        this.heightOffset = 4;   
        this.lerpFactor = 0.1;
    }

    updateCamera(playerPosition, playerRotation) {
        const targetX = playerPosition.x - Math.sin(playerRotation) * this.orbitRadius;
        const targetZ = playerPosition.z - Math.cos(playerRotation) * this.orbitRadius;
        const targetY = playerPosition.y + this.heightOffset;

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;
        
        this.camera.lookAt(playerPosition.x, playerPosition.y + 1, playerPosition.z);
    }
}