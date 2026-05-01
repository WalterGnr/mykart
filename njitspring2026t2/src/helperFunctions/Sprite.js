import { THREE } from '@enable3d/phaser-extension';

export function createSprite(gameObject, texturePath, pos, scale = new THREE.Vector2(1,1), color = 0xffffff)
{
    const map = new THREE.TextureLoader().load(texturePath);
    const material = new THREE.SpriteMaterial( { map: map, color } );
    const sprite = new THREE.Sprite( material );
    sprite.position.set(pos.x, pos.y, pos.z);
    sprite.scale.set(scale.x,scale.y,1);
    gameObject.add(sprite);
    return sprite;
}