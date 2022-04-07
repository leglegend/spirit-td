import {
  _decorator,
  input,
  Input,
  Component,
  Node,
  EventMouse,
  SkeletalAnimation,
  Vec3,
  Quat,
  Prefab,
  instantiate,
  Collider,
  ITriggerEvent
} from 'cc'
const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = GameMem
 * DateTime = Mon Apr 04 2022 21:49:53 GMT+0800 (中国标准时间)
 * Author = ni5328109
 * FileBasename = GameMem.ts
 * FileBasenameNoExtension = GameMem
 * URL = db://assets/GameMem.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

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

  public HP: number = 2

  private curRoad: number = 0
  private roads = [
    [-0.5, 2],
    [-1.3, 0.7],
    [4.5, -3.5]
  ]

  private isDie: boolean = false
  // private roads = [
  //   [0, 2],
  //   [2, 2],
  //   [2, 0],
  //   [0, 0]
  // ]

  @property({ type: Node })
  public body: Node | null = null
  @property({ type: SkeletalAnimation })
  public CocosAnim: SkeletalAnimation | null = null
  start() {
    // input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    this.onMouseUp()
    let collider = this.node.children[0].getComponent(Collider)
    //console.log(collider)
    collider.on('onTriggerStay', this.onTriggerStay, this)
  }

  private onTriggerStay(event: ITriggerEvent) {
    this.HP -= 1
    if (this.HP > 0) return
    console.log(event)
    this.CocosAnim.play('die')
    setTimeout(() => {
      this.node.destroy()
    }, this.CocosAnim.getState('die').duration * 1000)
    // this.node.destroy()
  }
  onMouseUp() {
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
    this._curRoadTime = dis / 1.2
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
    if (this.CocosAnim) {
      this.CocosAnim.play('idle') // 播放跳跃动画
    }
  }
  update(deltaTime: number) {
    if (this.HP == 0) return
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
