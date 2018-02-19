// src/server.js

import path from 'path';
import { Server } from 'http';
import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import routes from './routes';
import NotFoundPage from './components/NotFoundPage';

var bodyParser = require('body-parser')
var dictionary = require('dictionary-en-us')
var nspell = require('nspell')
// initialize the server and configure support for ejs templates
const app = new Express();

var socket = require('./socket.js');
const server = new Server(app);
var spell

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json())

// define the folder that will be used for static assets
app.use(Express.static(path.join(__dirname, 'static')));
app.set('port', 3000)
var io = require('socket.io').listen(server);
io.sockets.on('connection', socket)
function setupCORS(req, res, next) {
    // TODO: Review whether we need CORS here.
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,FETCH');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type,Accept,X-Access-Token,X-Key,Authorization');
    // res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Origin', '*');
    console.log("IN HERE")
    if (req.method === 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
}
// app.all('*', setupCORS);
// universal routing and rendering
app.post("/preprocess", function(req, res) {
   res.setHeader('Content-Type', 'application/json');

    var result = ""
    var y = req.body.word
     var words = y.split(" ")
     for(var i = 0;i<words.length;i+=1) {
       if(i != 0)
        result = result + " "
       var cur = spell.suggest(words[i])
       if(cur.length > 0)
        result = result + cur[0]
       else
        result = result + words[i]
     }
    res.send(JSON.stringify({ result: result }));
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
        markup = renderToString(<RouterContext {...renderProps}/>);
      } else {
        // otherwise we can render a 404 page
        markup = renderToString(<NotFoundPage/>);
        res.status(404);
      }

      // render the index template with the embedded React markup
      return res.render('index', { markup });
    }
  );
});

// start the server
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'production';
server.listen(app.get('port'), err => {
  dictionary(function (err, dict) {
    spell = nspell(dict)
  })
  
  
  if (err) {
    return console.error(err);
  }
  console.info(`Server running on http://localhost:${port} [${env}]`);
  
    // If want to send request directly
    // var app = apiai("031636d290f341729417585f09f1ebc4");
 
    // var request = app.textRequest('ASEAN Scholarship', {
    //     sessionId: '123123'
    // });
 
    // request.on('response', function(response) {
    //     console.log(response);
    //     return response
    // });
    
    // request.on('error', function(error) {
    //     console.log(error);
    // });
    
    // request.end();
    // var request = require('request');
    // request.post({
    //     url: "http://localhost:8080/query",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     body: {
    //       "query": "What are the scholarship for ASEAN students?"
    //     },
    //     json:true
    // }, function(error, response, body){
    //   console.log(body)
    // });
});