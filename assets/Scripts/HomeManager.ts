import { _decorator, Component, Node } from 'cc'
import { HttpRequest } from './utils/HttpRequest'
import 'miniprogram-api-typings'
const { ccclass, property } = _decorator

/**
 * Predefined variables
 * Name = HomeManager
 * DateTime = Thu Apr 14 2022 12:28:57 GMT+0800 (中国标准时间)
 * Author = ni5328109
 * FileBasename = HomeManager.ts
 * FileBasenameNoExtension = HomeManager
 * URL = db://assets/Scripts/HomeManager.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

@ccclass('HomeManager')
export class HomeManager extends Component {
  // [1]
  // dummy = '';

  // [2]
  // @property
  // serializableDummy = 0;
  public gameService
  start() {
    let that = this
    wx.login({
      success: (param) => {
        HttpRequest.POST('/user/loginByWeixin', param).then((res) => {
          console.log('userInfo')
          console.log(res)
          HttpRequest.SetToken(res)
          // let gameService = wx.getGameServerManager()
          // this.gameService = gameService
          // gameService.login().then((res) => {
          //   console.log('login')
          //   console.log(res)
          //   gameService.createRoom({
          //     maxMemberNum: 2,
          //     complete: (room) => {
          //       console.log('room')
          //       console.log(room)
          //       that.getRoom(room.accessInfo)
          //     }
          //   })
          // })
        })
      }
    })
  }

  getRoom(accessInfo) {
    this.gameService.getRoomInfo().then((res) => {
      console.log(res)
    })
  }

  shareApp() {
    wx.authorize({
      scope: 'scope.userInfo',
      success: function () {
        console.log('scope.userInfo')
        wx.getUserInfo({
          success: function (res) {
            console.log(res)
            HttpRequest.POST('/user/setUserInfo', res.userInfo).then((res) => {
              console.log(res)
            })
          },
          fail: (res) => {
            console.log(res)
          }
        })
      }
    })
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
