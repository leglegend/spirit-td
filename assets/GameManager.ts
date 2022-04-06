import { _decorator, Component, Node, Prefab, instantiate } from 'cc'
const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = GameManager
 * DateTime = Tue Apr 05 2022 15:12:40 GMT+0800 (中国标准时间)
 * Author = ni5328109
 * FileBasename = GameManager.ts
 * FileBasenameNoExtension = GameManager
 * URL = db://assets/GameManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('GameManager')
export class GameManager extends Component {
  @property({ type: Prefab })
  public monster: Prefab | null = null

  start() {
    this.schedule(this.createMonster, 2, 3)
    // this.createMonster()
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
