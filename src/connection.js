const createjs = window.createjs;

function Connection() {
	this.line = new createjs.Shape();
	this.nodeA;
	this.nodeB;
}

Connection.prototype.start = function start(nodeA) {
	this.nodeA = nodeA;
	this.line.x = nodeA.shapes.container.x + nodeA.size.width/2;
	this.line.y = nodeA.shapes.container.y + nodeA.size.height/2;
}

Connection.prototype.move = function move(x, y) {
	const graphics = this.line.graphics;
	this.clear();

	graphics.beginStroke('green').setStrokeStyle(4).moveTo(0,0);

	const localTarget = this.line.globalToLocal(x,y);
	graphics.lineTo(localTarget.x, localTarget.y);
	graphics.endStroke();
}

Connection.prototype.end = function end(node) {
	this.nodeB = node;
	const xPos = node.shapes.container.x + node.size.width/2;
	const yPos = node.shapes.container.y + node.size.height/2;
	this.move(xPos, yPos);
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
