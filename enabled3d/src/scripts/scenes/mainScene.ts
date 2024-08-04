import { ExtendedObject3D, JoyStick, PointerDrag, PointerLock, Scene3D, ThirdPersonControls } from '@enable3d/phaser-extension'
import * as THREE from 'three'

export default class MainScene extends Scene3D {
  isTouchDevice = 'ontouchstart' in window

  canJump: boolean
  isJumping: boolean
  move: boolean
  moveTop: number
  moveRight: number
  man: any
  controls: any
  keys: {
    a: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key
  }

  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    this.accessThirdDimension()
    this.third.warpSpeed('camera', 'sky', 'grid', 'ground', 'light')

    this.canJump = true
    this.isJumping = false
    this.move = false

    this.moveTop = 0
    this.moveRight = 0
  }

  create() {
    const svg = this.cache.html.get('bridge')
    const bridgeShape = this.third.transform.fromSVGtoShape(svg)
    const scale = 35
    const bridge = this.third.add.extrude({
      shape: bridgeShape[0],
      //depth: 120
    })
    bridge.scale.set(1 / scale, 1 / - scale, 1 / scale)
    bridge.shape = 'concave'
    if (bridge.geometry.boundingBox) {
      bridge.position.setY(bridge.geometry.boundingBox.max.y / scale)
    }
    this.third.physics.add.existing(bridge)
    bridge.body.setAngularFactor(0, 0, 0)
    bridge.body.setLinearFactor(0, 0, 0)
    bridge.body.setFriction(0.8)

    /**
     * Create Player
     */
    /**
     * box_man.glb by Jan Bláha
     * https://github.com/swift502/Sketchbook
     * CC-0 license 2018
     */
    this.third.load.gltf('/assets/box_man.glb').then(object => {
      const man = object.scene.children[0]

      this.man = new ExtendedObject3D()
      this.man.name = 'man'
      this.man.rotateY(Math.PI + 0.1) // a hack
      this.man.add(man)
      // add shadow
      this.man.traverse(child => {
        if (child.isMesh) {
          child.shape = 'convex'
          child.castShadow = child.receiveShadow = true
          // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
          child.material.roughness = 1
          child.material.metalness = 0
        }
      })

      /**
       * Animations
       */
      this.third.animationMixers.add(this.man.anims.mixer)
      object.animations.forEach(animation => {
        if (animation.name) {
          /**
           * This is a hack, because I could not adjust the scale with this.man.scale.set()
           * This is not a bug from enable3d, this is how the assets a made :/
           */
          animation.tracks.forEach(track => {
            if (/(scale|position)/.test(track.name)) {
              const newValues = track.values.map(v => v * 1)
              track.values = newValues
            }
          })

          this.man.anims.add(animation.name, animation)
        }
      })
      this.man.anims.play('idle')
      this.man.position.set(0, 2, 8)

      /**
       * Add the player to the scene with a body
       */
      this.third.add.existing(this.man)
      this.third.physics.add.existing(this.man, {
        shape: 'capsule',
        radius: 0.2,
        height: 0.6,
        offset: { y: -0.55 }
      })
      this.man.body.setFriction(0.8)
      this.man.body.setAngularFactor(0, 0, 0)

      /**
       * Add 3rd Person Controls
       */
      this.controls = new ThirdPersonControls(this.third.camera, this.man, {
        offset: new THREE.Vector3(0, 1, 0),
        targetRadius: 3
      })
    })

    /**
     * Add Keys
     */
    this.keys = {
      a: this.input.keyboard.addKey('a'),
      w: this.input.keyboard.addKey('w'),
      d: this.input.keyboard.addKey('d'),
      s: this.input.keyboard.addKey('s'),
      space: this.input.keyboard.addKey(32)
    }

    /**
     * PointerLock and PointerDrag
     */
    if (!this.isTouchDevice) {
      const pointerLock = new PointerLock(this.game.canvas)
      const pointerDrag = new PointerDrag(this.game.canvas)
      pointerDrag.onMove(delta => {
        if (!pointerLock.isLocked()) return
        const { x, y } = delta
        this.moveTop = -y
        this.moveRight = x
      })
    }
    /**
     * Add joystick
     */
    if (this.isTouchDevice) {
      const joystick = new JoyStick()
      const axis = joystick.add.axis({
        styles: { left: 35, bottom: 35, size: 100 }
      })
      axis.onMove(event => {
        /**
         * Update Camera
         */
        const { x: top, y: right } = event
        this.moveTop = top * 3
        this.moveRight = right * 3
      })
      const buttonA = joystick.add.button({
        letter: 'A',
        styles: { right: 35, bottom: 110, size: 80 }
      })
      buttonA.onClick(() => this.jump())
      const buttonB = joystick.add.button({
        letter: 'B',
        styles: { right: 110, bottom: 35, size: 80 }
      })
      buttonB.onClick(() => (this.move = true))
      buttonB.onRelease(() => (this.move = false))
    }
  }

  jump() {
    if (!this.man) return
    this.canJump = false
    this.isJumping = true
    this.man.anims.play('jump_running')
    this.time.addEvent({
      delay: 750,
      callback: () => (this.canJump = true)
    })
    this.time.addEvent({
      delay: 750,
      callback: () => {
        this.man.anims.play('idle')
        this.isJumping = false
      }
    })
    this.man.body.applyForceY(4)
  }

  update(time, delta) {
    if (this.man && this.man.body && this.controls && this.controls.update) {
      /**
       * Update Controls
       */
      this.controls.update(this.moveRight * 3, -this.moveTop * 3)
      if (!this.isTouchDevice) this.moveRight = this.moveTop = 0
      /**
       * Player Turn
       */
      const speed = 4
      const v3 = new THREE.Vector3()

      const rotation = this.third.camera.getWorldDirection(v3)
      const theta = Math.atan2(rotation.x, rotation.z)
      const rotationMan = this.man.getWorldDirection(v3)
      const thetaMan = Math.atan2(rotationMan.x, rotationMan.z)
      this.man.body.setAngularVelocityY(0)

      const l = Math.abs(theta - thetaMan)
      let rotationSpeed = this.isTouchDevice ? 2 : 4
      let d = Math.PI / 24

      if (l > d) {
        if (l > Math.PI - d) rotationSpeed *= -1
        if (theta < thetaMan) rotationSpeed *= -1
        this.man.body.setAngularVelocityY(rotationSpeed)
      }

      /**
       * Player Move
       */
      if (this.keys.w.isDown || this.move) {
        if (this.man.anims.current === 'idle' && !this.isJumping) this.man.anims.play('run')

        const x = Math.sin(theta) * speed,
          y = this.man.body.velocity.y,
          z = Math.cos(theta) * speed

        this.man.body.setVelocity(x, y, z)
      } else {
        if (this.man.anims.current === 'run' && !this.isJumping) this.man.anims.play('idle')
      }

      /**
       * Player Jump
       */
      if (this.keys.space.isDown && this.canJump) {
        this.jump()
      }
    }
  }
}
