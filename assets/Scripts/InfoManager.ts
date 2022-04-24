import {
  _decorator,
  Component,
  Node,
  PhysicsSystem,
  Camera,
  geometry,
  SpriteFrame,
  Texture2D,
  assetManager,
  ImageAsset,
  Sprite,
  Label,
  Widget,
  Animation,
  Color
} from 'cc'
import { Player } from './Player'
import { EventCenter } from './utils/EventCenter'
const { ccclass, property } = _decorator
@ccclass('InfoManager')
export class InfoManager extends Component {
  @property({ type: Node })
  private mainPlane: Node | null = null
  @property({ type: Node })
  private infoPlane: Node | null = null
  @property({ type: Node })
  private skillTop: Node | null = null
  @property({ type: Node })
  private skillBottom: Node | null = null
  @property({ type: Node })
  private skillAlready: Node | null = null
  @property(Camera)
  public cameraCom!: Camera

  @property(Sprite)
  private PlayerDraw: Sprite | null = null // 守卫头像
  @property(Label)
  private PlayerName: Label | null = null // 守卫名称
  @property(Label)
  private PlayerInfo: Label | null = null // 守卫描述

  private animation: Animation = null!

  private _ray: geometry.Ray = new geometry.Ray()
  private currentPlayer = null
  private lastPlayer = null

  start() {
    this.animation = this.infoPlane.getComponent(Animation)
    this.infoPlane.getComponent(Widget).isAlignRight = true
    this.infoPlane.getComponent(Widget).isAlignLeft = false
    this.infoPlane.getComponent(Widget).right = -50
    this.infoPlane.on(Node.EventType.TOUCH_START, (e) => {})
    this.onMainPlaneTouch()
  }

  onMainPlaneTouch() {
    let currentNode = null
    this.mainPlane.on(
      Node.EventType.TOUCH_START,
      (event) => {
        if (this.currentPlayer) this.lastPlayer = this.currentPlayer
        currentNode = this.getFirstPlayer(event)
      },
      this
    )
    this.mainPlane.on(
      Node.EventType.TOUCH_END,
      (event) => {
        if (currentNode && currentNode == this.getFirstPlayer(event)) {
          this.currentPlayer = currentNode.getParent()
          if (this.lastPlayer && this.lastPlayer != this.currentPlayer)
            this.lastPlayer.getComponent(Player).showRange(false)
          this.currentPlayer.getComponent(Player).showRange(true)
          this.setPlayerInfo(this.currentPlayer.getComponent(Player).data)
          this.showInfo()
        } else if (this.lastPlayer) {
          this.lastPlayer.getComponent(Player).showRange(false)
          this.hideInfo()
        } else {
          this.hideInfo()
        }
      },
      this
    )
  }

  showInfo() {
    if (this.currentPlayer.getPosition().x > 0) {
      if (this.lastPlayer) {
        this.infoPlane.getComponent(Widget).isAlignRight = false
        this.infoPlane.getComponent(Widget).isAlignLeft = true
        this.infoPlane.getComponent(Widget).left = 60
      } else {
        this.animation.getState('left_to_right').wrapMode = 1
        this.animation.play('left_to_right')
      }
    } else {
      if (this.lastPlayer) {
        this.infoPlane.getComponent(Widget).isAlignRight = true
        this.infoPlane.getComponent(Widget).isAlignLeft = false
        this.infoPlane.getComponent(Widget).right = 260
      } else {
        this.animation.getState('right_to_left').wrapMode = 1
        this.animation.play('right_to_left')
      }
    }
  }

  hideInfo() {
    if (!this.currentPlayer) return
    if (this.currentPlayer.getPosition().x > 0) {
      this.animation.getState('left_to_right').wrapMode = 36
      this.animation.play('left_to_right')
    } else {
      this.animation.getState('right_to_left').wrapMode = 36
      this.animation.play('right_to_left')
    }
    this.currentPlayer = null
    this.lastPlayer = null
  }

  setPlayerInfo(data) {
    console.log(data)
    this.PlayerName.string = data.label
    this.PlayerInfo.string = data.description
    let that = this
    assetManager.loadRemote<ImageAsset>(data.image, function (err, imageAsset) {
      const spriteFrame = new SpriteFrame()
      const texture = new Texture2D()
      texture.image = imageAsset
      spriteFrame.texture = texture
      that.PlayerDraw.spriteFrame = spriteFrame
    })
    if (data.skills && data.skills.length) {
      if (!data.level) data.level = 0
      if (data.level * 2 + 1 >= data.skills.length) {
        this.setSkillInfo(this.skillTop, data.skills[data.skills.length - 2])
        this.setSkillInfo(this.skillBottom, data.skills[data.skills.length - 1])
      } else {
        this.setSkillInfo(this.skillTop, data.skills[data.level * 2])
        this.setSkillInfo(this.skillBottom, data.skills[data.level * 2 + 1])
      }
    }
    if (!data.learned_skills) {
      data.learned_skills = []
      data.top_skills = [0, 0, 0, 0]
      data.bottom_skills = [0, 0, 0, 0]
    }
    for (let i = 0; i < data.skills.length; i++) {
      if (!data.skills[i].learn_type) data.skills[i].learn_type = 0
      if (i % 2 == 0) {
        this.setSkillPoint(this.skillTop, data.skills[i], i / 2 + 1)
      } else {
        this.setSkillPoint(this.skillBottom, data.skills[i], (i - 1) / 2 + 1)
      }
    }
    for (let i = 0; i < data.top_skills.length; i++) {
      this.setSkillPoint(this.skillTop, data.top_skills[i], i + 1)
    }
    for (let i = 0; i < data.bottom_skills.length; i++) {
      this.setSkillPoint(this.skillBottom, data.bottom_skills[i], i + 1)
    }
    this.setLearnedSkillInfo(data.learned_skills)
  }

  setSkillInfo(plane, data) {
    plane.getChildByName('SkillText').getComponent(Label).string =
      data.description
    plane
      .getChildByName('UpgradeBtn')
      .getChildByName('Label')
      .getComponent(Label).string = '$' + data.price
    assetManager.loadRemote<ImageAsset>(data.image, function (err, imageAsset) {
      const spriteFrame = new SpriteFrame()
      const texture = new Texture2D()
      texture.image = imageAsset
      spriteFrame.texture = texture
      plane.getChildByName('SkillIcon').getComponent(Sprite).spriteFrame =
        spriteFrame
    })
  }

  setSkillPoint(plane, learn_type, index) {
    let point = plane.getChildByName('Skill-' + index).getComponent(Sprite)
    if (learn_type == 1) {
      point.color = new Color('#2BD153')
    } else if (learn_type == -1) {
      point.color = new Color('#ff3141')
    } else {
      point.color = new Color('#000000')
    }
  }

  setLearnedSkillInfo(skills) {
    for (let skill of this.skillAlready.children) {
      skill.getChildByName('Sprite').getComponent(Sprite).spriteFrame = null
    }
    for (let i = 0; i < skills.length; i++) {
      let skillBox = this.skillAlready.children[i].getChildByName('Sprite')
      assetManager.loadRemote<ImageAsset>(
        skills[i].image,
        function (err, imageAsset) {
          const spriteFrame = new SpriteFrame()
          const texture = new Texture2D()
          texture.image = imageAsset
          spriteFrame.texture = texture
          skillBox.getComponent(Sprite).spriteFrame = spriteFrame
        }
      )
    }
  }

  updateSkill(event, type) {
    let data = this.currentPlayer.getComponent(Player).data
    let skill = data.skills[data.level * 2 + (type == 'top' ? 0 : 1)]
    if (!skill) return
    if (data.level >= 4) return
    if (EventCenter.GOLD < skill.price) return
    skill.learn_type = 1
    data.skills[data.level * 2 + (type == 'top' ? 1 : 0)].learn_type = -1
    data.learned_skills.push(skill)
    data.top_skills[data.level] = type == 'top' ? 1 : -1
    data.bottom_skills[data.level] = type == 'top' ? -1 : 1
    data.level += 1
    EventCenter.GOLD -= skill.price
    EventCenter.emit(EventCenter.GOLD_CHANGE, EventCenter.GOLD)
    this.setPlayerInfo(data)
    this.setLearnedSkillInfo(data.learned_skills)
    this.currentPlayer.getComponent(Player).updateSkill()
  }

  getFirstPlayer(event) {
    const touch = event.touch!
    this.cameraCom.screenPointToRay(
      touch.getLocationX(),
      touch.getLocationY(),
      this._ray
    )
    if (PhysicsSystem.instance.raycast(this._ray)) {
      const raycastResults = PhysicsSystem.instance.raycastResults
      for (let i = 0; i < raycastResults.length; i++) {
        let collider = raycastResults[i].collider
        if (collider.getGroup() == 2 && collider.getMask() == 3) {
          return collider.node
        }
      }
    }
    return null
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
