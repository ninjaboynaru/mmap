const Matter = window.Matter;

function Node(mindMap, text, x=0, y=0, center) {
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
	this.size = {
		width: null,
		height: null
	}
	this.previousPosition = {
		x: -1,
		y: -1
	}

	this.connectionActive = false;
	this.dragging = false;

	this.init(text, x, y, center);
}

Node.prototype.init = function init(text, x, y, center=false) {
	this.shapes.container = new createjs.Container();
	this.shapes.background = new createjs.Shape();
	this.shapes.text = new createjs.Text(text, '16px Arial');

	this.size.width = this.shapes.text.getMeasuredWidth() + (this.padding.x * 2);
	this.size.height = this.shapes.text.getMeasuredHeight() + (this.padding.y * 2);

	this.shapes.text.x = this.size.width/2 - this.shapes.text.getMeasuredWidth()/2;
	this.shapes.text.y = this.size.height/2 - this.shapes.text.getMeasuredHeight()/2;

	this.shapes.background.graphics
	.beginFill('white')
	.beginStroke('black')
	.drawRoundRect(0, 0, this.size.width, this.size.height, 4);

	if(center === true) {
		x = x - this.size.width/2;
		y = y - this.size.height/2;
	}


	const rigidbodyPosition = this.calcRigidbodyPos(x, y);

	this.shapes.container.x = x;
	this.shapes.container.y = y;
	this.rigidbody = Matter.Bodies.rectangle(
		rigidbodyPosition.x,
		rigidbodyPosition.y,
		this.size.width,
		this.size.height,
		{frictionAir: 0.2}
	);

	this.shapes.container.addChild(this.shapes.background, this.shapes.text);

	this.shapes.container.on('mousedown', this.mouseDown.bind(this));
	this.shapes.container.on('mouseover', this.mouseOver.bind(this));
	this.shapes.container.on('mouseout', this.mouseOut.bind(this));
	this.shapes.container.on('pressmove', this.pressMove.bind(this));
	this.shapes.container.on('pressup', this.pressUp.bind(this));
	Matter.Events.on(this.mindMap.engine, 'afterUpdate', this.physicsUpdate.bind(this));
}


/**
* @function
* @public
* Calculate the correct position of a shape based on coordinates in physics space.
* rigidbody/physics position is relative to center - canvas/shape position is relative to top-left corner
*
* @returns {object} An object with structure {x: number, y: number}. x and y are coridantes in canvas space.
*/
Node.prototype.calcShapePos = function calcShapePos(x, y) {
	return {
		x: x - this.size.width/2,
		y: y - this.size.height/2,
	}
}

/**
* @function
* @public
* Calculate the correct position of a rigidbody based on coordinates in canvas space.
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
		if(Math.floor(this.rigidbody.position.x) !== Math.floor(this.previousPosition.x)) {
			return true;
		}
		else if(Math.floor(this.rigidbody.position.y) !== Math.floor(this.previousPosition.y)) {
			return true;
		}

		return false;
}

Node.prototype.physicsUpdate = function physicsUpdate() {
	if(this.didMove() === false) {
		return;
	}

	const shapePosition = this.calcShapePos(this.rigidbody.position.x, this.rigidbody.position.y);
	this.shapes.container.x = shapePosition.x;
	this.shapes.container.y = shapePosition.y;
	this.connections.forEach((connection)=>connection.update());

	this.previousPosition.x = this.rigidbody.position.x;
	this.previousPosition.y = this.rigidbody.position.y;
}

/**
* @function
* @public
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
		this.mindMap.connectionManager.nodeDown(this);
	}
}
Node.prototype.mouseOver = function mouseOver(event) {
	this.mindMap.connectionManager.nodeEnter(this);
}
Node.prototype.mouseOut = function mouseOut(event) {
	this.mindMap.connectionManager.nodeExit(this);
}
Node.prototype.pressMove = function pressMove(event) {
	if(this.connectionActive === true) {
		this.mindMap.connectionManager.nodeMove(event.stageX, event.stageY);
	}
	else {
		this.move(event.stageX, event.stageY, true);
		this.shapes.text.alpha = 0.5;
		this.dragging = true;
	}
}
Node.prototype.pressUp = function pressUp(event) {
	this.shapes.text.alpha = 1;
	this.dragging = false;

	if(this.connectionActive) {
		this.connectionActive = false;
		this.mindMap.connectionManager.nodeUp();
	}
}

export default Node;
