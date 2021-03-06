var User = require('./models/User');
var goodid = require('./routes/goodid');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');

module.exports = function(app) {

  app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
  }));

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));

  // Application ------------------------------------------
  app.get('/', function(req, res){
    res.sendfile('./app/client/index.html');
  });

  // GoodID internal
  app.use('/_goodid', goodid);

  // Wildcard all other GET requests to the angular app
  app.get('*', function(req, res){
    res.sendfile('./app/client/index.html');
  });

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
  });

  // error handler
  app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
  });


};
