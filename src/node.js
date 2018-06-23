function Node(mindMap, text, x=0, y=0, center=false, connections=[]) {
	const createjs = window.createjs;
	const Matter = window.Matter;

	this.mindMap = mindMap
	this.container = new createjs.Container();
	this.background = new createjs.Shape();
	this.text = new createjs.Text(text, '16px Arial');
	this.physicsBody = null;
	this.connections = [...connections];
	this.connectionActive = false;
	this.moving = false;

	const padding = {x: 32, y: 16};
	this.width = this.text.getMeasuredWidth() + (padding.x * 2);
	this.height = this.text.getMeasuredHeight() + (padding.y * 2);

	this.text.x = this.width/2 - this.text.getMeasuredWidth()/2;
	this.text.y = this.height/2 - this.text.getMeasuredHeight()/2;
	this.background.graphics.beginFill('white').beginStroke('black').drawRoundRect(0, 0, this.width, this.height, 4);

	if(center === true) {
		this.container.x = x - this.width/2;
		this.container.y = y - this.height/2;
	}
	else {
		this.container.x = x;
		this.container.y = y;
	}

	const xPos = this.container.x + this.width/2;
	const yPos = this.container.y + this.height/2;
	this.physicsBody = Matter.Bodies.rectangle(xPos, yPos, this.width, this.height, {frictionAir: 0.2});
	Matter.World.add(this.mindMap.engine.world, this.physicsBody);

	this.container.addChild(this.background, this.text);
	this.mindMap.nodeContainer.addChild(this.container);

	this.container.on('mousedown', this.mouseDown.bind(this));
	this.container.on('mouseover', this.mouseOver.bind(this));
	this.container.on('mouseout', this.mouseOut.bind(this));
	this.container.on('pressmove', this.pressMove.bind(this));
	this.container.on('pressup', this.pressUp.bind(this));
	Matter.Events.on(this.mindMap.engine, 'afterUpdate', this.physicsUpdate.bind(this));
}

Node.prototype.physicsUpdate = function physicsUpdate() {
	const physicsPosition = this.physicsBody.position;
	this.connections.forEach((connection)=>connection.update());

	if(this.moving === false) {
		this.container.x = physicsPosition.x - this.width/2;
		this.container.y = physicsPosition.y - this.height/2;
	}
	else {
		let pos = {
			x: this.container.x + this.width/2,
			y: this.container.y + this.height/2
		};
		Matter.Body.setPosition(this.physicsBody, pos);
	}
}

Node.prototype.move = function move(x, y, center=false) {
	this.moving = true;
	window.Matter.Body.setStatic(this.physicsBody, false);

	let xPos = x;
	let yPos = y;

	if(center === true) {
		xPos -= this.width/2;
		yPos -= this.height/2;
	}

	this.container.x = xPos;
	this.container.y = yPos;

	for(const connection of this.connections) {
		connection.update();
	}
}



Node.prototype.mouseDown = function mouseDown(event) {
	if(event.nativeEvent.ctrlKey === true) {
		this.connectionActive = true;
		this.mindMap.connectionStart(this);
	}
}
Node.prototype.mouseOver = function mouseOver(event) {
	this.mindMap.nodeEnter(this);
}
Node.prototype.mouseOut = function mouseOut(event) {
	this.mindMap.nodeExit(this);
}
Node.prototype.pressMove = function pressMove(event) {
	if(this.connectionActive === true) {
		this.mindMap.connectionUpdate(event.stageX, event.stageY);
	}
	else {
		this.move(event.stageX, event.stageY, true);
		this.text.alpha = 0.5;
	}
}
Node.prototype.pressUp = function pressUp(event) {
	this.text.alpha = 1;
	this.moving = false;
	window.Matter.Body.setStatic(this.physicsBody, false);

	if(this.connectionActive) {
		this.connectionActive = false;
		this.mindMap.nodeUp();
	}
}



export default Node;
