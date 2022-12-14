import {
  _decorator,
  Component,
  Node,
  view,
  geometry,
  Camera,
  Prefab,
  PhysicsSystem,
  instantiate,
  director,
  UITransform,
  BoxCollider,
  Vec3,
  Sprite,
  ImageAsset,
  assetManager,
  SpriteFrame,
  Texture2D,
  Label,
  Widget,
  Color
} from 'cc'
import { Player } from './Player'
import { HttpRequest } from './utils/HttpRequest'
import { EventCenter } from './utils/EventCenter'
const { ccclass, property } = _decorator

@ccclass('UIManager')
export class UIManager extends Component {
  @property({ type: Node })
  private rightMenu: Node | null = null
  @property({ type: Node })
  private leftMenu: Node | null = null
  @property({ type: Node })
  private playerBox: Node | null = null
  @property(Label)
  private centerName: Label | null = null
  @property({ type: Prefab })
  public itemPrefab: Prefab | null = null // 2-3
  @property({ type: Prefab })
  public playerPrefab: Prefab | null = null // 2-3
  @property({ type: Prefab })
  public bingnvPrefab: Prefab | null = null // 2-3
  @property(Camera)
  public cameraCom!: Camera
  @property(Camera)
  public canvasCom!: Camera
  @property(Node)
  public targetNode!: Node

  private players
  public player!: Node
  public currentPlayer!: Node
  private _ray: geometry.Ray = new geometry.Ray()

  start() {
    this.customWindows()
    this.getPlayers()

    for (let cube of this.targetNode.children) {
      // 地形 2-2
      cube.getComponent(BoxCollider).setGroup(2)
      cube.getComponent(BoxCollider).setMask(2)
    }
  }

  getPlayers() {
    HttpRequest.POST('/players/getPlayers').then((res) => {
      this.players = res
      this.centerName.string = res[0].label
      for (let i = 0; i < this.players.length; i++) {
        this.setPlayer(this.players[i], i)
      }
      this.goldChange(EventCenter.GOLD)
      EventCenter.on(EventCenter.GOLD_CHANGE, this.goldChange, this)
    })
  }

  setPlayer(player, index: number) {
    let that = this
    let item = instantiate(this.itemPrefab)
    this.playerBox.addChild(item)
    item.getChildByName('PlayerDraw').getComponent(Sprite).spriteFrame
    item.getChildByName('GoldNumber').getComponent(Label).string =
      '$' + player.price
    item.getComponent(Widget).top = 130 * parseInt(index / 2 + '')
    item.getComponent(Widget).left = (index % 2) * 100
    assetManager.loadRemote<ImageAsset>(
      player.image,
      function (err, imageAsset) {
        const spriteFrame = new SpriteFrame()
        const texture = new Texture2D()
        texture.image = imageAsset
        spriteFrame.texture = texture
        item.getChildByName('PlayerDraw').getComponent(Sprite).spriteFrame =
          spriteFrame
      }
    )

    let playerPlane = item.getChildByName('PlayerPlane')
    playerPlane.on(Node.EventType.TOUCH_START, touchStart, this)
    playerPlane.on(Node.EventType.TOUCH_END, touchEnd, this)

    let playerNode = null

    function touchStart(event) {
      that.centerName.string = player.label
      if (EventCenter.GOLD < player.price) return
      playerPlane.on(Node.EventType.TOUCH_MOVE, touchMove, that)
      playerPlane.setScale(50, 50)
      const touch = event.touch!
      that.cameraCom.screenPointToRay(
        touch.getLocationX(),
        touch.getLocationY(),
        that._ray
      )
    }

    function touchMove(event) {
      if (EventCenter.GOLD < player.price) return
      const touch = event.touch!
      that.cameraCom.screenPointToRay(
        touch.getLocationX(),
        touch.getLocationY(),
        that._ray
      )
      if (PhysicsSystem.instance.raycast(that._ray)) {
        const raycastResults = PhysicsSystem.instance.raycastResults
        for (let i = 0; i < raycastResults.length; i++) {
          if (raycastResults[i].collider.node == that.targetNode) {
            let vec3 = raycastResults[i].hitPoint
            if (playerNode) {
              playerNode.setPosition(new Vec3(vec3.x, 0, vec3.z))
            } else {
              playerNode = instantiate(that[player.name + 'Prefab'])
              playerNode.setParent(director.getScene())
              playerNode.getComponent(Player).setData(player)
              let vec3 = raycastResults[0].hitPoint
              playerNode.setPosition(new Vec3(vec3.x, 0, vec3.z))
            }
            return
          }
        }
        if (playerNode) {
          playerNode.destroy()
          playerNode = null
        }
      }
    }

    function touchEnd(event) {
      if (EventCenter.GOLD < player.price) return
      playerPlane.off(Node.EventType.TOUCH_MOVE, touchMove, that)
      playerPlane.setScale(1, 1)
      const touch = event.touch!
      if (!playerNode) return
      that.cameraCom.screenPointToRay(
        touch.getLocationX(),
        touch.getLocationY(),
        that._ray
      )
      if (PhysicsSystem.instance.raycast(that._ray)) {
        const raycastResults = PhysicsSystem.instance.raycastResults
        let canSpace = false
        for (let i = 0; i < raycastResults.length; i++) {
          if (raycastResults[i].collider.node == that.targetNode) {
            canSpace = true
          }
        }
        if (!canSpace) {
          playerNode.destroy()
          playerNode = null
          return
        }
      } else {
        if (playerNode) playerNode.destroy()
        playerNode = null
        return
      }
      if (playerNode) {
        playerNode.getComponent(Player).begin()
        playerNode = null
      }
    }
  }

  goldChange(gold: number) {
    for (let i = 0; i < this.players.length; i++) {
      let GoldNumber = this.playerBox.children[i]
        .getChildByName('GoldNumber')
        .getComponent(Label)
      if (this.players[i].price > gold) {
        GoldNumber.color = new Color('#ff3141')
      } else {
        GoldNumber.color = new Color('#ffffff')
      }
    }
  }

  customWindows() {
    let width = view.getVisibleSize().width
    let height = view.getVisibleSize().height
    let unit = height / 10
    let rightPix = this.rightMenu.getComponent(UITransform).width
    let leftPix =
      this.leftMenu.getComponent(UITransform).width +
      this.leftMenu.getPosition().x
    if (width / height <= 16 / 9) {
      leftPix = 0
      this.leftMenu.destroy()
    }
    let mainWidth = width - leftPix - rightPix

    let oldCenterX = width / 2 / unit
    let newCenterX = leftPix / unit + mainWidth / 2 / unit
    let cameraPox = this.cameraCom.node.getPosition()
    cameraPox.x = cameraPox.x + (oldCenterX - newCenterX)
    this.cameraCom.node.setPosition(cameraPox)

    let mapWidth = this.targetNode.getScale().x * height
    if (mapWidth < mainWidth) {
      cameraPox.y = (12.07 / mainWidth) * mapWidth * 0.96
      cameraPox.x = (cameraPox.x / 12.07) * cameraPox.y
      this.cameraCom.node.setPosition(cameraPox)
    }
  }

  // update (deltaTime: number) {
  //     // [4]
  // }
}
