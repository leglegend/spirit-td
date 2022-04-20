import { EventTarget } from 'cc'
const eventTarget = new EventTarget()

export class EventCenter {
  public static GOLD = 100
  public static HP = 100
  public static SPEED_TIMES = 2
  public static GOLD_CHANGE = 'gold_change'
  public static SPEED_CHANGE = 'speed_change'

  public static on(name: string, callback, node) {
    eventTarget.on(name, callback, node)
  }
  public static off(name: string, callback, node) {
    eventTarget.on(name, callback, node)
  }
  public static emit(name: string, obj) {
    eventTarget.emit(name, obj)
  }
}
