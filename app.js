var express = require('express')
var https = require('https')
var app = express()

app.use(express.cookieParser('uawepoiu8134079asd78*(7asd8&'));
app.use(express.cookieSession({key:'deleteitlater',secret:'7aje83nzlkaopi230paosdkvcjaoi238'}));

app.get('/',function(req,res) {
  res.setHeader("Location","/index.html")
  res.statusCode = 301
  res.end()
})

app.get('/auth/facebook',function(req,res) {

  if (!('code' in query)) {
    res.setHeader("Location","/index.html?error=fb_dialog_not_accepted")
    res.statusCode = 301
    res.end()
  }

  https.get("https://graph.facebook.com/oauth/access_token"
         + "?code=" + req.query["code"]
         + "&client_id=137572116433531"
         + "&redirect_uri=http://" + req.headers.host + "/auth/facebook"
         + "&client_secret=5887256deb5d672da9b2e4011eda685d", function(https_res) {

    var token_raw = ""

    https_res.on('data', function(d) {
      token_raw += d
    });

    https_res.on('end', function() {
      var params = token_raw.split("&")
      var access_token = params[0].split("=")[1]
      var expires = parseInt(params[1].split("=")[1])
      console.log()
    })

    https_res.on('error', function() {
        res.setHeader("Location","/index.html?error=internal")
        res.statusCode = 301
        res.end()
    })

  })
})

app.use('/',express.static(__dirname + '/static'));

app.listen(80)
