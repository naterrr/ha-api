var nconf = require('nconf');
var fs = require('fs');

var toobusy = require('toobusy');
var express = require('express');

var http = require('http');
var path = require('path');

var mongoose = require('mongoose');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var uuid = require("node-uuid");
var urlSafeBase64 = require('urlsafe-base64');


nconf.argv()
  .env()
  .file({
    file: 'settings.json'
  });

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(function(req, res, next) {
  if (toobusy()) {
    res.send(503, "I'm busy right now, sorry.");
  } else {
    next();
  }
});

app.use(express.favicon());
app.use(express.logger('dev'));

// app.use(express.bodyParser());
app.use(express.json());
app.use(express.urlencoded());

app.use(express.methodOverride());

var sessions = require("client-sessions");
app.use(sessions({
  cookieName: 'session',
  secret: 'ohziuchaepah7xie0vei6Apai8aep4th', //FIXME: move to conf
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
  cookie: {
    path: '/v1', // cookie will only be sent to requests under '/v1'
    // maxAge: 60000, // duration of the cookie in milliseconds, defaults to duration above
    ephemeral: false, // when true, cookie expires when the browser closes
    httpOnly: true, // when true, cookie is not accessible from javascript
    secure: false   // when true, cookie will only be sent over SSL
  }
}));

// app.use(sessions({
//   cookieName: 'recall',
//   duration: 7 * 24 * 60 * 60 * 1000,
//   secret: 'qwer1234',
//   cookie: {
//     path: '/', // cookie will only be sent to requests under '/v1'
//     ephemeral: false, // when true, cookie expires when the browser closes
//     httpOnly: false, // when true, cookie is not accessible from javascript
//     secure: false   // when true, cookie will only be sent over SSL
//   }
// }));

//TODO move CUBE in here
// app.use(function(req, res, next) {
//   // console.log(req.session);
//   if (req.session.seenyou) {
//     res.setHeader('X-Seen-You', 'true');
//   } else {
//     req.session.seenyou = true;
//     res.setHeader('X-Seen-You', 'false');
//   }
//   // res.setHeader('X-Lag', toobusy.lag()); //FIXME move to hearbeat?
//   next();
// });

app.use(passport.initialize());
app.use(passport.session());

//http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Credentials", "true");
  var oneof = false;
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    oneof = true;
  }
  if (req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
    oneof = true;
  }
  if (req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
    oneof = true;
  }
  if (oneof) {
    res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  }

  // intercept OPTIONS method
  if (oneof && req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

app.use(app.router);

app.use(require('less-middleware')({
  src: __dirname + '/public'
}));
app.use(express.static(path.join(__dirname, 'public')));


// development only FIXME
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


var Account = require('./models/account');
mongoose.connect(nconf.get('database'));

passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());


app.get('/', function(req, res) {
  res.redirect('http://hyperaud.io/');
});

app.get('/v1', function(req, res) {
  res.redirect('http://hyperaud.io/');
});

app.get('/v1/status', function(req, res) {
  res.json({
    lag: toobusy.lag()
  });
});

app.get('/v1/whoami', function(req, res) {

  //FIXME
  if (typeof req.session.user == "undefined") {
    req.session.user = null;
  }

  // if (req.recall) req.recall.user = req.session.user;

  res.json({
    user: req.session.user
  });
});

app.get('/v1/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});

app.post('/v1/login', passport.authenticate('local'), function(req, res) {
  req.session.user = req.user.username;
  //FIXME: here we miss invalide login attemtps

  res.json({
    user: req.user.username
  });
});

app.post('/v1/logout', function(req, res) {

  req.logout(); //TODO has any meaning anymore?

  req.session.user = null;
  res.json({
    user: null
  });
});

app.get('/v1/register', function(req, res) {
  res.render('register', {});
});

app.post('/v1/register', function(req, res) {

  Account.register(new Account({
      _id: urlSafeBase64.encode(uuid.v4(null, new Buffer(16), 0)),
      username: req.body.username,
      email: req.body.email
    }),
    req.body.password,
    function(err, account) {
      //FIXME we should log invalid ones too

      if (err) {
        return res.send(401);
      }

      //FIXME authenticate
      if (req.isAuthenticated()) {
        // req.session.user = req.user.username;
        res.json({
          user: req.user
        });
      } else {
        res.json({
          user: null
        });
      }
    });
});


require('./media')(app, nconf);
require('./transcripts')(app, nconf);
require('./mixes')(app, nconf);

app.post('/v1/error/:component', function(req, res) {

  res.json({});
});


var server = http.createServer(app).listen(app.get('port'), function() {
  console.log('Hyperaudio API server listening on port ' + app.get('port'));
});

// var io = require('socket.io').listen(server);

// io.sockets.on('connection', function (socket) {
//   socket.on('log', function (data) {
//     console.log(data);
//   });

//   socket.on('mod9', function (data) {
//     // socket.volatile.emit(data.user, data);
//     socket.broadcast.emit(data.user, data);
//   });
// });

process.on('SIGINT', function() {
  server.close();
  toobusy.shutdown();
  process.exit();
});


// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) { return next(); }
//   // if (req.session.user) {
//   //   return next();
//   // }
//   res.send(401);
//   // res.redirect('/v1/login');
// }

