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
		this.shapes.container.x = x - this.size.width/2;
		this.shapes.container.y = y - this.size.height/2;
	}
	else {
		this.shapes.container.x = x;
		this.shapes.container.y = y;
	}

	const bodyPos = this.calcRigidbodyPos();
	this.rigidbody = Matter.Bodies.rectangle(bodyPos.x, bodyPos.y, this.size.width, this.size.height, {frictionAir: 0.2});

	this.shapes.container.addChild(this.shapes.background, this.shapes.text);
	this.mindMap.nodeContainer.addChild(this.shapes.container);

	this.shapes.container.on('mousedown', this.mouseDown.bind(this));
	this.shapes.container.on('mouseover', this.mouseOver.bind(this));
	this.shapes.container.on('mouseout', this.mouseOut.bind(this));
	this.shapes.container.on('pressmove', this.pressMove.bind(this));
	this.shapes.container.on('pressup', this.pressUp.bind(this));
	Matter.Events.on(this.mindMap.engine, 'afterUpdate', this.physicsUpdate.bind(this));
}


Node.prototype.calcShapePos = function calcShapePos() {
	return {
		x: this.rigidbody.position.x - this.size.width/2,
		y: this.rigidbody.position.y - this.size.height/2,
	}
}
Node.prototype.calcRigidbodyPos = function calcRigidbodyPos() {
	return {
		x: this.shapes.container.x + this.size.width/2,
		y: this.shapes.container.y + this.size.height/2
	}
}

Node.prototype.physicsUpdate = function physicsUpdate() {
	const shapePos = this.calcShapePos();
	this.shapes.container.x = shapePos.x;
	this.shapes.container.y = shapePos.y;
	this.connections.forEach((connection)=>connection.update());
}

Node.prototype.move = function move(x, y, center=false) {
	let xPos = x;
	let yPos = y;

	if(center === true) {
		xPos -= this.size.width/2;
		yPos -= this.size.height/2;
	}

	this.shapes.container.x = xPos;
	this.shapes.container.y = yPos;
	Matter.Body.setPosition(this.rigidbody, this.calcRigidbodyPos());
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
