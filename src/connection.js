function Connection(stage) {
	this.stage = stage;
	this.nodeA;
	this.nodeB;
	this.line;
}
Connection.prototype.start = function start(nodeA) {
	const createjs = window.createjs;

	this.nodeA = nodeA;
	this.line = new createjs.Shape();
	this.line.x = nodeA.container.x + nodeA.width/2;
	this.line.y = nodeA.container.y + nodeA.height/2;
	this.stage.addChild(this.line);
}

Connection.prototype.move = function move(x, y) {
	const graphics = this.line.graphics;
	this.line.graphics.clear();

	graphics.beginStroke('green').setStrokeStyle(4).moveTo(0,0);

	const localTarget = this.line.globalToLocal(x,y);
	graphics.lineTo(localTarget.x, localTarget.y);
	graphics.endStroke();
}

Connection.prototype.end = function end(node) {
	this.nodeB = node;
	this.move(node.container.x, node.container.y);
}

Connection.prototype.update = function() {
	this.clear();
	this.start(this.nodeA);
	this.end(this.nodeB);
}
Connection.prototype.clear = function clear() {
	this.line.graphics.clear();
}

export default Connection;
