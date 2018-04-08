// src/server.js

import path from 'path';
import { Server } from 'http';
var https = require('https');
import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import routes from './routes';
import NotFoundPage from './components/NotFoundPage';
var constants = require('./constants');
var fs = require('fs')
var dialogFlow = require('apiai')

var bodyParser = require('body-parser')
var dictionary = require('dictionary-en-us')
var nspell = require('nspell')
// initialize the server and configure support for ejs templates
const app = new Express();

var socket = require('./socket.js');

var sslOptions = {}

app.set('port', constants.LOCALHOST_PORT)

if (constants.IS_PRODUCTION) {
  sslOptions = {
    key: fs.readFileSync(constants.KEY_FILE),
    cert: fs.readFileSync(constants.CERT_FILE)
  };
  app.set('port', 80)
  app.use(function (req, res, next) {
    if (!/https/.test(req.protocol)) {
      res.redirect("https://" + req.headers.host + req.url);
    } else {
      return next();
    }
  });
}

var server = new Server(app);

var spell

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json())

// define the folder that will be used for static assets
app.use(Express.static(path.join(__dirname, 'static')));



var sslPort = 443;
var sslServer = https.createServer(sslOptions, app);
var io
if (constants.IS_PRODUCTION) {
  io = require('socket.io').listen(sslServer);
} else {
  io = require('socket.io').listen(server);
}

io.sockets.on('connection', socket)

// universal routing and rendering
app.post(constants.PREPROCESS_ENDPOINT, function (req, res) {
  res.setHeader('Content-Type', 'application/json');

  var result = ""
  var y = req.body.word
  var words = y.split(" ")
  for (var i = 0; i < words.length; i += 1) {
    if (i != 0)
      result = result + " "
    var cur = spell.suggest(words[i])
    if (cur.length > 0)
      result = result + cur[0]
    else
      result = result + words[i]
  }
  res.send(JSON.stringify({ result: result }));
})

app.post(constants.DIALOGFLOW_QUERY_ENDPOINT, function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  var query = req.body.query
  var sessionID = req.body.sessionID

  var app = dialogFlow(constants.DIALOGFLOW_TOKEN);

  var request = app.textRequest(query, {
    sessionId: sessionID
  });

  request.on('response', function (response) {
    res.send(JSON.stringify(response));
  });

  request.on('error', function (error) {
    console.log(error);
  });

  request.end();
})

app.get('*', (req, res) => {
  match(
    { routes, location: req.url },
    (err, redirectLocation, renderProps) => {

      // in case of error display the error message
      if (err) {
        return res.status(500).send(err.message);
      }

      // in case of redirect propagate the redirect to the browser
      if (redirectLocation) {
        return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      }

      // generate the React markup for the current route
      let markup;
      if (renderProps) {
        // if the current route matched we have renderProps
        markup = renderToString(<RouterContext {...renderProps} />);
      } else {
        // otherwise we can render a 404 page
        markup = renderToString(<NotFoundPage />);
        res.status(404);
      }

      // render the index template with the embedded React markup
      return res.render('index', { markup });
    }
  );
});

// start the server
server.listen(app.get('port'), err => {
  dictionary(function (err, dict) {
    spell = nspell(dict)
  })


  if (err) {
    return console.error(err);
  }
  console.info("Server running on http://localhost:" + app.get("port"));
});


if (constants.IS_PRODUCTION) {
  sslServer.listen(sslPort, err => {
    if (err) {
      return console.error(err);
    }
    console.info("SSL Server running...");
  })
}

