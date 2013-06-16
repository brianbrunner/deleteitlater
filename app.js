// library requires
var fs = require('fs'),
    https = require('https')

// server requires
var express = require('express'),
    app = express()

// storage
var redis = require('redis'),
    db = redis.createClient()

var index_filename = "./static/index.html"

app.use(express.cookieParser('uawepoiu8134079asd78*(7asd8&'));
app.use(express.cookieSession({
  key:'deleteitlater',
  secret:'7aje83nzlkaopi230paosdkvcjaoi238',
  cookie:{
    httpOnly:false
  }
}));

var update_index = true
fs.watchFile(index_filename,function(curr,prev) {
  update_index = true
})

var index_data = ""
app.get('/',function(req,res) {
  
  if (update_index) {
    index_data = fs.readFileSync(index_filename)
    update_index = false
  }

  res.end(index_data)

})

app.get('/auth/facebook',function(req,res) {

  if (!('code' in req.query)) {
    res.setHeader("Location","/?error=fb_dialog_not_accepted")
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
      var params = token_raw.split("&"),
          access_token = params[0].split("=")[1],
          expires = parseInt(params[1].split("=")[1])
      
      https.get("https://graph.facebook.com/me"
              + "?access_token="+access_token, function(me_res) {

        var me = ""

        me_res.on('data', function(d) {
          me += d
        })

        me_res.on('end', function() {
          me = JSON.parse(me)
          db.set("user:"+me.id, access_token, function(err) {
            if (err == null) {
                req.session.id=me.id
                res.setHeader("Location","/")
                res.statusCode = 301
                res.end()
            } else {
              res.setHeader("Location","/?error=interval")
              res.statusCode = 301
              res.end()
            }
          })
        })

        me_res.on('error', function() {
          res.setHeader("Location","/?error=interval")
          res.statusCode = 301
          res.end()
        })

      })

    })

    https_res.on('error', function() {
        res.setHeader("Location","/?error=internal")
        res.statusCode = 301
        res.end()
    })

  })
})

app.get('/post',function(req,res) {

  var error_end = function() {
    res.statusCode = 400
    res.send({error:"Bad request to Facebook"})
  }

  if ('id' in req.session) {

    var expire = 0,
        user_id = req.session.id
        now = Date.now()

    if ("expire" in req.query) {
      expire = (new Date(req.query.expire)).getTime()
      if (expire <= 0) {
        res.statusCode = 400
        res.send({error:"Invalid format for date"})
        return
      }
    } else if ("ttl" in req.query) {
      expire = now + (parseInt(req.query.ttl)*1000)
    } else {
      expire = now + 60*1000 
    }

    if (expire < now) {
      res.statusCode = 400
      res.send({error:"Expire date can't be less than the current date"})
      return
    }

    if (expire > now+7*24*60*60*1000) {
      res.statusCode = 400
      res.send({error:"Expire date can't be more than seven days in the future"})
      return
    }

    db.get("user:"+user_id, function(err, access_token) {

      if (err == null) {

        var query_params = req.url.slice(req.url.indexOf("?")+1),
            path = "/"+user_id+"/feed"
                + "?access_token="+access_token+"&"
                + query_params

        var message_req = https.request({
          method: "POST",
          hostname: "graph.facebook.com",
          port: 443,
          path: path
        }, function(message_res) {

          var result = ""

          message_res.on('data', function(d) {
            result += d
          })

          message_res.on('end', function() {

            var post_id = JSON.parse(result).id
            db.zadd("posts:expire",expire,user_id+":"+post_id)
            db.sadd("posts:"+user_id,post_id+":"+expire)
            res.send(result)

          })

          message_res.on('error', error_end)

        })
        message_req.end()
        
        message_req.on('error',function(err) {
          res.send({error:err})
        })

      } else {

        error_end()

      }

    })

  } else {

    error_end()

  }

})

app.get('/posts',function(req,res) {

  var user_id = req.session.id

  if (user_id != null) {

    db.smembers("posts:"+user_id,function(err,posts) {

      if (err != null) {

        res.statusCode = 400
        res.send({error:"Internal error"})

      } else {

        for (var i = 0, _ref = posts.length; i < _ref; i++) {
          var post = posts[i],
              slice_index = post.indexOf(":")
          posts[i] = {
            id : post.slice(0,slice_index),
            expires : parseInt(post.slice(slice_index+1))
          }
        }
        res.send({data:posts})

      }
    })

  } else {

    res.statusCode = 400
    res.send({error:"The current user is not logged in"})
    
  }

})

exports.delete_post = function(user_id,post_id,callback) {

  var user_id = req.session.id

  if (user_id != null) {

    db.smembers("posts:"+user_id,function(err,posts) {

      if (err != null) {

        res.statusCode = 400
        res.send({error:"Internal error"})

      } else {

        res.send({data:posts})

      }
    })

  } else {

    res.statusCode = 400
    res.send({error:"The current user is not logged in"})
    
  }

}

app.del('/post/:post_id',function(req,res) {

  var user_id = req.session.id,
      post_id = req.params.post_id

  if (user_id != null) {

    db.zrem("posts:expire",post)
    db.srem("posts:"+user_id,post_id)

    // TODO: Delete post from FB too

    res.send({success:true})

  } else {

    res.statusCode = 400
    res.send({error:"The current user is not logged in"})
    
  }

})

app.use('/',express.static(__dirname + '/static'));

app.listen(80)

