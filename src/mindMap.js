import EventEmitter from 'eventemitter3';
import Node from './node.js';
import Connection from './connection.js';
import Grid from './grid.js';

const createjs = window.createjs;
const Matter = window.Matter;

function randomId() {
	return Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 3);
}

/**
* @class
* Mind map application
*
* @param {string} canvasId - Id of the HTML canvas object to run the MindMap on
* @param {number} gridResolution - Resolution of the pathfinding grid. Canvases with a size greater than 500x500 should
* have a grid resolution of less than 1. (to decrease the grid size - more performance at cost of less accuracy
*/
function MindMap(canvasId = 'js-mindmap-canvas', gridResolution = 1) {
	this.stage = new createjs.Stage(canvasId);
	this.engine = Matter.Engine.create();

	this.nodeContainer = new createjs.Container();
	this.connectionContainer = new createjs.Container();

	if(!this.stage.canvas) {
		throw new Error(`MindMap unable to initialize because canvas element with id ${canvasId} could not be found`);
	}

	this.nodes = [];
	this.grid = new Grid(this.nodes, this.stage.canvas.width, this.stage.canvas.height, gridResolution);
	this.boundaries = {
		top: null,
		buttom: null,
		left: null,
		right: null
	}

	this.pendingConnection = {
		startNode: null,
		endNode: null,
		connection: null
	}

	this.settings = {
		mouseOverFrequency: 1000
	};

	this.init();
}
MindMap.prototype = new EventEmitter();

MindMap.prototype.init = function init() {
	this.engine.world.gravity.y = 0;
	Matter.Engine.run(this.engine);

	this.stage.addChild(this.connectionContainer, this.nodeContainer);
	this.stage.enableDOMEvents(true);
	this.stage.enableMouseOver(this.mouseOverFrequency);

	const rootNode = this.createNode(this, 'Root', 1, 1, false, this.stage.canvas.width, this.stage.canvas.height);
	this.nodes.push(rootNode);

	const boundarySize = 60;
	const boundaryMargin = 0;

	this.boundaries.top = new Matter.Bodies.rectangle(
		this.stage.canvas.width/2,
		(0 - (boundarySize/2)) + boundaryMargin,
		this.stage.canvas.width,
		boundarySize,
		{ isStatic: true }
	);
	this.boundaries.bottom = new Matter.Bodies.rectangle(
		this.stage.canvas.width/2,
		(this.stage.canvas.height + (boundarySize/2)) - boundaryMargin,
		this.stage.canvas.width,
		boundarySize,
		{ isStatic: true }
	);
	this.boundaries.left = new Matter.Bodies.rectangle(
		(0 - (boundarySize/2)) + boundaryMargin,
		this.stage.canvas.height/2,
		boundarySize,
		this.stage.canvas.height,
		{ isStatic: true }
	);
	this.boundaries.right = new Matter.Bodies.rectangle(
		(this.stage.canvas.width + (boundarySize/2)) - boundaryMargin,
		this.stage.canvas.height/2,
		boundarySize,
		this.stage.canvas.height,
		{ isStatic: true }
	);

	Matter.World.add(this.engine.world, this.boundaries.top);
	Matter.World.add(this.engine.world, this.boundaries.bottom);
	Matter.World.add(this.engine.world, this.boundaries.left);
	Matter.World.add(this.engine.world, this.boundaries.right);

	Matter.Events.on(this.engine, 'afterUpdate', this.onTick.bind(this));
	Matter.Events.on(this.engine, 'collisionActive', this.collisionActive);
	Matter.Events.on(this.engine, 'collisionStart', this.collisionStart);
	Matter.Events.on(this.engine, 'collisionEnd', this.collisionEnd);
	this.stage.on('stagemousedown', this.onClick.bind(this));
}

MindMap.prototype.onTick = function onUpdate() {
	this.stage.update();
	for(const node of this.nodes) {
		node.tick();
	}
}

MindMap.prototype.createNode = function(...args) {
	const newNode = new Node(...args);
	this.nodes.push(newNode);
	this.nodeContainer.addChild(newNode.shapes.container);
	Matter.World.add(this.engine.world, newNode.rigidbody);

	newNode.on('nodeMoved', this.onNodeMoved, this);
	newNode.on('nodeClick', this.onNodeClick, this);
	newNode.on('nodeMouseEnter', this.onNodeMouseEnter, this);
	newNode.on('nodeMouseExit', this.onNodeMouseExit, this);
	newNode.on('nodeConnectionDrag', this.onNodeConnectionDrag, this);
	newNode.on('nodeUp', this.onNodeUp, this);

	this.grid.nodesMoved = true;
	setTimeout(() => {
		// give the nodes enough time to resolve their position if they are created inside of another body
		// (nodes created inside or partialy inside of another body may not detect the collision and will not update their connections on their own)
		for(const node of this.nodes) {
			node.updateConnections();
		}
	}, 200);

	return newNode;
}

MindMap.prototype.onClick = function onClick(event) {
	if(event.relatedTarget) {
		return;
	}

	this.nodes.push(this.createNode(this, randomId(), event.stageX, event.stageY, true, this.stage.canvas.width, this.stage.canvas.height) );
}


MindMap.prototype.collisionActive = function collisionActive(event) {
	for(const pair of event.pairs) {
		Matter.Events.trigger(pair.bodyA, 'collisionActive');
		Matter.Events.trigger(pair.bodyB, 'collisionActive');
	}
}

MindMap.prototype.collisionStart = function collisionStart(event) {
	for(const pair of event.pairs) {
		Matter.Events.trigger(pair.bodyA, 'collisionStart');
		Matter.Events.trigger(pair.bodyB, 'collisionStart');
	}
}

MindMap.prototype.collisionEnd = function collisionEnd(event) {
	for(const pair of event.pairs) {
		Matter.Events.trigger(pair.bodyA, 'collisionEnd');
		Matter.Events.trigger(pair.bodyB, 'collisionEnd');
	}
}


MindMap.prototype.onNodeMoved = function onNodeMoved() {
	this.grid.nodesMoved = true;
}

MindMap.prototype.onNodeClick = function onNodeClick(node) {
	const newConnection = new Connection(this.grid);
	this.connectionContainer.addChild(newConnection.line);
	newConnection.start(node);

	this.pendingConnection.startNode = node;
	this.pendingConnection.connection = newConnection;
}

MindMap.prototype.onNodeConnectionDrag = function onNodeConnectionDrag(node, x, y) {
	if(this.pendingConnection.endNode) {
		return;
	}

	this.pendingConnection.connection.move(x, y);
}

MindMap.prototype.onNodeMouseEnter = function onNodeMouseEnter(node) {
	if(!this.pendingConnection.startNode || this.pendingConnection.startNode === node) {
		return;
	}

	this.pendingConnection.endNode = node;
	this.pendingConnection.connection.end(node, true);
}

MindMap.prototype.onNodeMouseExit = function onNodeMouseExit(node) {
	if(node === this.pendingConnection.endNode) {
		this.pendingConnection.endNode = null;
	}
}

MindMap.prototype.onNodeUp = function nodeUp() {
	for(const node of this.nodes) {
		node.updateConnections(true);
	}

	if(!this.pendingConnection.connection) {
		return;
	}

	if(this.pendingConnection.startNode && this.pendingConnection.endNode) {
		this.pendingConnection.startNode.connections.push(this.pendingConnection.connection);
		this.pendingConnection.endNode.connections.push(this.pendingConnection.connection);
	}
	else {
		this.pendingConnection.connection.clear();
		this.connectionContainer.removeChild(this.pendingConnection.connection.line);
	}

	this.pendingConnection.startNode = null;
	this.pendingConnection.endNode = null;
	this.pendingConnection.connection = null;
}


export default MindMap;
