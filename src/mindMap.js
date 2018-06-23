import Node from './node.js';
import Connection from './connection.js';

function randomId() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function MindMap(canvasId = 'js-mindmap-canvas') {
	const createjs = window.createjs;
	const Matter = window.Matter;

	this.stage = new createjs.Stage(canvasId);
	this.connectionContainer = new createjs.Container();
	this.nodeContainer = new createjs.Container();
	this.nodes = [];
	this.updateInterval = 1;
	this.mouseOverFrequency = 100;
	this.updateIntervalId = null;
	this.pendingConnection = {
		startNode: null,
		endNode: null,
		connection: null
	}


	this.engine = Matter.Engine.create();
	this.engine.world.gravity.y = 0;
	Matter.Engine.run(this.engine);


	this.nodeContainer.x = 0;
	this.nodeContainer.y = 0;

	const rootNode = new Node(this, 'Root', 0, 0);
	this.nodes.push(rootNode);
	rootNode.container.x = this.stage.canvas.width/2 - rootNode.width/2;
	rootNode.container.y = this.stage.canvas.height/2 - rootNode.height/2;

	this.stage.addChild(this.connectionContainer, this.nodeContainer);
	this.stage.enableDOMEvents(true);
	this.stage.enableMouseOver(this.mouseOverFrequency);

	// const Matter = window.Matter;
	// const engine = Matter.Engine.create();
	// const renderer = Matter.Render.create({
	// 	canvas: this.stage.canvas,
	// 	engine,
	// });
	//
	// const boxA = Matter.Bodies.rectangle(80,80, 80, 80);
	// const boxB = Matter.Bodies.rectangle(120, 200, 80, 80);
	// const ground = Matter.Bodies.rectangle(0, 300, 1000, 10, { isStatic: true });
	//
	// Matter.World.add(engine.world, [boxA, boxB, ground]);
	// Matter.Engine.run(engine);
	// // Matter.Render.run(renderer);


	this.updateIntervalId = window.setInterval(() => {
		this.stage.update();
	}, this.updateInterval);

	this.stage.on('stagemousedown', (event) => {
		if(event.relatedTarget) {
			return;
		}

		this.nodes.push(new Node(this, randomId(), event.stageX, event.stageY, true) );
	});
}

MindMap.prototype.connectionStart = function startConnection(node) {
	const newConnection = new Connection(this.connectionContainer);
	newConnection.start(node);

	this.pendingConnection.startNode = node;
	this.pendingConnection.connection = newConnection;
}
MindMap.prototype.connectionUpdate = function connectionUpdate(x, y) {
	if(this.pendingConnection.endNode) {
		return;
	}

	this.pendingConnection.connection.move(x, y);
}
MindMap.prototype.nodeEnter = function nodeEnter(node) {
	if(!this.pendingConnection.startNode || this.pendingConnection.startNode === node) {
		return;
	}

	this.pendingConnection.endNode = node;
	this.pendingConnection.connection.end(node);
}
MindMap.prototype.nodeExit = function nodeExit(node) {
	if(node === this.pendingConnection.endNode) {
		this.pendingConnection.endNode = null;
	}
}
MindMap.prototype.nodeUp = function nodeUp() {
	if(!this.pendingConnection.connection) {
		return;
	}

	if(this.pendingConnection.startNode && this.pendingConnection.endNode) {
		this.pendingConnection.startNode.connections.push(this.pendingConnection.connection);
		this.pendingConnection.endNode.connections.push(this.pendingConnection.connection);
	}
	else {
		this.pendingConnection.connection.clear();
	}

	this.pendingConnection.startNode = null;
	this.pendingConnection.endNode = null;
	this.pendingConnection.connection = null;
}

export default MindMap;
