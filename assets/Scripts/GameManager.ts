import { _decorator, Component, Node, Prefab, instantiate, Camera } from 'cc'

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

  public monsters = [
    { name: 'monster', hp: 3, speed: 1.2 },
    { name: 'stone', hp: 50, speed: 0.8 }
  ]

  start() {}
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
