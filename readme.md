# Chatbot-frontend
Frontend implementation of FYP: SCSE Chatbot

# Installation

## Node.js
Note: There might be some dependencies problem if other version of node.js is used, hence, it is recommended to build node.js version 4.6.0 as follow (until the dependencies problems are solved).
```
wget -c https://nodejs.org/dist/v4.6.0/node-v4.6.0.tar.gz #This is to download the source code.
tar -xzf node-v4.6.0.tar.gz
cd node-v4.6.0
sudo ./configure
sudo make
sudo make install
```

## Chatbot-frontend
1. Clone the repository
`git clone https://github.com/dbakti7/chatbot-frontend.git`

2. Install the dependencies
`npm install`

## Running the node.js server
Go to the following file for configuration.
```
src/constants.js
```

If you are on Linux environment, run the following commands.
```
node_modules/.bin/webpack -p
node_modules/.bin/babel-node --presets react,es2015 src/server.js
```

If you are on Windows environment, open Windows PowerShell and use the following commands.
```
NODE_ENV=production node_modules/.bin/webpack -p
NODE_ENV=production node_modules/.bin/babel-node --presets react,es2015 src/server.js
```

If IS_PRODUCTION = false, navigate to
```
localhost:{port}
```

otherwise, navigate to either one of
```
localhost
https://your_domain_name
```

# Sample Requests for Testing
## /df-query endpoint
Used to query dialogflow directly.
```
POST localhost:{port}/df-query
{
	"query": "scholraship ailve",
	"sessionID": "test"
}
```

## /preprocess endpoint
Used to perform spellchecking on client-side.
```
POST localhost:{port}/preprocess
{
	"word": "intrnational schloarship"
}
```