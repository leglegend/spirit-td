import {
  _decorator,
  Component,
  Node,
  SkeletalAnimation,
  Vec3,
  Quat,
  Collider,
  ITriggerEvent
} from 'cc'
import { GameManager } from './GameManager'
import { EventCenter } from './utils/EventCenter'
import { GameState } from './utils/GameState'
const { ccclass, property } = _decorator

@ccclass('MonsterController')
export class MonsterController extends Component {
  private _startJump: boolean = false
  // 是否需要旋转
  private _startRot: boolean = false
  // 当前跳跃时间
  private _curJumpTime: number = 0
  // 当前跳跃时间
  private _curRoadTime: number = 0
  private _curRotTime: number = 0
  // 当前角色位置
  private _curPos: Vec3 = new Vec3()
  // 每次跳跃过程中，当前帧移动位置差
  private _deltaPos: Vec3 = new Vec3(0, 0, 0)
  // 角色目标位置
  private _targetPos: Vec3 = new Vec3()

  // 角色目标位置
  private _targetBodyRot: Vec3 = new Vec3()

  private _curXLong
  private _curZLong

  // 当前角色位置
  private _curRot: Vec3 = new Vec3(0, 0, 0)
  // 每次跳跃过程中，当前帧移动位置差
  private _deltaRot: Vec3 = new Vec3(0, 0, 0)
  // 角色目标位置
  private _targetRot: Vec3 = new Vec3()

  private curRoad: number = 0
  private roads = [
    [-0.65, 2],
    [-2, 0.85],
    [7.4, -4]
  ]

  private isDie: boolean = false

  public monsterInfo = {
    name: '',
    hp: 0,
    speed: 0,
    price: 0
  }

  private collider: Collider | null = null

  @property({ type: Node })
  public body: Node | null = null
  @property({ type: SkeletalAnimation })
  public CocosAnim: SkeletalAnimation | null = null
  start() {
    for (let monster of this.node.getParent().getComponent(GameManager)
      .monsters) {
      if (monster.name == this.node.name.toLowerCase())
        this.monsterInfo = Object.assign(this.monsterInfo, monster)
    }
    this.node.setPosition(new Vec3(-4.75, 0, 4.35))
    this.gameStateChange(GameState.STATE)
    this.begin()
    this.collider = this.node.children[0].getComponent(Collider)
    this.collider.on('onTriggerStay', this.onTriggerStay, this)
    EventCenter.on(EventCenter.SPEED_CHANGE, this.gameStateChange, this)
  }

  setData() {}

  gameStateChange(state: string) {
    if (state == GameState.PLAYING) {
      this.CocosAnim.getState('run').speed = 1
      this.CocosAnim.getState('die').speed = 1
    } else if (state == GameState.SPEED) {
      this.CocosAnim.getState('run').speed = EventCenter.SPEED_TIMES
      this.CocosAnim.getState('die').speed = EventCenter.SPEED_TIMES
    }
  }

  private onTriggerStay(event: ITriggerEvent) {
    this.monsterInfo.hp -= 1
    if (this.monsterInfo.hp > 0 || this.monsterInfo.hp < 0) return
    this.collider.off('onTriggerStay', this.onTriggerStay, this)
    this.CocosAnim.play('die')
    // this.node
    //   .getParent()
    //   .getComponent(GameManager)
    //   .addGold(this.monsterInfo.price)
    EventCenter.GOLD += this.monsterInfo.price
    EventCenter.emit(EventCenter.GOLD_CHANGE, EventCenter.GOLD)
    setTimeout(() => {
      if (this.node) this.node.destroy()
    }, this.CocosAnim.getState('die').duration * 900)
    // this.node.destroy()
  }
  begin() {
    this._startJump = true
    this._startRot = true
    this._curJumpTime = 0
    if (this.CocosAnim) {
      this.CocosAnim.play('run') // 播放跳跃动画
    }
    this.setRoadData(0)
  }
  setRoadData(curIndex: number) {
    this.node.getPosition(this._curPos)
    this._targetPos = new Vec3(
      this.roads[curIndex][0],
      0,
      this.roads[curIndex][1]
    )
    this._curXLong = this._targetPos.x - this._curPos.x
    this._curZLong = this._targetPos.z - this._curPos.z
    let dx = Math.abs(this._curXLong)
    let dz = Math.abs(this._curZLong)
    let dis = Math.sqrt(Math.pow(dx, 2) + Math.pow(dz, 2))
    this._curRoadTime = dis / this.monsterInfo.speed
    let curRot = Quat.toEuler(this.node.getPosition(), this.node.getRotation())
    this._curRot = new Vec3(curRot.x, curRot.y, curRot.z)
    this._targetRot = this.calcNodeRot(
      this._curRot,
      this._curPos,
      this._targetPos
    )
  }
  calcNodeRot(curRot: Vec3, curPos: Vec3, targetPos: Vec3) {
    let angle: number = Math.atan2(
      curPos.z - targetPos.z,
      targetPos.x - curPos.x
    ) //弧度  0.6435011087932844
    let theta: number = angle * (180 / Math.PI) //角度  36.86989764584402
    this._curRotTime = Math.abs(Math.abs(curRot.y) - Math.abs(theta)) / 180
    this._targetBodyRot = new Vec3(
      45 * Math.sin(angle),
      90,
      -45 * Math.cos(angle)
    )
    return new Vec3(0, theta, 0)
  }
  onOnceJumpEnd() {
    if (this.curRoad < this.roads.length - 1) {
      this.curRoad += 1
      this._curJumpTime = 0
      this._curRotTime = 0
      this.setRoadData(this.curRoad)
      this._startRot = true
      return
    }
    this._startJump = false
    this.curRoad = 0
    this.node.getParent().getComponent(GameManager).subHP(this.monsterInfo.hp)
    this.node.destroy()
  }
  update(deltaTime: number) {
    if (this.monsterInfo.hp == 0) return
    if (GameState.STATE == GameState.SPEED)
      deltaTime = deltaTime * EventCenter.SPEED_TIMES
    if (this._startJump) {
      this._curJumpTime += deltaTime
      if (this._curJumpTime > this._curRoadTime) {
        // end
        this.node.setPosition(this._targetPos)
        this.onOnceJumpEnd()
      } else {
        // tween
        this.node.getPosition(this._curPos)
        this._deltaPos.x = (deltaTime * this._curXLong) / this._curRoadTime
        this._deltaPos.z = (deltaTime * this._curZLong) / this._curRoadTime
        Vec3.add(this._curPos, this._curPos, this._deltaPos)
        this.node.setPosition(this._curPos)
      }
    }
    if (this._startRot) {
      if (this._curJumpTime > this._curRotTime) {
        // end
        this.body.setRotationFromEuler(this._targetBodyRot)
        this.node.setRotationFromEuler(this._targetRot)
        this._startRot = false
      } else {
        // tween
        this._deltaRot.y =
          (this._curRot.y > this._targetRot.y ? -1 : 1) * deltaTime * 180
        Vec3.add(this._curRot, this._curRot, this._deltaRot)
        this.node.setRotationFromEuler(this._curRot)

        let angle = (this._curRot.y * Math.PI) / 180
        angle = Number(angle.toFixed(2))
        this.body.setRotationFromEuler(
          new Vec3(45 * Math.sin(angle), 90, -45 * Math.cos(angle))
        )
      }
    }
  }
}
