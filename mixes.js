var passport = require('passport');
var Mix = require('./models/mix');
var fs = require('fs');
var path = require('path');

var uuid = require("node-uuid");
var urlSafeBase64 = require('urlsafe-base64');

function ensureOwnership(req, res, next) {
  if (req.isAuthenticated()) {
    var owner = (req.params.user)?req.params.user:req.body.owner;
    if (req.user.username != owner) {
      res.status(403);
      res.send({
        error: 'Forbidden'
      });
      return;
    }
    return next();
  } else {
    res.status(401);
    res.send({
      error: 'Unauthorized'
    });
    return;
  }
}

module.exports = function(app, nconf) {

  app.get('/v1/:user?/mixes', function(req, res) {
    if (req.params.user) {
      var query = {
        owner: req.params.user
      };
      return Mix.find(query, function(err, mixes) {
        return res.send(mixes);
      });
    }
    return Mix.find(function(err, mixes) {
      return res.send(mixes);
    });
  });

  app.get('/v1/:user?/mixes/channels', function(req, res) {
    if (req.params.user) {
      return Mix.distinct('channel', {
        owner: req.params.user
      }, function(err, results) {
        return res.send(results);
      });
    }

    Mix.distinct('channel', function(err, results) {
      return res.send(results);
    });
  });

  app.get('/v1/:user?/mixes/tags', function(req, res) {
    if (req.params.user) {
      return Mix.distinct('tags', {
        owner: req.params.user
      }, function(err, results) {
        return res.send(results);
      });
    }

    Mix.distinct('tags', function(err, results) {
      return res.send(results);
    });
  });

  app.get('/v1/:user?/mixes/tags/notag', function(req, res) {
    if (req.params.user) {
      var query = {
        owner: req.params.user,
        $or: [{tags: []}, {tags: { $exists: false }}]
      };
      return Mix.find(query, function(err, mixes) {
        return res.send(mixes);
      });
    }
    var query = {
      $or: [{tags: []}, {tags: { $exists: false }}]
    };
    return Mix.find(query,function(err, mixes) {
      return res.send(mixes);
    });
  });

  app.get('/v1/:user?/mixes/channels/nochannel', function(req, res) {
    if (req.params.user) {
      var query = {
        owner: req.params.user,
        $or: [{channel: null}, {channel: { $exists: false }}]
      };
      return Mix.find(query, function(err, mixes) {
        return res.send(mixes);
      });
    }
    var query = {
      $or: [{channel: null}, {channel: { $exists: false }}]
    };
    return Mix.find(query,function(err, mixes) {
      return res.send(mixes);
    });
  });

  app.get('/v1/:user?/mixes/tags/:tag', function(req, res) {
    if (req.params.user) {
      var query = {
        owner: req.params.user,
        tags: { $in: [req.params.tag] }
      };
      return Mix.find(query, function(err, mixes) {
        return res.send(mixes);
      });
    }
    var query = {
      tags: { $in: [req.params.tag] }
    };
    return Mix.find(query,function(err, mixes) {
      return res.send(mixes);
    });
  });

  app.get('/v1/:user?/mixes/channels/:channel', function(req, res) {
    if (req.params.user) {
      var query = {
        owner: req.params.user,
        channel: req.params.channel
      };
      return Mix.find(query, function(err, mixes) {
        return res.send(mixes);
      });
    }
    var query = {
      channel: req.params.channel
    };
    return Mix.find(query,function(err, mixes) {
      return res.send(mixes);
    });
  });

  app.get('/v1/:user?/mixes/:id', function(req, res) {
    return Mix.findById(req.params.id, function(err, mix) {
      if (!err) {
        return res.send(mix);
      }

      res.status(404);
      res.send({
        error: 'Not found'
      });
      return;
    });
  });

  app.put('/v1/:user?/mixes/:id', ensureOwnership, function(req, res) {
    var owner = (req.params.user)?req.params.user:req.body.owner;

    return Mix.findById(req.params.id, function(err, mix) {

      if (mix.owner != req.user.username) {
        res.status(403);
        res.send({
          error: 'Forbidden'
        });
        return;
      }

      mix.label = req.body.label;
      mix.desc = req.body.desc;
      mix.type = req.body.type;
      mix.tags = req.body.tags;
      mix.channel = req.body.channel;

      if (req.params.user) {
        mix.owner = req.params.user;
      } else {
        mix.owner = req.body.owner;
      }

      mix.meta = req.body.meta;

      if (req.body.content) {
        mix.content = req.body.content;
      }

      return mix.save(function(err) {
        if (!err) {
          console.log("updated");
        }
        return res.send(mix);
      });
    });
  });

  app.post('/v1/:user?/mixes', ensureOwnership, function(req, res) {
    var owner = (req.params.user)?req.params.user:req.body.owner;

    var mix;
    // var owner;
    var content = null;

    // if (req.params.user) {
    //   owner = req.params.user;
    // } else {
    //   owner = req.body.owner;
    // }


    if (req.body.content) {
      content = req.body.content;
    }

    mix = new Mix({
      _id: urlSafeBase64.encode(uuid.v4(null, new Buffer(16), 0)),
      label: req.body.label,
      desc: req.body.desc,
      type: req.body.type,
      owner: owner,
      meta: req.body.meta,
      content: content,
      tags: req.body.tags,
      channel: req.body.channel
    });

    mix.save(function(err) {
      if (!err) {
        return console.log("created");
      }
    });
    return res.send(mix);
  });

  // ID is unique, ignore user
  // TODO: restrict to same user only
  app.delete('/v1/:user?/mixes/:id', function(req, res) {
    return Mix.findById(req.params.id, function(err, mix) {
      if (mix.owner != req.user.username) {
        res.status(403);
        res.send({
          error: 'Forbidden'
        });
        return;
      }
      return mix.remove(function(err) {
        if (!err) {
          console.log("removed");
          return res.send('')
        }
      });
    });
  });

};
