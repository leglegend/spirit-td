export class HttpRequest {
  private static serverPath =
    'https://5afd7a04-9817-4b73-8f96-96fba1ee24c9.bspapp.com'
  private static token: string = null

  public static POST(url: string, data = {}) {
    return new Promise((resolve, reject) => {
      var httpRequest = new XMLHttpRequest()
      httpRequest.open('POST', this.serverPath + url, true)
      httpRequest.setRequestHeader('Content-type', 'application/json')
      var obj = Object.assign(data, { uniIdToken: this.token })

      httpRequest.send(JSON.stringify(obj))
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = JSON.parse(httpRequest.responseText)
          if (json.data) resolve(json.data)
          else resolve(json)
        } else if (httpRequest.readyState == 4 && httpRequest.status != 200) {
          reject()
        }
      }
    })
  }

  public static SetToken(res) {
    HttpRequest.token = res.token
  }
}
