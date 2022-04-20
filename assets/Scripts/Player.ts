import {
  _decorator,
  Component,
  Node,
  SkeletalAnimation,
  Vec3,
  Quat,
  Prefab,
  instantiate,
  director,
  macro,
  Collider,
  Material,
  MeshRenderer,
  EventTarget,
  AudioSource,
  AudioClip,
  Animation
} from 'cc'

import { MonsterController } from './MonsterController'
import { EventCenter } from './utils/EventCenter'
import { GameState } from './utils/GameState'
const { ccclass, property } = _decorator

enum PlayerState {
  PLACE = 'revive', // 放置中
  IDLE = 'idle', // 待机
  ATTACKING = 'attack', // 攻击中
  ATTACKED = 'attacked' // 攻击结束动画
}

@ccclass('Player')
export class Player extends Component {
  @property({ type: Node })
  public body: Node | null = null

  @property({ type: SkeletalAnimation })
  public CocosAnim: SkeletalAnimation | null = null

  @property({ type: Prefab })
  public bullet: Prefab | null = null

  @property({ type: Material })
  public errorMaterial: Material | null = null

  @property({ type: Material })
  public successMaterial: Material | null = null

  public audioSource: AudioSource = null!
  public animation: Animation = null!

  @property(AudioClip)
  public bow: AudioClip = null!
  @property(AudioClip)
  public arrow: AudioClip = null!

  private gameManager = null
  private playerState: string = PlayerState.PLACE

  public lastMonster: Node | null = null

  private attackRange: number = 3
  private attackTime: number = 0

  private triggerNumber: number = 0

  private collider: Collider | null = null

  private range: Node | null = null

  public data

  // 当前角色位置
  private _curPos: Vec3 = new Vec3(0, 0, 0)
  start() {
    this.audioSource = this.node.getComponent(AudioSource)
    this.animation = this.node.getComponent(Animation)

    this.collider = this.node.getChildByName('area').getComponent(Collider)
    this.collider.setGroup(2)
    this.collider.setMask(3)
    this.collider.on('onTriggerEnter', this.onTriggerEnter, this)
    this.collider.on('onTriggerExit', this.onTriggerExit, this)
    this.canSpace(this.triggerNumber == 0)
  }
  onTriggerEnter() {
    this.triggerNumber += 1
    this.canSpace(this.triggerNumber == 0)
  }
  onTriggerExit() {
    this.triggerNumber -= 1
    this.canSpace(this.triggerNumber == 0)
  }

  public setData(data) {
    this.data = Object.assign({}, data)
    this.attackRange = data.range
    this.range = this.node.getChildByName('range')
    let scale = this.range.getScale()
    scale.x = (this.attackRange / 5) * scale.x
    scale.z = (this.attackRange / 5) * scale.z
    this.range.setScale(scale)
  }

  public begin() {
    if (this.triggerNumber >= 1) {
      this.node.destroy()
      return
    }
    EventCenter.GOLD -= this.data.price
    EventCenter.emit(EventCenter.GOLD_CHANGE, EventCenter.GOLD)
    this.audioSource.play()
    this.animation.play()
    this.collider.off('onTriggerEnter', this.onTriggerEnter, this)
    this.collider.off('onTriggerExit', this.onTriggerExit, this)
    this.changeState(PlayerState.IDLE)
    this._curPos = this.node.getPosition()
    this.gameManager = director.getScene().getChildByName('GameManager')
    let rangePos = this.node.getChildByName('range').getPosition()
    rangePos.y = -0.1
    this.node.getChildByName('range').setPosition(rangePos)
    // setTimeout(() => {
    //   this.changeState(PlayerState.IDLE)
    // }, this.getAnimationTime(PlayerState.PLACE))
  }

  public showRange(isShow) {
    let rangePos = this.node.getChildByName('range').getPosition()
    rangePos.y = isShow ? 0.1 : -0.1
    this.node.getChildByName('range').setPosition(rangePos)
  }

  canSpace(can) {
    if (can) {
      this.range.getComponent(MeshRenderer).setMaterial(this.successMaterial, 0)
    } else {
      this.range.getComponent(MeshRenderer).setMaterial(this.errorMaterial, 0)
    }
  }

  changeState(state: string) {
    this.CocosAnim.play(state)
    this.playerState = state
  }

  getAnimationTime(state: string) {
    return this.CocosAnim.getState(state).duration * 1000
  }

  update(deltaTime: number) {
    if (
      this.playerState == PlayerState.PLACE ||
      this.playerState == PlayerState.ATTACKED ||
      !this.gameManager.children ||
      !this.gameManager.children.length
    )
      return
    let lastMonster = null
    let lessLong = null

    for (let monster of this.gameManager.children) {
      let dis = calcDis(monster, this._curPos)
      let msCtr = monster.getComponent(MonsterController)
      if (
        dis < this.attackRange &&
        msCtr.monsterInfo.hp > 0 &&
        this.lastMonster == monster
      ) {
        lastMonster = monster
        break
      }
      if (
        dis < this.attackRange &&
        msCtr.monsterInfo.hp > 0 &&
        (lessLong == null || lessLong > dis)
      ) {
        lastMonster = monster
        lessLong = dis
      }
    }

    if (lastMonster) {
      this.attackTime += deltaTime
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
      if (this.playerState == PlayerState.IDLE) {
        this.playerState = PlayerState.ATTACKING
        this.CocosAnim.play(PlayerState.ATTACKING)
        this.beginAttack()
      }
    } else if (this.playerState == PlayerState.ATTACKING) {
      this.playerState = PlayerState.ATTACKED
      this.lastMonster = null
      this.unschedule(this.doAttack)
      let residueTime =
        this.getAnimationTime(PlayerState.ATTACKING) -
        ((this.attackTime * 1000) %
          this.getAnimationTime(PlayerState.ATTACKING))
      setTimeout(() => {
        this.changeState(PlayerState.IDLE)
      }, residueTime)
    }

    function calcDis(monster: Node, _curPos: Vec3) {
      if (!monster.getPosition) return 99999
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
    this.range.setRotationFromEuler(new Vec3(0, -1 * theta, 0))
    return new Vec3(0, theta, 0)
  }

  beginAttack() {
    this.attackTime = 0
    this.audioSource.playOneShot(this.bow, 0.5)
    this.schedule(
      this.doAttack,
      this.getAnimationTime(PlayerState.ATTACKING) / 1000,
      macro.REPEAT_FOREVER,
      (2 * this.getAnimationTime(PlayerState.ATTACKING)) / 3000
    )
  }

  doAttack() {
    let bullet = instantiate(this.bullet)
    bullet.setParent(director.getScene())
    let curPos = this.node.getPosition()
    bullet.setPosition(new Vec3(curPos.x, bullet.getPosition().y, curPos.z))
    bullet.setRotation(this.node.getRotation())
    this.audioSource.playOneShot(this.arrow, 1)
    setTimeout(
      function () {
        this.audioSource.playOneShot(this.bow, 0.5)
      }.bind(this),
      this.getAnimationTime(PlayerState.ATTACKING) / 3
    )
  }
}
