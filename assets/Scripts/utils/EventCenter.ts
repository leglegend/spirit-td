import { _decorator, Component, Node, EventTarget } from 'cc'
const { ccclass, property } = _decorator
const eventTarget = new EventTarget()

@ccclass('EventCenter')
export class EventCenter {
  public static GOLD_CHANGE = 'gold_change'

  public static on(name: string, callback) {
    eventTarget.on(name, callback, this)
  }
  public static off(name: string, callback) {
    eventTarget.on(name, callback, this)
  }
  public static emit(name: string, obj) {
    eventTarget.emit(name, obj)
  }
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
