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

  start() {
    var httpRequest = new XMLHttpRequest() //第一步：创建需要的对象
    httpRequest.open(
      'POST',
      'https://5afd7a04-9817-4b73-8f96-96fba1ee24c9.bspapp.com/players',
      true
    ) //第二步：打开连接

    /**
     *发送json格式文件必须设置请求头 ；如下 -
     */
    httpRequest.setRequestHeader('Content-type', 'application/json') //设置请求头 注：post方式必须设置请求头（在建立连接后设置请求头）

    var obj = { action: 'getPlayers' }

    httpRequest.send(JSON.stringify(obj)) //发送请求 将json写入send中
    /**
     * 获取数据后的处理程序
     */
    httpRequest.onreadystatechange = function () {
      //请求后的回调接口，可将请求成功后要执行的程序写在其中
      if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        //验证请求是否发送成功
        var json = httpRequest.responseText //获取到服务端返回的数据
        console.log(json)
      }
    }
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
