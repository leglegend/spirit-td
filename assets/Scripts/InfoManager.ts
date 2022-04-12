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
  ImageAsset
} from 'cc'
import { Player } from './Player'
const { ccclass, property } = _decorator

@ccclass('InfoManager')
export class InfoManager extends Component {
  @property(Node)
  private icon: Node | null = null
  @property({ type: Node })
  private mainPlane: Node | null = null
  @property(Camera)
  public cameraCom!: Camera
  private _ray: geometry.Ray = new geometry.Ray()
  private currentPlayer = null
  start() {
    this.onMainPlaneTouch()
  }

  onMainPlaneTouch() {
    let currentNode = null
    this.mainPlane.on(
      Node.EventType.TOUCH_START,
      (event) => {
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
          this.showPlayerInfo(this.currentPlayer.getComponent(Player).data)
        }
      },
      this
    )
  }

  showPlayerInfo(data) {
    assetManager.loadRemote<ImageAsset>(data.image, function (err, imageAsset) {
      const spriteFrame = new SpriteFrame()
      const texture = new Texture2D()
      texture.image = imageAsset
      spriteFrame.texture = texture
      // ...
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
