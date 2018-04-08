'use strict';

var React = require('react');
var ReactDOM = require('react-dom')
var uuid = require('node-uuid');
var fs = require('fs')
var Linkify = require('react-linkify').default
var dialogFlow = require('apiai')
var constants = require('../constants')
// check https://stackoverflow.com/a/34130767/7003027 for details on "default" parameter

var topics = ["SCSE", "Hostel", "Scholarship"]

var internalQueryURL = constants.SERVER_URL_LOCAL + constants.SERVER_ENDPOINT;
var preprocessURL = constants.LOCALHOST + ":" + constants.LOCALHOST_PORT + constants.PREPROCESS_ENDPOINT;
var dialogflowQueryURL = constants.DEPLOYMENT_URL + constants.DIALOGFLOW_QUERY_ENDPOINT;
if (constants.IS_PRODUCTION) {
	internalQueryURL = constants.SERVER_URL + constants.SERVER_ENDPOINT;
	preprocessURL = constants.DEPLOYMENT_URL + constants.PREPROCESS_ENDPOINT;
}

var getTopics = function () {
	// welcome message
	var welcomeText = "Welcome to NTU Chatbot. You can find out more about:\n"
	for (var i = 0; i < topics.length; i++)
		welcomeText += (i + 1) + ". " + topics[i] + "\n"
	var alpha2message = "Welcome to NTU Chatbot! We are currently in testing phase to gather more data, please ask questions related to SCSE, scholarship, or hostel. After that, please help us by filling the following questionaire: https://tinyurl.com/botfeedback-alpha2"

	var newMessage = {
		user: "Bot",
		text: alpha2message,
		bot: true,
		context: ""
	}
	return newMessage
}

var generate_key = function () {
	return uuid.v4()
};


function botQuery(query, sessionID, enumerator) {
	return fetch(internalQueryURL, {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: query,
			sessionID: sessionID,
			enum: enumerator
		})
	}).then((response) => {
		if (response.ok) {
			return response.json()
		}
	}).then(json => {
		return json
	})
}

function queryDialogflow(query, sessionID) {
	// TODO: CORS setup in node.js is broken, most likely due to external dependency
  // problem, routed to go server instead. It will allow more control in go server too.
  var data = {
    "query": query,
    "sessionID": sessionID
  }
	fetch(dialogflowQueryURL, {
    method: "POST",
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log("Autocorrect used:")
      console.log(data.result)
    });
}

var Message = React.createClass({
	render() {
		const isBot = this.props.bot;
		if (isBot) {
			return (
				<div className="talk-bubble tri-right right-top round">
					<div className="talktext">
						<Linkify properties={{ target: '_blank' }}>
							<span>{this.props.text.split("\n").map(i => {
								return <p>{i}</p>;
							})}</span>
						</Linkify>
					</div>
				</div>
			);
		}
		else {
			return (
				<div>
					<div className="talk-bubble tri-right left-top round">
						<div className="talktext">
							<Linkify properties={{ target: '_blank' }}>
								<span>{this.props.text.split("\n").map(i => {
									return <p>{i}</p>;
								})}</span>
							</Linkify>
						</div>
					</div>
				</div>
			);
		}
	}
});

var MessageList = React.createClass({
	render() {
		return (
			<div>
				<div className='messages'>
					{
						this.props.messages.map((message, i) => {
							return (
								<Message
									key={i}
									user={message.user}
									text={message.text}
									bot={message.bot}
								/>
							);
						})
					}
				</div>
			</div>
		);
	}
});

var MessageForm = React.createClass({

	getInitialState() {
		return { text: '' };
	},

	handleSubmit(e) {
		e.preventDefault();
		var message = {
			user: this.props.user,
			text: this.state.text,
			bot: false,
			context: ""
		}
		this.props.onMessageSubmit(message);
		this.setState({ text: '' });
	},

	changeHandler(e) {
		this.setState({ text: e.target.value });
	},

	render() {
		return (
			<div className='message_form'>
				<form onSubmit={this.handleSubmit}>
					<input
						onChange={this.changeHandler}
						value={this.state.text}
					/>
				</form>
			</div>
		);
	}
});


var Chat = React.createClass({
	getInitialState() {
		return { users: [], messages: [getTopics()], text: '', sessionID: generate_key(), context: '', enumerator: [] };
		// return {users: [], messages:[], text: '', sessionID:generate_key(), context:'', enumerator:[]};
	},

	scrollToBottom() {
		const node = ReactDOM.findDOMNode(this.messagesEnd);
		node.scrollIntoView({ behavior: "smooth" });
	},

	componentDidMount() {
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageReceive);
	},

	componentDidUpdate() {
		this.scrollToBottom();
	},

	_initialize(data) {
		var { users, name } = data;
		this.setState({ users, user: name });
	},

	_messageReceive(message) {
		var { messages } = this.state;
		messages.push(message);
		this.setState({ messages });
	},

	handleMessageSubmit(message) {
		var { messages } = this.state;
		messages.push(message);
		this.setState({ messages });
		var that = this
		if (message.text == "clear") {
			// messages = [getTopics()]
			messages = []
			this.setState({ messages });
			return;
		}
		var data = {
			"word": message.text
		}

		function processQuery(query) {
			socket.emit('send:message', message);

			// change message.text to queryMessage if Spellchecker is activated
			// botQuery(query, that.state.sessionID, that.state.enumerator).then(response => {
				queryDialogflow(message.text, that.state.sessionID).then(response => {

				var m = {
					user: "Bot",
					text: response.Result,
					bot: true,
					context: response.Context
				}
				// if(response.Result == "reset")
				// 	m = getTopics()

				that.state.context = (typeof response.Context == "undefined") ? "" : response.Context.split("-")[0]
				that.state.enumerator = response.Enum
				if (that.state.enumerator == "")
					that.state.enumerator = []

				that._messageReceive(m)
			})
		}
		if (constants.USE_SPELLCHECKING) {
			fetch(preprocessURL, {
				method: "POST",
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			})
				.then(function (response) {
					return response.json();
				})
				.then(function (data) {
					console.log("Autocorrect used:")
					console.log(data.result)
					processQuery(data.result);
				});
		} else {
			processQuery(message.text);
		}

	},

	render() {
		return (
			<div style={{ height: '100%' }}>
				<div style={{ height: '80%', overflowY: 'scroll', width: '100%', position: 'fixed' }}>
					<MessageList
						messages={this.state.messages}
					/>
					<div style={{ float: "left", clear: "both" }}
						ref={(el) => { this.messagesEnd = el; }}></div>
				</div>
				<div style={{ position: 'fixed', height: '20%', bottom: '0' }}>
					<h3 ref={(el) => { this.contextText = el; }}>
						What do you want to know about?
					</h3>
					<MessageForm
						onMessageSubmit={this.handleMessageSubmit}
						user={this.state.user}
					/>
				</div>
			</div>

		);
	}
});

export default Chat;
