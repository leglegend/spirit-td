export class HttpRequest {
  private static serverPath =
    'https://5afd7a04-9817-4b73-8f96-96fba1ee24c9.bspapp.com/players'

  public static POST(action: string, data = {}) {
    return new Promise((resolve, reject) => {
      var httpRequest = new XMLHttpRequest()
      httpRequest.open('POST', this.serverPath, true)
      httpRequest.setRequestHeader('Content-type', 'application/json')
      var obj = Object.assign(data, { action: action })

      httpRequest.send(JSON.stringify(obj))
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = JSON.parse(httpRequest.responseText)
          resolve(json.data)
        } else if (httpRequest.readyState == 4 && httpRequest.status != 200) {
          reject()
        }
      }
    })
  }
}
