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

  public gameState: string = GameState.PAUSED

  public monsters

  public map

  public currentWaveIndex: number = 0
  private currentMonsterIndex: number = 0
  private monsterTime: number = 0
  private HP: number = 100
  public gold: number = 100
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
  }

  onGameBegin() {
    this.node.getComponent(AudioSource).play()
    if (this.gameState == GameState.PAUSED) {
      this.gameState = GameState.PLAYING
      this.BeginButton.string = '游戏中...'
    } else if (this.gameState == GameState.PLAYING) {
      this.gameState = GameState.SPEED
      this.BeginButton.string = '加速中...'
    } else if (this.gameState == GameState.SPEED) {
      this.gameState = GameState.PLAYING
      this.BeginButton.string = '游戏中...'
    }
    EventCenter.emit(EventCenter.SPEED_CHANGE, this.gameState)
  }

  createMonster(name) {
    let monster = instantiate(this[name])
    this.node.addChild(monster)
  }

  subHP(hp: number) {
    this.HP -= hp
    this.HPLabel.string = this.HP + ''
  }

  addGold(gold: number) {
    this.gold += gold
    this.GoldLabel.string = this.gold + ''
    EventCenter.emit(EventCenter.GOLD_CHANGE, this.gold)
  }

  subGold(gold) {
    this.gold -= gold
    this.GoldLabel.string = this.gold + ''
    EventCenter.emit(EventCenter.GOLD_CHANGE, this.gold)
  }

  update(dt: number) {
    if (this.gameState == GameState.PAUSED) return
    if (this.isHalfTime) {
      if (!this.node.children || this.node.children.length == 0) {
        this.gameState = GameState.PAUSED
        this.isHalfTime = false
        this.BeginButton.string = '开始战斗'
      }
      return
    }
    if (this.gameState == GameState.SPEED) dt += dt
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
