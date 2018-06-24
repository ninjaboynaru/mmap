import Connection from './connection.js';
const createjs = window.createjs;

function ConnectionManager() {
	this.container = new createjs.Container();
	this.pendingConnection = {
		startNode: null,
		endNode: null,
		connection: null
	}
}

ConnectionManager.prototype.nodeDown = function nodeDown(node) {
	const newConnection = new Connection();
	this.container.addChild(newConnection.line);
	newConnection.start(node);

	this.pendingConnection.startNode = node;
	this.pendingConnection.connection = newConnection;
}

ConnectionManager.prototype.nodeMove = function nodeMove(x, y) {
	if(this.pendingConnection.endNode) {
		return;
	}

	this.pendingConnection.connection.move(x, y);
}

ConnectionManager.prototype.nodeEnter = function nodeEnter(node) {
	if(!this.pendingConnection.startNode || this.pendingConnection.startNode === node) {
		return;
	}

	this.pendingConnection.endNode = node;
	this.pendingConnection.connection.end(node);
}

ConnectionManager.prototype.nodeExit = function nodeExit(node) {
	if(node === this.pendingConnection.endNode) {
		this.pendingConnection.endNode = null;
	}
}

ConnectionManager.prototype.nodeUp = function nodeUp() {
	if(!this.pendingConnection.connection) {
		return;
	}

	if(this.pendingConnection.startNode && this.pendingConnection.endNode) {
		this.pendingConnection.startNode.connections.push(this.pendingConnection.connection);
		this.pendingConnection.endNode.connections.push(this.pendingConnection.connection);
	}
	else {
		this.pendingConnection.connection.clear();
		this.container.removeChild(this.pendingConnection.connection.line);
	}

	this.pendingConnection.startNode = null;
	this.pendingConnection.endNode = null;
	this.pendingConnection.connection = null;
}

export default ConnectionManager;
