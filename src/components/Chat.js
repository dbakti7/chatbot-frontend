'use strict';

var React = require('react');
var apiai = require('apiai');
var uuid = require('node-uuid');
var fs = require('fs')

var topics = ["SCSE", "Hostel", "Scholarship"]

var getTopics = function() {
	var welcomeText = "Welcome to NTU Chatbot. You can find out more about:\n"
	for(var i = 0; i < topics.length; i++)
		welcomeText += (i+1) + ". " + topics[i] + "\n"
	var newMessage = {
		user: "Bot",
		text: welcomeText,
		bot: true
	}
	return newMessage
}

var generate_key = function() {
    return uuid.v4()
};


function botQuery(query, sessionID) {
  return fetch('http://localhost:8080/query', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query, 
	  sessionID: sessionID
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
							<span>{this.props.text.split("\n").map(i => {
            					return <p>{i}</p>;
        					})}</span>		
						</div>
					</div>
			);
		}
		else {
			return (
				<div>
					<div className="talk-bubble tri-right left-top round">
						<div className="talktext">
						<span>{this.props.text.split("\n").map(i => {
            					return <p>{i}</p>;
        					})}</span>		
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
			<div className='messages'>
				<h2> Conversation: </h2>
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
			bot: false
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
				<h3>Write New Message</h3>
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
		return {users: [], messages:[getTopics()], text: '', sessionID:generate_key()};  
	},

	componentDidMount() {
		socket.on('init', this._initialize);
		socket.on('send:message', this._messageRecieve);
		socket.on('user:join', this._userJoined);
		socket.on('user:left', this._userLeft);
		socket.on('change:name', this._userChangedName);
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
		var data = {
			"word": message.text
		}

		fetch("http://localhost:3000/preprocess", {
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
					bot: true
				}
				that._messageRecieve(newMessage)
				queryMessage = data.result
			}
				
			socket.emit('send:message', message);
			
			// TODO: Fixed the autocorrect module
			//botQuery(queryMessage, that.state.sessionID).then(response => {
			botQuery(message.text, that.state.sessionID).then(response => {
				console.log("Context: " + response.Context)
				var m = {
					user : "Bot",
					text : response.Result,
					bot: true
				}
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
			<div>
				<MessageList
					messages={this.state.messages}
				/>
				<MessageForm
					onMessageSubmit={this.handleMessageSubmit}
					user={this.state.user}
				/>
				<ChangeNameForm
					onChangeName={this.handleChangeName}
				/>
			</div>
		);
	}
});

export default Chat;