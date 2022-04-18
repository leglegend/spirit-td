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
  input,
  Input,
  UITransform,
  ScrollView,
  BoxCollider,
  Vec3,
  Sprite,
  ImageAsset,
  assetManager,
  SpriteFrame,
  Texture2D,
  Label,
  Widget
} from 'cc'
import { GameManager } from './GameManager'
import { Player } from './Player'
import { HttpRequest } from './utils/HttpRequest'
const { ccclass, property } = _decorator

@ccclass('UIManager')
export class UIManager extends Component {
  @property({ type: Node })
  private gameManager: Node | null = null
  @property({ type: Node })
  private rightMenu: Node | null = null
  @property({ type: Node })
  private leftMenu: Node | null = null
  @property({ type: Node })
  private background: Node | null = null
  @property({ type: Node })
  private rightPlane: Node | null = null
  @property({ type: Node })
  private playerBox: Node | null = null
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

  private uiTransform
  private formWidth: number = 0
  private formHeight: number = 0

  private players

  @property(Node)
  public targetNode!: Node

  public player!: Node

  public currentPlayer!: Node

  private _ray: geometry.Ray = new geometry.Ray()
  start() {
    this.customWindows()
    this.getPlayers()

    // this.rightPlane.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    // this.rightPlane.on(Node.EventType.TOUCH_END, this.onTouchEnd, this)

    this.uiTransform = this.rightPlane.getComponent(UITransform)
    this.formWidth = this.uiTransform.width
    this.formHeight = this.uiTransform.height

    for (let cube of this.targetNode.children) {
      // 地形 2-2
      cube.getComponent(BoxCollider).setGroup(2)
      cube.getComponent(BoxCollider).setMask(2)
    }
  }

  getPlayers() {
    console.log(this.playerBox.getPosition())
    HttpRequest.POST('/players/getPlayers').then((res) => {
      this.players = res
      for (let i = 0; i < this.players.length; i++) {
        this.setPlayer(this.players[i], i)
      }
    })
  }

  setPlayer(player, index: number) {
    let that = this
    let item = instantiate(this.itemPrefab)
    this.playerBox.addChild(item)
    item.getChildByName('PlayerDraw').getComponent(Sprite).spriteFrame
    item.getChildByName('HPNumber').getComponent(Label).string =
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
      if (that.gameManager.getComponent(GameManager).gold < player.price) return
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
      if (that.gameManager.getComponent(GameManager).gold < player.price) return
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
      if (that.gameManager.getComponent(GameManager).gold < player.price) return
      console.log(event)
      console.log(playerNode)
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
        playerNode.getComponent(Player).begin(function (res) {
          that.gameManager.getComponent(GameManager).subGold(player.price)
        })
        playerNode = null
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
    console.log(width, height, rightPix, leftPix)
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

  onTouchStart(event) {
    this.rightPlane.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    this.uiTransform.width = this.formWidth * 10
    this.uiTransform.height = this.formHeight * 10
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      if (raycastResults.length) {
        // this.player = instantiate(this.playerPrefab)
        this.player = instantiate(this.bingnvPrefab)
        this.player.setParent(director.getScene())
        this.player.getComponent(Player).setData(this.players[0])
        let vec3 = raycastResults[0].hitPoint
        this.player.setPosition(new Vec3(vec3.x, 0, vec3.z))
      }
    } else {
      console.log('没有碰撞')
    }
  }

  onTouchMove(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        if (raycastResults[i].collider.node == this.targetNode) {
          let vec3 = raycastResults[i].hitPoint
          this.player.setPosition(new Vec3(vec3.x, 0, vec3.z))
        }
      }
    }
  }
  onTouchEnd(event) {
    this.uiTransform.width = this.formWidth
    this.uiTransform.height = this.formHeight
    const touch = event.touch!
    this.rightPlane.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
    if (!this.player) return
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      let canSpace = false
      for (let i = 0; i < raycastResults.length; i++) {
        if (raycastResults[i].collider.node == this.targetNode) {
          canSpace = true
        }
      }
      if (!canSpace) {
        this.player.destroy()
        return
      }
    } else {
      if (this.player) this.player.destroy()
      return
    }
    if (this.player) {
      this.player.getComponent(Player).begin()
      this.player = null
    }
  }
  // update (deltaTime: number) {
  //     // [4]
  // }
}
