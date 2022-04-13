import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Camera,
  Label
} from 'cc'
import { HttpRequest } from './utils/HttpRequest'
const { ccclass, property } = _decorator

enum GameState {
  PAUSED, //暂停
  PLAYING, // 出兵中
  HALETIME, // 一波兵出完了
  SPEED // 加速中
}
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

  public player!: Node

  public gameState: number = GameState.PAUSED

  public monsters

  public map

  public currentWaveIndex: number = 0
  private currentMonsterIndex: number = 0
  private monsterTime: number = 0

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
    if (this.gameState == GameState.PAUSED) {
      this.gameState = GameState.PLAYING
    } else if (this.gameState == GameState.PLAYING) {
      this.gameState = GameState.SPEED
    } else if (this.gameState == GameState.SPEED) {
      this.gameState = GameState.PLAYING
    }
  }

  createMonster(name) {
    let monster = instantiate(this[name])
    this.node.addChild(monster)
  }

  update(dt: number) {
    if (this.gameState == GameState.PAUSED) return
    if (this.gameState == GameState.HALETIME) {
      if (!this.node.children || this.node.children.length == 0)
        this.gameState = GameState.PAUSED
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
        this.gameState = GameState.HALETIME
      }
    }
  }
}
