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
  EventTarget
} from 'cc'
import { Player } from './Player'
const { ccclass, property } = _decorator
const eventTarget = new EventTarget()
@ccclass('InfoManager')
export class InfoManager extends Component {
  @property({ type: Node })
  private mainPlane: Node | null = null
  @property(Camera)
  public cameraCom!: Camera

  @property(Sprite)
  private PlayerDraw: Sprite | null = null // 守卫头像
  @property(Label)
  private PlayerName: Label | null = null // 守卫名称
  @property(Label)
  private PlayerInfo: Label | null = null // 守卫描述

  private _ray: geometry.Ray = new geometry.Ray()
  private currentPlayer = null
  private lastPlayer = null

  start() {
    this.onMainPlaneTouch()
  }

  onMainPlaneTouch() {
    let currentNode = null
    this.mainPlane.on(
      Node.EventType.TOUCH_START,
      (event) => {
        if (this.currentPlayer) this.lastPlayer = this.currentPlayer
        this.currentPlayer = null
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
          this.showPlayerInfo(this.currentPlayer.getComponent(Player).data)
        } else if (this.lastPlayer) {
          this.lastPlayer.getComponent(Player).showRange(false)
        }
      },
      this
    )
  }

  showPlayerInfo(data) {
    this.PlayerName.string = data.name
    this.PlayerInfo.string = data.description
    let that = this
    assetManager.loadRemote<ImageAsset>(data.image, function (err, imageAsset) {
      const spriteFrame = new SpriteFrame()
      const texture = new Texture2D()
      texture.image = imageAsset
      spriteFrame.texture = texture
      that.PlayerDraw.spriteFrame = spriteFrame
    })
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
