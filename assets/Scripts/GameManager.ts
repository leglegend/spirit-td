import { _decorator, Component, Node, Prefab, instantiate, Camera } from 'cc'
import { HttpRequest } from './utils/HttpRequest'
const { ccclass, property } = _decorator

@ccclass('GameManager')
export class GameManager extends Component {
  @property({ type: Prefab })
  public monster: Prefab | null = null
  @property({ type: Prefab })
  public stone: Prefab | null = null
  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null
  @property(Camera)
  readonly cameraCom!: Camera
  @property(Node)
  public targetNode!: Node

  public player!: Node

  private times: number = 0

  private games = [
    {
      name: 'monster',
      count: 10,
      interval: 2,
      delay: 0
    },
    {
      name: 'stone',
      count: 5,
      interval: 4,
      delay: 25
    }
  ]

  public monsters

  start() {
    HttpRequest.POST('getMonsters').then((res) => {
      this.monsters = res
    })
  }
  onGameBegin() {
    for (let game of this.games) {
      let that = this
      this.schedule(
        () => {
          let monster = instantiate(this[game.name])
          that.node.addChild(monster)
        },
        game.interval,
        game.count,
        game.delay
      )
    }
  }
  createTime() {
    this.times += 1
  }
  createMonster(name) {
    let monster = instantiate(this[name])
    this.node.addChild(monster)
  }
  // update (deltaTime: number) {
  //     // [4]
  // }
}
