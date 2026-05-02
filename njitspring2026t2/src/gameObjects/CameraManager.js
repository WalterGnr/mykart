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
        // Slide camera slightly DOWN when climbing so the kart stays framed
        // and doesn't exit the top of the view.
        const targetY = playerPosition.y + this.heightOffset - sinP * 2;

        this.camera.position.x += (targetX - this.camera.position.x) * this.lerpFactor;
        this.camera.position.y += (targetY - this.camera.position.y) * this.lerpFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * this.lerpFactor;

        // Aggressive upward rotation: look ahead + high on uphills so the
        // player sees the road in front. sinP * 9 gives a strong angle tilt.
        const lookX = playerPosition.x + Math.sin(playerRotation) * 3;
        const lookZ = playerPosition.z + Math.cos(playerRotation) * 3;
        const lookY = playerPosition.y + 1 + sinP * 9;
        this.camera.lookAt(lookX, lookY, lookZ);
    }
}