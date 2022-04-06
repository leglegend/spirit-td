import { _decorator, Component, Node, Vec3, Quat } from 'cc'
const { ccclass, property } = _decorator

@ccclass('BulletController')
export class BulletController extends Component {
  private _curPos: Vec3 = new Vec3()
  private _targetPos: Vec3 = new Vec3()
  private _deltaPos: Vec3 = new Vec3(0, 0, 0)

  private XLong: number = 0
  private ZLong: number = 0

  private attackLong: number = 2
  private speed: number = this.attackLong / 0.3
  private time: number = 0

  start() {
    this._curPos = this.node.getPosition()
    let curRot = Quat.toEuler(this.node.getPosition(), this.node.getRotation())
    let radian = (curRot.y * Math.PI) / 180
    let targetX = this._curPos.x + this.attackLong * Math.cos(radian)
    let targetZ = this._curPos.z - this.attackLong * Math.sin(radian)
    this._targetPos = new Vec3(targetX, this._curPos.y, targetZ)
    this.XLong = targetX - this._curPos.x
    this.ZLong = targetZ - this._curPos.z
  }

  update(deltaTime: number) {
    this.time += deltaTime
    if (this.time < this.attackLong / this.speed) {
      console.log(this.time)
      this._deltaPos.x = this.XLong * this.speed * deltaTime
      this._deltaPos.z = this.ZLong * this.speed * deltaTime
      Vec3.add(this._curPos, this._curPos, this._deltaPos)
      this.node.setPosition(this._curPos)
    } else {
      this.node.destroy()
    }
  }
}
