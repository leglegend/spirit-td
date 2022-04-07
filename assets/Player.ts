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
  director,
  macro
} from 'cc'
import { GameManager } from './GameManager'
import { MonsterController } from './MonsterController'
const { ccclass, property } = _decorator

@ccclass('Player')
export class Player extends Component {
  @property({ type: Node })
  public body: Node | null = null
  @property({ type: SkeletalAnimation })
  public CocosAnim: SkeletalAnimation | null = null

  public gameManager: Node | null = null

  @property({ type: Prefab })
  public bullet: Prefab | null = null

  private attackTime: number | null = null
  private playerState: string = 'idle'
  private isBegin: boolean = false

  public lastMonster: Node | null = null

  // 当前角色位置
  private _curPos: Vec3 = new Vec3(0, 0, 0)
  start() {}

  public begin() {
    this.CocosAnim.play(this.playerState)
    this._curPos = this.node.getPosition()
    this.gameManager = director.getScene().getChildByName('GameManager')
    this.attackTime = this.CocosAnim.getState('attack').duration
    this.isBegin = true
  }

  update(deltaTime: number) {
    if (!this.isBegin) return
    let lastMonster = null
    let lessLong = null
    if (!this.gameManager.children) return
    if (
      this.lastMonster &&
      calcDis(this.lastMonster, this._curPos) < 3 &&
      this.lastMonster.getComponent(MonsterController).HP > 0
    )
      lastMonster = this.lastMonster
    else {
      for (let monster of this.gameManager.children) {
        let dis = calcDis(monster, this._curPos)
        let msCtr = monster.getComponent(MonsterController)

        if (dis < 3 && msCtr.HP > 0 && (lessLong == null || lessLong > dis))
          lastMonster = monster
      }
    }

    if (lastMonster) {
      this.lastMonster = lastMonster
      let curRot = Quat.toEuler(
        this.node.getPosition(),
        this.node.getRotation()
      )
      this.node.setRotationFromEuler(
        this.calcNodeRot(
          new Vec3(curRot.x, curRot.y, curRot.z),
          this._curPos,
          lastMonster.getPosition()
        )
      )
      if (this.playerState == 'idle') {
        this.playerState = 'attack'
        this.CocosAnim.crossFade(this.playerState)
        this.beginAttack()
      }
    } else if (this.playerState == 'attack') {
      this.playerState = 'idle'
      this.lastMonster = null
      this.CocosAnim.play(this.playerState)
      this.unschedule(this.doAttack)
    }

    function calcDis(monster: Node, _curPos: Vec3) {
      let _targetPos = monster.getPosition()
      let dx = Math.abs(_targetPos.x - _curPos.x)
      let dz = Math.abs(_targetPos.z - _curPos.z)
      let dis = Math.sqrt(Math.pow(dx, 2) + Math.pow(dz, 2))
      return dis
    }
  }
  calcNodeRot(curRot: Vec3, curPos: Vec3, targetPos: Vec3) {
    let angle: number = Math.atan2(
      curPos.z - targetPos.z,
      targetPos.x - curPos.x
    ) //弧度  0.6435011087932844

    let theta: number = angle * (180 / Math.PI) //角度  36.86989764584402
    this.body.setRotationFromEuler(
      new Vec3(45 * Math.sin(angle), 90, -45 * Math.cos(angle))
    )
    return new Vec3(0, theta, 0)
  }

  beginAttack() {
    this.schedule(
      this.doAttack,
      this.attackTime,
      macro.REPEAT_FOREVER,
      (2 * this.attackTime) / 3
    )
  }

  doAttack() {
    let bullet = instantiate(this.bullet)
    bullet.setParent(director.getScene())
    let curPos = this.node.getPosition()
    bullet.setPosition(new Vec3(curPos.x, bullet.getPosition().y, curPos.z))
    bullet.setRotation(this.node.getRotation())
  }
}
