import * as Phaser from 'phaser'
import { enable3d, Canvas } from '@enable3d/phaser-extension'
import MenuScene from './scenes/MenuScene'
import PauseScene from './scenes/PauseScene'
import CharacterSelectionScene from './scenes/CharacterSelectionScene'
import OnlineMultiplayerScene from './scenes/OnlineMultiplayerScene'
import LocalMultiplayerScene from './scenes/LocalMultiplayerScene' 
import SingleplayerScene from './scenes/SingleplayerScene'
import WinScene from './scenes/WinScene'

export const gameResolution = {
    width: 1280,
    height: 720
}

const config = {
  type: Phaser.WEBGL,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameResolution.width,
    height: gameResolution.height
  },
  input: {
      gamepad: true
  },
  scene: 
  [
    MenuScene,
    PauseScene,
    CharacterSelectionScene,
    SingleplayerScene,
    LocalMultiplayerScene,
    OnlineMultiplayerScene,
    WinScene
  ],
  ...Canvas()
}

window.addEventListener('load', () => {
  enable3d(() => new Phaser.Game(config)).withPhysics('./node_modules/ammo.js/builds')
})