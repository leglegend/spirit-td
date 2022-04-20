import {
  _decorator,
  Component,
  Node,
  PhysicsSystem,
  Camera,
  geometry,
  SpriteFrame,
  Texture2D,
  assetManager,
  ImageAsset,
  Sprite,
  Label,
  Widget,
  Animation
} from 'cc'
import { Player } from './Player'
const { ccclass, property } = _decorator
@ccclass('InfoManager')
export class InfoManager extends Component {
  @property({ type: Node })
  private mainPlane: Node | null = null
  @property({ type: Node })
  private infoPlane: Node | null = null
  @property(Camera)
  public cameraCom!: Camera

  @property(Sprite)
  private PlayerDraw: Sprite | null = null // 守卫头像
  @property(Label)
  private PlayerName: Label | null = null // 守卫名称
  @property(Label)
  private PlayerInfo: Label | null = null // 守卫描述

  private animation: Animation = null!

  private _ray: geometry.Ray = new geometry.Ray()
  private currentPlayer = null
  private lastPlayer = null

  start() {
    this.animation = this.infoPlane.getComponent(Animation)
    this.infoPlane.getComponent(Widget).isAlignRight = true
    this.infoPlane.getComponent(Widget).isAlignLeft = false
    this.infoPlane.getComponent(Widget).right = -50
    this.onMainPlaneTouch()
  }

  onMainPlaneTouch() {
    let currentNode = null
    this.mainPlane.on(
      Node.EventType.TOUCH_START,
      (event) => {
        if (this.currentPlayer) this.lastPlayer = this.currentPlayer
        currentNode = this.getFirstPlayer(event)
      },
      this
    )
    this.mainPlane.on(
      Node.EventType.TOUCH_END,
      (event) => {
        if (currentNode && currentNode == this.getFirstPlayer(event)) {
          this.currentPlayer = currentNode.getParent()
          if (this.lastPlayer && this.lastPlayer != this.currentPlayer)
            this.lastPlayer.getComponent(Player).showRange(false)
          this.currentPlayer.getComponent(Player).showRange(true)
          this.setPlayerInfo(this.currentPlayer.getComponent(Player).data)
          this.showInfo()
        } else if (this.lastPlayer) {
          this.lastPlayer.getComponent(Player).showRange(false)
          this.hideInfo()
        } else {
          this.hideInfo()
        }
      },
      this
    )
  }

  showInfo() {
    if (this.currentPlayer.getPosition().x > 0) {
      if (this.lastPlayer) {
        this.infoPlane.getComponent(Widget).isAlignRight = false
        this.infoPlane.getComponent(Widget).isAlignLeft = true
        this.infoPlane.getComponent(Widget).left = 60
      } else {
        this.animation.getState('left_to_right').wrapMode = 1
        this.animation.play('left_to_right')
      }
    } else {
      if (this.lastPlayer) {
        this.infoPlane.getComponent(Widget).isAlignRight = true
        this.infoPlane.getComponent(Widget).isAlignLeft = false
        this.infoPlane.getComponent(Widget).right = 260
      } else {
        this.animation.getState('right_to_left').wrapMode = 1
        this.animation.play('right_to_left')
      }
    }
  }

  hideInfo() {
    if (!this.currentPlayer) return
    if (this.currentPlayer.getPosition().x > 0) {
      this.animation.getState('left_to_right').wrapMode = 36
      this.animation.play('left_to_right')
    } else {
      this.animation.getState('right_to_left').wrapMode = 36
      this.animation.play('right_to_left')
    }
    this.currentPlayer = null
    this.lastPlayer = null
  }

  setPlayerInfo(data) {
    this.PlayerName.string = data.label
    this.PlayerInfo.string = data.description
    let that = this
    assetManager.loadRemote<ImageAsset>(data.image, function (err, imageAsset) {
      const spriteFrame = new SpriteFrame()
      const texture = new Texture2D()
      texture.image = imageAsset
      spriteFrame.texture = texture
      that.PlayerDraw.spriteFrame = spriteFrame
    })
    if (data.skills && data.skills.length) {
    }
    if (data.learned_skills && data.learned_skills.length) {
    }
  }

  getFirstPlayer(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        let collider = raycastResults[i].collider
        if (collider.getGroup() == 2 && collider.getMask() == 3) {
          return collider.node
        }
      }
    }
    return null
  }

  // update (deltaTime: number) {
  //     // [4]
  // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.4/manual/zh/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.4/manual/zh/scripting/decorator.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.4/manual/zh/scripting/life-cycle-callbacks.html
 */
