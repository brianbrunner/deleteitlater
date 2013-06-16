// requires
var https = require('https'),
    redis = require('redis'),
    db = redis.createClient()

var expire_posts = function() {
  db.zrangebyscore("posts:expire",0,Date.now(),'WITHSCORES',function(err, posts) {
    var posts_len = posts.length
    console.log("Deleting "+posts_len/2+" post(s)")
    for (var i = 0; i < posts_len; i += 2) {
      var post = posts[i],
          parts = post.split(":"),
          user_id = parts[0],
          post_id = parts[1]
      db.zrem("posts:expire",post)
      db.srem("posts:"+user_id,post_id+":"+posts[i+1])
      console.log("Deleting post with id: "+post)
      
      db.get("user:"+user_id, function(err,access_token) {

        if (err != null) {
          return
        }

        var message_req = https.request({
          method: "DELETE",
          hostname: "graph.facebook.com",
          port: 443,
          path: "/"+post_id+"?access_token="+access_token
        }, function(message_res) {

          var result = ""

          message_res.on('data', function(d) {
            result += d
          })

          message_res.on('end', function() {
          })

        })
        message_req.end()

      })

    }
  })
}
setInterval(expire_posts,1000)
expire_posts()
