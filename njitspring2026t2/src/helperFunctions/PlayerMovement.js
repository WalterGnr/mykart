
const driftKeyCooldown = { 1: 0, 2: 0 };
const DRIFT_COOLDOWN_FRAMES = 60; // drifting delay to avoid spamming

export function playerKeyInputChecks(player, direction, keys, playerCount = 1) 
{

    let driftHeld, leftHeld, rightHeld, accelHeld, brakeHeld;
        
    if(playerCount == 2){
        driftHeld = keys.drift2.isDown;
        leftHeld  = keys.left2.isDown;
        rightHeld = keys.right2.isDown;
        accelHeld = keys.accelerate2.isDown;
        brakeHeld = keys.brake2.isDown;
    }
    else
    {
        driftHeld = keys.drift.isDown;
        leftHeld  = keys.left.isDown;
        rightHeld = keys.right.isDown;
        accelHeld = keys.accelerate.isDown;
        brakeHeld = keys.brake.isDown;
    }

    // --- Drift cooldown tick ---
    if (driftKeyCooldown[playerCount] > 0) driftKeyCooldown[playerCount]--;

    // cooldown starts
    if (!driftHeld && player.drifting) {
        driftKeyCooldown[playerCount] = DRIFT_COOLDOWN_FRAMES;
    }

    // drifting blocked if cooldown active
    const canDrift = driftKeyCooldown[playerCount] === 0;

    const steerSide = leftHeld ? 'left' : rightHeld ? 'right' : null;

    // --- Drift input ---
    if (canDrift && driftHeld && accelHeld && steerSide && !player.drifting)
    {
        player.startDrift(direction, steerSide);
    }

    if (player.drifting)
    {
        if (driftHeld)
        {
            player.updateDrift(direction, steerSide);
        }
        else
        {
            player.endDrift();
        }
    }
    else
    {
        // Normal steering
        if (leftHeld)       player.turnLeft();
        else if (rightHeld) player.turnRight();
        else                player.autoCenter();
    }

    // --- Acceleration ---
    if (!player.drifting)
    {
        if (accelHeld)      player.moveForward(direction);
        else if (brakeHeld) player.moveBackward(direction);
        else                player.stop(direction);
    }
    else
    {
        if (accelHeld) player.moveForward(direction);
    }

    player.applyDriftBoost(direction);

    if (keys.printPosition.isDown) console.log(player.position);
}

export function playerControllerInputChecks(player, direction, gamepad)
{
    if (!gamepad)
    {
        player.stickToTrack()
        return;
    }
    
    const driftHeld = gamepad.R1;
    const leftHeld  = gamepad.left;
    const rightHeld = gamepad.right;
    const accelHeld = gamepad.A;
    const brakeHeld = gamepad.B;

    // --- Drift cooldown tick ---
    if (driftKeyCooldown[1] > 0) driftKeyCooldown[1]--;

    if (!driftHeld && player.drifting) {
        driftKeyCooldown[1] = DRIFT_COOLDOWN_FRAMES;
    }

    const canDrift = driftKeyCooldown[1] === 0;
    
    const steerSide = leftHeld ? 'left' : rightHeld ? 'right' : null;

    // --- Drift input ---
    if (canDrift && driftHeld && accelHeld && steerSide && !player.drifting)
    {
        player.startDrift(direction, steerSide);
    }

    if (player.drifting)
    {
        if (driftHeld)
        {
            player.updateDrift(direction, steerSide);
        }
        else
        {
            player.endDrift();
        }
    }
    else
    {
        if (leftHeld)       player.turnLeft();
        else if (rightHeld) player.turnRight();
        else                player.autoCenter();
    }

    // --- Acceleration ---
    if (!player.drifting)
    {
        if (accelHeld)      player.moveForward(direction);
        else if (brakeHeld) player.moveBackward(direction);
        else                player.stop(direction);
    }
    else
    {
        if (accelHeld) player.moveForward(direction);
    }

    player.applyDriftBoost(direction);
}
