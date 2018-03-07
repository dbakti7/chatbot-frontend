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

var internalQueryURL = 'http://localhost:8080/internal-query';
var preprocessURL = 'http://localhost/preprocess';
if(constants.IS_PRODUCTION) {
	internalQueryURL = 'https://www.pieceofcode.org:8080/internal-query';
	preprocessURL = 'https://www.pieceofcode.org/preprocess';
}

var getTopics = function() {
	var welcomeText = "Welcome to NTU Chatbot. You can find out more about:\n"
	for(var i = 0; i < topics.length; i++)
		welcomeText += (i+1) + ". " + topics[i] + "\n"
	var alpha2message = "Welcome to NTU Chatbot! We are currently in testing phase to gather more data, please ask questions related to SCSE, scholarship, or hostel. After that, please help us by filling the following questionaire: https://tinyurl.com/botfeedback-alpha2"

	var newMessage = {
		user: "Bot",
		text: alpha2message,
		bot: true,
		context: ""
	}
	return newMessage
}

var generate_key = function() {
    return uuid.v4()
};


function botQuery(query, sessionID, enumerator) {
//   var app = dialogFlow("58be6f8f4fb9447693edd36fb975bece")
//   var request = app.textRequest(query, {
// 	  sessionId: sessionID
//   })

//   request.on('response', function(response) {
// 	  console.log(response)
//   })
  
//   request.on('error', function(error){
// 	  console.log(error)
//   })

//   request.end()
//   return fetch('http://localhost:8080/query', {
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
		if(response.ok) {
			return response.json()
	}}).then(json => {
		return json
	})
}


var UsersList = React.createClass({
	render() {
		return (
			<div className='users'>
				<h3> Online Users </h3>
				<ul>
					{
						this.props.users.map((user, i) => {
							return (
								<li key={i}>
									{user}
								</li>
							);
						})
					}
				</ul>				
			</div>
		);
	}
});

// If want to show username:
//<strong>{this.props.user} :</strong>	
var Message = React.createClass({
	render() {
		const isBot = this.props.bot;
		if(isBot) {
			return (
					<div className="talk-bubble tri-right right-top round">
						<div className="talktext">
							<Linkify properties={{target: '_blank'}}>
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
						<Linkify properties={{target: '_blank'}}>
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
		return {text: ''};
	},

	handleSubmit(e) {
		e.preventDefault();
		var message = {
			user : this.props.user,
			text : this.state.text,
			bot: false,
			context: ""
		}
		this.props.onMessageSubmit(message);
		this.setState({ text: '' });
	},

	changeHandler(e) {
		this.setState({ text : e.target.value });
	},

	render() {
		return(
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

var ChangeNameForm = React.createClass({
	getInitialState() {
		return {newName: ''};
	},

	onKey(e) {
		this.setState({ newName : e.target.value });
	},

	handleSubmit(e) {
		e.preventDefault();
		var newName = this.state.newName;
		this.props.onChangeName(newName);	
		this.setState({ newName: '' });
	},

	render() {
		return(
			<div className='change_name_form'>
				<h3> Change Name </h3>
				<form onSubmit={this.handleSubmit}>
					<input
						onChange={this.onKey}
						value={this.state.newName} 
					/>
				</form>	
			</div>
		);
	}
});


var Chat = React.createClass({
	getInitialState() {
		return {users: [], messages:[getTopics()], text: '', sessionID:generate_key(), context:'', enumerator:[]};
		// return {users: [], messages:[], text: '', sessionID:generate_key(), context:'', enumerator:[]};
	},

	scrollToBottom() {
		const node = ReactDOM.findDOMNode(this.messagesEnd);
		node.scrollIntoView({ behavior: "smooth" });
	},
	
	componentDidMount() {
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageRecieve);
		socket.on('user:join', this._userJoined);
		socket.on('user:left', this._userLeft);
		socket.on('change:name', this._userChangedName);
	},

	componentDidUpdate() {
		this.scrollToBottom();
	},

	_initialize(data) {
		var {users, name} = data;
		this.setState({users, user: name});
	},

	_messageRecieve(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
	},

	_userJoined(data) {
		var {users, messages} = this.state;
		var {name} = data;
		users.push(name);
		messages.push({
			user: 'APPLICATION BOT',
			text : name +' Joined'
		});
		this.setState({users, messages});
	},

	_userLeft(data) {
		var {users, messages} = this.state;
		var {name} = data;
		var index = users.indexOf(name);
		users.splice(index, 1);
		messages.push({
			user: 'APPLICATION BOT',
			text : name +' Left'
		});
		this.setState({users, messages});
	},

	_userChangedName(data) {
		var {oldName, newName} = data;
		var {users, messages} = this.state;
		var index = users.indexOf(oldName);
		users.splice(index, 1, newName);
		messages.push({
			user: 'APPLICATION BOT',
			text : 'Change Name : ' + oldName + ' ==> '+ newName
		});
		this.setState({users, messages});
	},

	handleMessageSubmit(message) {
		var {messages} = this.state;
		messages.push(message);
		this.setState({messages});
		var that = this
		if(message.text == "clear") {
			// messages = [getTopics()]
			messages = []
			this.setState({messages});
			return;
		}
		var data = {
			"word": message.text
		}

		fetch(preprocessURL, {
		method: "POST",
		headers: {
        	'Accept': 'application/json, text/plain, */*',
        	'Content-Type': 'application/json'
    	},
		body:  JSON.stringify(data)
		})
		.then(function(response){ 
			return response.json();   
		})
		.then(function(data){ 
			var queryMessage = message.text
			if(data.result != message.text) {
				console.log(data.result)
				var newMessage = {
					user: "Bot",
					text: "Did you mean: " + data.result,
					bot: true,
					context: ""
				}
				//that._messageRecieve(newMessage)
				queryMessage = data.result
			}
				
			socket.emit('send:message', message);
			
			// TODO: Fixed the autocorrect module
			//botQuery(queryMessage, that.state.sessionID).then(response => {
			botQuery(message.text, that.state.sessionID, that.state.enumerator).then(response => {
				console.log("Context: " + response.Context)
				var m = {
					user : "Bot",
					text : response.Result,
					bot: true,
					context: response.Context
				}
				// if(response.Result == "reset")
				// 	m = getTopics()
				console.log("Context Before" + that.state.context)
				that.state.context = (typeof response.Context == "undefined") ? "" : response.Context.split("-")[0]
				that.state.enumerator = response.Enum
				if(that.state.enumerator == "")
					that.state.enumerator = []
				console.log("Enumerator " + that.state.enumerator)
				console.log("Context After" + that.state.context)
				that._messageRecieve(m)
			})
		});
	},

	handleChangeName(newName) {
		var oldName = this.state.user;
		socket.emit('change:name', { name : newName}, (result) => {
			if(!result) {
				return alert('There was an error changing your name');
			}
			var {users} = this.state;
			var index = users.indexOf(oldName);
			users.splice(index, 1, newName);
			this.setState({users, user: newName});
		});
	},

	render() {
		return (
			<div style={{height: '100%'}}>
				<div style={{height:'80%', overflowY:'scroll', width:'100%', position:'fixed'}}>
					<MessageList
						messages={this.state.messages}
					/>
					<div style={{ float:"left", clear: "both" }}
             		ref={(el) => { this.messagesEnd = el; }}></div>
				</div>
				<div style={{position: 'fixed', height: '20%', bottom: '0'}}>
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
