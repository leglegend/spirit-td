import {
  _decorator,
  Component,
  Node,
  view,
  geometry,
  Camera,
  Prefab,
  PhysicsSystem,
  instantiate,
  director,
  input,
  Input,
  UITransform,
  ScrollView
} from 'cc'
import { Player } from './Player'
const { ccclass, property } = _decorator

@ccclass('UIManager')
export class UIManager extends Component {
  @property({ type: Node })
  private rightMenu: Node | null = null
  @property({ type: Node })
  private background: Node | null = null
  @property({ type: Node })
  private plane: Node | null = null
  @property({ type: Node })
  private scrollView: Node | null = null

  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null
  @property(Camera)
  readonly cameraCom!: Camera

  private uiTransform

  @property(Node)
  public targetNode!: Node

  public player!: Node

  private _ray: geometry.Ray = new geometry.Ray()
  start() {
    // console.log(view.getVisibleSize())
    this.plane.on(Node.EventType.TOUCH_START, this.toConsole, this)
    this.plane.on(Node.EventType.TOUCH_MOVE, this.toConsole, this)
    this.plane.on(Node.EventType.TOUCH_END, this.toConsole, this)
    this.uiTransform = this.plane.getComponent(UITransform)
    // ScrollView.EventType
    this.scrollView.getComponent(ScrollView).cancelInnerEvents = false
  }
  toConsole(event) {
    console.log(event)
    this.uiTransform.width = 600
  }
  onTouchStart(event) {
    this.plane.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.uiTransform.width = 600
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        const item = raycastResults[i]
        this.player = instantiate(this.playerPrefab)
        this.player.setParent(director.getScene())
        this.player.setPosition(item.hitPoint)
        break
      }
    }
  }

  onTouchMove(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        const item = raycastResults[i]
        this.player.setPosition(item.hitPoint)
        if (item.collider.node == this.targetNode) {
          break
        }
      }
    }
  }
  onTouchEnd(event) {
    this.uiTransform.width = 300
    const touch = event.touch!
    this.plane.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      if (raycastResults.length < 2 && this.player) {
        this.player.destroy()
        return
      }
    } else {
      if (this.player) this.player.destroy()
      return
    }
    if (this.player) {
      this.player.getComponent(Player).begin()
      this.player = null
    }
  }
  // update (deltaTime: number) {
  //     // [4]
  // }
}
