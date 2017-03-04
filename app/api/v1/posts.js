var Question = require('../../models').Question;
var Node = require('../../models').Node;
var User = require('../../models').User;
// var FollowQuestion = require('../../models').FollowQuestion;
var Like = require('../../models').Like;

var Posts = require('../../models').Posts;
var Topic = require('../../models').Topic;
var Follow = require('../../models').Follow;

var Tools = require('../../common/tools');
var async = require('async');
var xss = require('xss');

exports.add = function(req, res, next) {

  // 用户的信息
  var user        = req.user;
  var title       = req.body.title;
  var content     = req.body.detail;
  var contentHTML = req.body.detail_html;
  var nodeId      = req.body.node_id;
  var ip          = Tools.getIP(req);
  var deviceId    = req.body.device_id ? parseInt(req.body.device_id) : 1;
  var type        = req.body.type ? parseInt(req.body.type) : 1;

  async.waterfall([

    // 判断ip是否存在
    function(callback) {
      if (!ip) {
        callback(10000);
      } else {
        callback(null);
      }
    },

    function(callback) {
      if (type > 2 || type < 1) {
        callback(11001);
      } else {
        callback(null);
      }
    },

    function(callback) {
      if (!title) {
        callback(11002);
      } else if (title.length > 120) {
        callback(11003);
      } else {
        callback(null);
      }
    },

    function(callback) {
      if (contentHTML.length > 20000) {
        callback(11004);
      } else {
        callback(null);
      }
    },

    // 如果包含节点，那么判断节点是否存在
    function(callback) {

      if (!nodeId) {
        // 回复没有节点
        callback(15000);
        return;
      }

      Topic.fetch({ _id: nodeId }, {}, {}, function(err, data){
        if (err) console.log(err);
        if (!data || data.length == 0) {
          callback(15000);
        } else {
          callback(null);
        }
      });

    },

    // 添加feed
    function(callback) {

      content = xss(content, {
        whiteList: {},
        stripIgnoreTag: true,
        onTagAttr: function (tag, name, value, isWhiteAttr) {
          return '';
        }
      });

      // if (!content) {
      //   callback('content is blank');
      //   return;
      // }

      // console.log(contentHTML);

      contentHTML = xss(contentHTML, {
        whiteList: {
          a: ['href', 'title', 'target'],
          img: ['src', 'alt'],
          p: [],
          div: [],
          br: [],
          blockquote: [],
          li: [],
          ol: [],
          ul: [],
          strong: [],
          em: [],
          u: [],
          pre: [],
          b: [],
          h1: [],
          h2: [],
          h3: [],
          h4: [],
          h5: [],
          h6: [],
          h7: []
        },
        stripIgnoreTag: true,
        onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
          if (tag == 'div' && name.substr(0, 5) === 'data-') {
            // 通过内置的escapeAttrValue函数来对属性值进行转义
            return name + '="' + xss.escapeAttrValue(value) + '"';
          }
        }
      });

      // console.log(contentHTML);

      // if (!contentHTML) {
      //   callback('content is blank');
      //   return;
      // }

      title = xss(title, {
        whiteList: {},
        stripIgnoreTag: true,
        onTagAttr: function (tag, name, value, isWhiteAttr) {
          return '';
        }
      });

      if (!title) {
        callback(11002);
        return;
      }

      Posts.add({
        user_id: user._id,
        title: title,
        content: content,
        content_html: contentHTML,
        topic_id: nodeId,
        ip: ip,
        device: deviceId,
        type: type,
        last_comment_at: new Date().getTime()
      }, function(err, feed){
        if (err) console.log(err);

        feed.create_at = new Date(feed.create_at).getTime();

        callback(null, feed);
      });

    },

    // 更新父节点children的
    function(feed, callback) {

      Topic.update({ _id: nodeId }, { $inc: { 'posts_count': 1 } }, function(err){
        if (err) console.log(err)

        User.update({ _id: user._id }, { $inc: { 'posts_count': 1 } }, function(err){
          if (err) console.log(err)

          callback(null, feed);
        })

      })

    }

  ], function(err, result){

    if (err) {
      res.status(400);
      res.send({
        success: false,
        error: err
      });
    } else {
      res.send({
        success: true,
        data: result
      });
    }

  });

};


exports.update = function(req, res, next) {

  // 用户的信息
  var user     = req.user || null;
  var id       = req.body.id;
  var title    = req.body.title;
  var content  = req.body.content;
  var contentHTML = req.body.content_html;
  // var nodeId   = req.body.node_id;
  var ip       = Tools.getIP(req);

  async.waterfall([

    // 判断ip是否存在
    function(callback) {
      if (!id) {
        callback(11000);
      } else {
        callback(null);
      }
    },

    // 判断ip是否存在
    function(callback) {
      if (!ip) {
        callback(10000);
      } else {
        callback(null);
      }
    },

    function(callback) {
      if (!title) {
        callback(11002);
      } else if (title.length > 120) {
        callback(11003);
      } else {
        callback(null);
      }
    },

    function(callback) {
      if (contentHTML.length > 20000) {
        callback(11004);
      } else {
        callback(null);
      }
    },

    // 添加feed
    function(callback) {

      content = xss(content, {
        whiteList: {},
        stripIgnoreTag: true,
        onTagAttr: function (tag, name, value, isWhiteAttr) {
          return '';
        }
      });

      // if (!content) {
      //   callback('content is blank');
      //   return;
      // }

      contentHTML = xss(contentHTML, {
        whiteList: {
          a: ['href', 'title', 'target'],
          img: ['src', 'alt'],
          p: [],
          div: [],
          br: [],
          blockquote: [],
          li: [],
          ol: [],
          ul: [],
          strong: [],
          em: [],
          u: [],
          pre: [],
          b: [],
          h1: [],
          h2: [],
          h3: [],
          h4: [],
          h5: [],
          h6: [],
          h7: []
        },
        stripIgnoreTag: true,
        onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
          if (tag == 'div' && name.substr(0, 5) === 'data-') {
            // 通过内置的escapeAttrValue函数来对属性值进行转义
            return name + '="' + xss.escapeAttrValue(value) + '"';
          }
        }
      });

      // if (!contentHTML) {
      //   callback('content is blank');
      //   return;
      // }


      title = xss(title, {
        whiteList: {},
        stripIgnoreTag: true,
        onTagAttr: function (tag, name, value, isWhiteAttr) {
          return '';
        }
      });

      if (!title) {
        callback(11002);
        return;
      }

      Posts.update(
      {
        _id: id
      },
      {
        title: title,
        content: content,
        content_html: contentHTML,
        update_at: new Date()
      }, function(err){
        if (err) {
          console.log(err)
          callback(11005);
        } else {
          callback(null)
        }
      });

    },

  ], function(err, result){

    if (err) {
      res.status(400);
      res.send({
        success: false,
        error: err
      });
    } else {
      res.send({
        success: true
        // data: result
      });
    }

  });

};

/**
 * @api {get} /v1/questions 获取问题
 * @apiName Fetch question
 * @apiGroup Fotgot
 * @apiVersion 1.0.0
 *
 * @apiParam {String} date 用户名
 * @apiParam {String} type 获取类型
 * @apiParam {String} user_id 用户id
 * @apiParam {String} feed_id 问题id
 * @apiParam {String} node_id 主题id
 * @apiParam {Number} per_page 每页显示数量
 * @apiParam {String} children_limit 评论显示数量
 * @apiParam {String} grandson_limit 回复显示数量
 *
 * @apiSuccess {String} err 错误信息，如果为空，则发送成功
 *
 * @apiSuccessExample 成功:
 * HTTP/1.1 200 OK
 * {
 *   	[{
          "user_id": {
              "_id": "575e921a2f2ee7dd3527fd87",
              "nickname": "吴世剑",
              "follow_total": 0,
              "fans_total": 0,
              "node_follow_total": 3,
              "feed_total": 9,
              "brief": "123123123123123",
              "avatar": true,
              "create_at": "2016-06-13T10:59:37.706Z",
              "avatar_url": "http://192.168.31.210:3000/avatar/2016/06/13/575e921a2f2ee7dd3527fd87_thumbnail.jpg",
              "id": "575e921a2f2ee7dd3527fd87"
          },
          "node_id": {
              "_id": "5752f0bfe0d1ae6f0f872df5",
              "name": "好奇心",
              "avatar_url": "http://192.168.31.210:3000/images/nodes/1.jpg",
              "id": "5752f0bfe0d1ae6f0f872df5"
          },
          "last_comment_at": "2016-08-27T10:35:11.848Z",
          "_id": "57c16cdffaab2a47112eec08",
          "recommend": false,
          "verify": true,
          "deleted": false,
          "ip": "::ffff:192.168.31.210",
          "device": 1,
          "answers_count": 0,
          "answers": [],
          "create_at": "2016-08-27T10:35:11.848Z",
          "content": "11测试",
          "title": "11测试"
      }]
 * }
 */


exports.fetch = function(req, res, next) {

  var user = req.user || null,
      page = parseInt(req.query.page) || 0,
      perPage = parseInt(req.query.per_page) || 20,
      userId = req.query.user_id,
      nodeId = req.query.topic_id,
      postsId = req.query.posts_id,
      // ltCreateAt = req.query.lt_create_at,
      // ltCommentAt = req.query.lt_comment_at,
      ltDate = req.query.lt_date,
      or = req.query.or || true,
      draft = req.query.draft || false,
      method = req.query.method || '', // 模式
      query = {},
      select = {},
      options = {};

  if (user && method == 'user_custom') {

    // 用户自定制的内容
    user.follow_people.push(user._id)
    userId = user.follow_people.join(',')
    nodeId = user.follow_node.join(',')

    if (!userId && !nodeId) {
      res.send({
        success: true,
        data: []
      })
      return
    }
  }

  // ---- query -----

  if (or) {
    query['$or'] = []
  }

  if (user && method == 'user_custom') {
    // var count = user.follow_people.length + user.follow_node.length
    if (user.follow_node.length < 5) {
      or = true
      query['$or'] = [{
        sort_by_date: { '$lt': ltDate },
        deleted: false
      }]
    }
  }

  if (userId) {
    if (or) {
      query['$or'].push({
        user_id: {'$in': userId.split(',') },
        sort_by_date: { '$lt': ltDate },
        deleted: false
      })
    } else {
      query.user_id = { '$in': userId.split(',') }
    }
  }

  if (nodeId) {
    if (or) {

      var conf = {
        topic_id: {'$in': nodeId.split(',') },
        deleted: false
      }

      if (ltDate) {
        conf.sort_by_date = { '$lt': ltDate }
      }

      query['$or'].push(conf)
    } else {
      query.node_id = { '$in': nodeId.split(',') }
    }
  }

  if (postsId) {
    if (or) {

      var conf = {
        _id: {'$in': postsId.split(',') },
        deleted: false
      }

      if (ltDate) {
        conf.sort_by_date = { '$lt': ltDate }
      }

      query['$or'].push(conf)
    } else {
      query._id = { '$in': postsId.split(',') }
    }
  }

  if (query['$or'].length == 0) {
    delete query['$or']
    query.deleted = false
    if (ltDate) {
      query.sort_by_date = { '$lt': ltDate }
    }
  }

  // ------- query end ------


  // ------- select --------

  select = { __v: 0, recommend: 0, verify: 0, deleted: 0, ip: 0, device: 0, content: 0 }

  if (draft) {
    delete select.content
  }

  // ------- select end --------


  // ------- options -------

  if (page > 0) {
    options.skip = page * perPage
  }

  options.limit = perPage

  options.sort = { 'sort_by_date': -1 }

  options.populate = [
    {
      path: 'user_id',
      select: {
        '_id': 1, 'avatar': 1, 'create_at': 1, 'nickname': 1, 'brief': 1
      }
    },
    {
      path: 'comment',
      match: { 'deleted': false },
      select: {
        '_id': 1, 'content_html': 1, 'create_at': 1, 'reply_count': 1, 'like_count': 1, 'user_id': 1
      },
      options: { limit: 5, sort:{ 'reply_count': -1, 'like_count': -1 } }
    },
    {
      path: 'topic_id',
      select: { '_id': 1, 'name': 1 }
    }
  ]

  // ------- options end -------

  async.waterfall([

    function(callback) {

      Posts.find(query, select, options, function(err, posts){

        if (err) console.log(err);

        if (!posts || posts.length == 0) {
          callback([])
          return
        }

        var options = [
          {
            path: 'comment.user_id',
            model: 'User',
            select: { '_id': 1, 'avatar': 1, 'create_at': 1, 'nickname': 1, 'brief': 1 }
          }
        ]

        Posts.populate(posts, options, function(err, posts){

          if (err) console.log(err);

          posts = JSON.stringify(posts);
          posts = JSON.parse(posts);

          if (postsId) {
            Posts.update({ _id: postsId }, { $inc: { view_count: 1 } }, function(err){
              if (err) console.log(err);
              callback(null, posts)
            })
          } else {
            callback(null, posts)
          }

        })

      })
    },

    function(posts, callback) {

      if (!user) {
        callback(posts)
        return
      }

      // 如果是登录状态，那么查询是否关注了该问题

      var ids = []
      // var commentsIds = []

      for (var i = 0, max = posts.length; i < max; i++) {
        ids.push(posts[i]._id)

        // posts[i].comment.map(function(comment){
        //   commentsIds.push(comment._id)
        // })

      }

      Follow.fetch({
        user_id: user._id,
        posts_id: { "$in": ids },
        deleted: false
      }, { posts_id: 1 }, {}, function(err, follows){

        if (err) console.log(err)
        var ids = {}

        for (var i = 0, max = follows.length; i < max; i++) {
          ids[follows[i].posts_id] = 1
        }

        posts.map(function(question, key){
          posts[key].follow = ids[question._id] ? true : false
        })

        callback(posts)

      })

      /*
      FollowQuestion.fetchByUserIdAndQuestionIds(user._id, ids, function(err, follows){
        if (err) console.log(err)

        var ids = {}

        for (var i = 0, max = follows.length; i < max; i++) {
          ids[follows[i].question_id] = 1
        }

        Like.fetch({
          user_id: user._id,
          type: 'answer',
          target_id: { "$in": answerIds },
          deleted: false
        }, {}, {}, function(err, likes){
          if (err) console.log(err)

          var answerIds = {}

          for (var i = 0, max = likes.length; i < max; i++) {
            answerIds[likes[i].target_id] = 1
          }

          questions.map(function(question, key){
            questions[key].follow = ids[question._id] ? true : false
            questions[key].answers.map(function(answer, index){
              questions[key].answers[index].like = answerIds[answer._id] ? true : false
            })
          })

          callback(questions)

        })

      })
      */

    }
  ], function(result){

    res.send({
      success: true,
      data: result
    })

  })

}

/*
exports.delete = function(req, res){
  var user = req.user
  var answerId = req.body.answer_id

  Answer.fetchById(answerId, function(err, answer){
    if (err) console.log(err)
    if (answer) {
      Notification.fetch({ sender_id: answer.user_id._id, answer_id: answer._id }, {}, {}, function(err, notice){
        if (err) console.log(err)
        if (notice) {
          Notification.updateDeleteById(notice._id, function(err){
            if (err) console.log(err)

            res.send({
              success: true,
              data: questions
            })

          })
        }
      })
    }
  })
}
*/