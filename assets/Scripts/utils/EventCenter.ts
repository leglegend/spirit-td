import { EventTarget } from 'cc'
const eventTarget = new EventTarget()

export class EventCenter {
  public static GOLD_CHANGE = 'gold_change'
  public static SPEED_CHANGE = 'speed_change'

  public static on(name: string, callback) {
    eventTarget.on(name, callback, this)
  }
  public static off(name: string, callback) {
    eventTarget.on(name, callback, this)
  }
  public static emit(name: string, obj) {
    eventTarget.emit(name, obj)
  }
}
