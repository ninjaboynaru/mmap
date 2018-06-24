import Node from './node.js';
import ConnectionManager from './connectionManager.js';

const createjs = window.createjs;
const Matter = window.Matter;

function randomId() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function MindMap(canvasId = 'js-mindmap-canvas') {
	this.stage = new createjs.Stage(canvasId);
	this.engine = Matter.Engine.create();
	this.connectionManager = new ConnectionManager();
	this.nodeContainer = new createjs.Container();
	this.nodes = [];

	this.settings = {
		mouseOverFrequency: 100
	};

	this.init();
}

MindMap.prototype.init = function init() {
	this.engine.world.gravity.y = 0;
	Matter.Engine.run(this.engine);

	this.stage.addChild(this.connectionManager.container, this.nodeContainer);
	this.stage.enableDOMEvents(true);
	this.stage.enableMouseOver(this.mouseOverFrequency);

	const rootNode = this.createNode(this, 'Root', 0, 0);
	this.nodes.push(rootNode);
	rootNode.shapes.container.x = this.stage.canvas.width/2 - rootNode.size.width/2;
	rootNode.shapes.container.y = this.stage.canvas.height/2 - rootNode.size.height/2;

	Matter.Events.on(this.engine, 'afterUpdate', () => this.stage.update());
	this.stage.on('stagemousedown', this.onClick.bind(this));
}

MindMap.prototype.createNode = function(...args) {
	const newNode = new Node(...args);
	this.nodes.push(newNode);
	this.nodeContainer.addChild(newNode.shapes.container);
	Matter.World.add(this.engine.world, newNode.rigidbody);

	return newNode;
}

MindMap.prototype.onClick = function onClick(event) {
	if(event.relatedTarget) {
		return;
	}

	this.nodes.push(this.createNode(this, randomId(), event.stageX, event.stageY, true) );
}

export default MindMap;
