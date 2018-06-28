import EventEmitter from 'eventemitter3';
const Matter = window.Matter;

/**
* @class
* A MindMap node
*
* @param {string} text - Text content of the node.
* @param {number} x -  X position (from top left corner) of the node.
* @param {number} y - Y position (from top left corner) of the node.
* @param {boolean} center - If true, the node will be positioned relative to its center instead of its top left corner. Default is false
* @param {number} maxPosX - Optional maxium X position of the canvas. Prevents the node from spawning outside the canvas.
* @param {number} maxPosY - Optional maxium Y position of the canvas. Prevents the node from spawning outside the canvas.
*/
function Node(mindMap, text, x=0, y=0, center, maxPosX, maxPosY) {
	const createjs = window.createjs;
	const Matter = window.Matter;

	this.mindMap = mindMap
	this.connections = [];
	this.rigidbody = null;
	this.shapes = {
		container: null,
		background: null,
		text: null
	}
	this.padding = {
		x: 32,
		y:16
	};
	this.margin = {
		x: 6,
		y: 6
	}
	this.size = {
		width: -1,
		height: -1,
		widthNoMargin: -1,
		heightNoMargin: -1,
	}
	this.position = { // position in canvas space (origin at top left corner)
		x: -1,
		y: -1
	}
	this.lastRigidbodyPosition = { // position in physics space (origin at center)
		x: -1,
		y: -1
	}
	this.maxVelocty = {
		x: 5,
		y: 5
	}

	this.connectionActive = false;
	this.dragging = false;
	this.colliding = false;

	this.init(text, x, y, center, maxPosX, maxPosY);
}
Node.prototype = new EventEmitter();

Node.prototype.init = function init(text, x, y, center=false, maxPosX, maxPosY) {
	this.shapes.container = new createjs.Container();
	this.shapes.background = new createjs.Shape();
	this.shapes.text = new createjs.Text(text, '16px Arial');

	this.size.widthNoMargin = this.shapes.text.getMeasuredWidth() + (this.padding.x * 2);
	this.size.heightNoMargin = this.shapes.text.getMeasuredHeight() + (this.padding.y * 2);
	this.size.width = this.size.widthNoMargin + (this.margin.x * 2);
	this.size.height = this.size.heightNoMargin + (this.margin.y * 2);

	this.shapes.text.x = this.size.widthNoMargin/2 - this.shapes.text.getMeasuredWidth()/2;
	this.shapes.text.y = this.size.heightNoMargin/2 - this.shapes.text.getMeasuredHeight()/2;

	this.shapes.background.graphics
	.beginFill('white')
	.beginStroke('black')
	.drawRoundRect(0, 0, this.size.widthNoMargin, this.size.heightNoMargin, 4);

	if(center === true) {
		x = x - this.size.width/2;
		y = y - this.size.height/2;
	}

	// prevent node from spawning out of bounds
	if(x < 0) {
		x = 0;
	}
	if(y < 0) {
		y = 0;
	}

	if(maxPosX && x + this.size.width >= maxPosX) {
		x = maxPosX - this.size.width;
	}
	if(maxPosY && y + this.size.height >= maxPosY) {
		y = maxPosY - this.size.height;
	}


	const rigidbodyPosition = this.calcRigidbodyPos(x, y);

	this.shapes.container.x = x;
	this.shapes.container.y = y;
	this.rigidbody = Matter.Bodies.rectangle(
		rigidbodyPosition.x,
		rigidbodyPosition.y,
		this.size.width,
		this.size.height,
		{ frictionAir: 0.2 }
	);

	this.position = this.calcNodePos();
	this.shapes.container.addChild(this.shapes.background, this.shapes.text);

	this.shapes.container.on('mousedown', this.mouseDown.bind(this));
	this.shapes.container.on('mouseover', this.mouseOver.bind(this));
	this.shapes.container.on('mouseout', this.mouseOut.bind(this));
	this.shapes.container.on('pressmove', this.pressMove.bind(this));
	this.shapes.container.on('pressup', this.pressUp.bind(this));

	Matter.Events.on(this.rigidbody, 'collisionActive', this.collisionActive.bind(this));
	Matter.Events.on(this.rigidbody, 'collisionEnd', this.collisionEnd.bind(this));
}

/**
* @function
* Calculate the current global position (top left corner) of the node with its margins included
*/
Node.prototype.calcNodePos = function calcPosition() {
	return {
		x: this.rigidbody.position.x - this.size.width/2,
		y: this.rigidbody.position.y - this.size.height/2
	}
}

/**
* @function
* Calculate the correct position (top left corner) of the nodes' container, based on a position in physics space.
* rigidbody/physics position is relative to center - canvas/shape position is relative to top-left corner
*
* @param {boolean} withMargins - If true, will add the nodes' current margins to the position.
* @returns {object} An object with structure {x: number, y: number}. x and y are coridantes in canvas space.
*/
Node.prototype.calcShapePos = function calcShapePos(x, y, withMargins=true) {
	if(withMargins === true) {
		x += this.margin.x;
		y += this.margin.y;
	}

	return {
		x: x - this.size.width/2,
		y: y - this.size.height/2,
	}
}

/**
* @function
* Calculate the correct position (center) of the nodes' rigidbody based on a position in canvas space.
* rigidbody/physics position is relative to center - canvas/shape position is relative to top-left corner
*
* @returns {object} An object with structure {x: number, y: number}. x and y are coridantes in physics space.
*/
Node.prototype.calcRigidbodyPos = function calcRigidbodyPos(x, y) {
	return {
		x: x + this.size.width/2,
		y: y + this.size.height/2
	}
}

Node.prototype.didMove = function didMove() {
		if(Math.floor(this.rigidbody.position.x) !== Math.floor(this.lastRigidbodyPosition.x)) {
			return true;
		}
		else if(Math.floor(this.rigidbody.position.y) !== Math.floor(this.lastRigidbodyPosition.y)) {
			return true;
		}

		return false;
}


Node.prototype.updateConnections = function updateConnections(pathfind=true) {
	for(const connection of this.connections) {
		connection.update(pathfind);
	}
}

/**
* @function
* To be called on every physics tick by the MindMap object that this node belongs to.
*/
Node.prototype.tick = function tick() {
	const didMove = this.didMove();
	let connectionsUpdated = false;
	if(this.dragging) {
		// update connections while beaing draged
		this.updateConnections(false);
		connectionsUpdated = true;
	}
	else if(this.colliding === true && didMove === true) {
		// update connections if a collision caused movement
		this.updateConnections(false);
		this.connectionsUpdated = true;
	}

	if(didMove === false && connectionsUpdated === false) {
		return;
	}


	const shapePosition = this.calcShapePos(this.rigidbody.position.x, this.rigidbody.position.y, true);
	this.shapes.container.x = shapePosition.x;
	this.shapes.container.y = shapePosition.y;

	this.position = this.calcNodePos();

	this.lastRigidbodyPosition.x = this.rigidbody.position.x;
	this.lastRigidbodyPosition.y = this.rigidbody.position.y;
	this.emit('nodeMoved', this);
}

/**
* @function
* Move a node to a position in canvas space. The top left corner of the node will be at the position.
* @param {boolean=} center - If true, will center the node on the position.
*/
Node.prototype.move = function move(x, y, center=false) {
	if(center === true) {
		x -= this.size.width/2;
		y -= this.size.height/2;
	}

	Matter.Body.setPosition(this.rigidbody, this.calcRigidbodyPos(x, y));
}

Node.prototype.mouseDown = function mouseDown(event) {
	if(event.nativeEvent.ctrlKey === true) {
		this.connectionActive = true;
		this.emit('nodeClick', this);
	}
}
Node.prototype.mouseOver = function mouseOver(event) {
	this.emit('nodeMouseEnter', this);
}
Node.prototype.mouseOut = function mouseOut(event) {
	this.emit('nodeMouseExit', this);
}
Node.prototype.pressMove = function pressMove(event) {
	if(this.connectionActive === true) {
		this.emit('nodeConnectionDrag', this, event.stageX, event.stageY);
	}
	else {
		this.emit('nodeDrag');
		this.move(event.stageX, event.stageY, true);
		this.shapes.text.alpha = 0.5;
		this.dragging = true;
	}
}
Node.prototype.pressUp = function pressUp(event) {
	this.shapes.text.alpha = 1;
	this.dragging = false;
	this.emit('nodeUp', this);

	if(this.connectionActive) {
		this.connectionActive = false;
	}
}

Node.prototype.collisionActive = function collisionActive() {
	this.colliding = true;
}
Node.prototype.collisionStart = function collisionStart() {
	this.colliding = true;
}

Node.prototype.collisionEnd = function collisionEnd() {
	this.colliding = false;
}

export default Node;
