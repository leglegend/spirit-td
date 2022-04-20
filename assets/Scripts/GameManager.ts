import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Camera,
  Label,
  AudioSource
} from 'cc'
import { HttpRequest } from './utils/HttpRequest'
import { EventCenter } from './utils/EventCenter'
import { GameState } from './utils/GameState'
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

  @property(Label)
  private WaveAll: Label | null = null
  @property(Label)
  private WaveNumber: Label | null = null
  @property(Label)
  private HPLabel: Label | null = null
  @property(Label)
  private GoldLabel: Label | null = null
  @property(Label)
  private BeginButton: Label | null = null

  public player!: Node

  public monsters

  public map

  public currentWaveIndex: number = 0
  private currentMonsterIndex: number = 0
  private monsterTime: number = 0
  private HP: number = 100
  private isHalfTime: boolean = false // 一波兵出完了

  start() {
    HttpRequest.POST('/players/getMonsters').then((res) => {
      this.monsters = res
    })
    let name = 'map_01'
    HttpRequest.POST('/players/getMapByName', { name }).then((res) => {
      this.map = res
      this.WaveAll.string = this.map.waves.length + ''
      this.WaveNumber.string = '1'
    })
    EventCenter.on(
      EventCenter.GOLD_CHANGE,
      (res) => {
        this.GoldLabel.string = EventCenter.GOLD + ''
      },
      this
    )
  }

  onGameBegin() {
    this.node.getComponent(AudioSource).play()
    if (GameState.STATE == GameState.PAUSED) {
      GameState.STATE = GameState.PLAYING
      this.BeginButton.string = '游戏中...'
    } else if (GameState.STATE == GameState.PLAYING) {
      GameState.STATE = GameState.SPEED
      this.BeginButton.string = '加速中...'
    } else if (GameState.STATE == GameState.SPEED) {
      GameState.STATE = GameState.PLAYING
      this.BeginButton.string = '游戏中...'
    }
    EventCenter.emit(EventCenter.SPEED_CHANGE, GameState.STATE)
  }

  createMonster(name) {
    let monster = instantiate(this[name])
    this.node.addChild(monster)
  }

  subHP(hp: number) {
    this.HP -= hp
    this.HPLabel.string = this.HP + ''
  }

  update(dt: number) {
    if (GameState.STATE == GameState.PAUSED) return
    if (this.isHalfTime) {
      if (!this.node.children || this.node.children.length == 0) {
        GameState.STATE = GameState.PAUSED
        this.isHalfTime = false
        this.BeginButton.string = '开始战斗'
      }
      return
    }
    if (GameState.STATE == GameState.SPEED) dt = dt * EventCenter.SPEED_TIMES
    if (this.currentWaveIndex >= this.map.waves.length) return
    // this.waveTime += dt
    this.monsterTime += dt
    let waves = this.map.waves
    let currentWave = waves[this.currentWaveIndex]
    let currentMonster = currentWave.monsters[this.currentMonsterIndex]
    this.WaveNumber.string = this.currentWaveIndex + 1 + ''
    // count: "3"
    // interval: "2"
    // name: "monster"
    if (this.monsterTime >= currentMonster.interval) {
      this.monsterTime = 0
      currentMonster.count -= 1
      this.createMonster(currentMonster.name)
      if (currentMonster.count <= 0) {
        this.currentMonsterIndex += 1
      }
      if (this.currentMonsterIndex >= currentWave.monsters.length) {
        this.currentMonsterIndex = 0
        this.currentWaveIndex += 1
        this.isHalfTime = true
      }
    }
  }
}
