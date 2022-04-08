import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  input,
  Camera,
  geometry,
  PhysicsSystem,
  Input,
  director
} from 'cc'
import { Player } from './Player'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
  @property({ type: Prefab })
  public monster: Prefab | null = null
  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null
  @property(Camera)
  readonly cameraCom!: Camera

  @property(Node)
  public targetNode!: Node

  public player!: Node

  private _ray: geometry.Ray = new geometry.Ray()
  start() {
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this)
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this)
  }
  onGameBegin() {
    this.schedule(this.createMonster, 2, 3)
  }
  onTouchStart(event) {
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    console.log(this._ray)
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        const item = raycastResults[i]
        console.log(item.hitPoint)
        this.player = instantiate(this.playerPrefab)
        this.player.setParent(director.getScene())
        this.player.setPosition(item.hitPoint)
        break
      }
    } else {
      console.log('raycast does not hit the target node !')
    }
  }

  onTouchMove(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    console.log(this._ray)
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        const item = raycastResults[i]
        console.log(item.hitPoint)
        this.player.setPosition(item.hitPoint)
        if (item.collider.node == this.targetNode) {
          console.log('raycast hit the target node !')
          break
        }
      }
    } else {
      console.log('raycast does not hit the target node !')
    }
  }
  onTouchEnd(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      if (raycastResults.length < 2) {
        this.player.destroy()
        return
      }
    } else {
      this.player.destroy()
      return
    }
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this)
    if (this.player) {
      this.player.getComponent(Player).begin()
      this.player = null
    }
  }
  createMonster() {
    let monster = instantiate(this.monster)
    this.node.addChild(monster)
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
