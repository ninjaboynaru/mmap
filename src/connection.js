const createjs = window.createjs;

/**
* @class
* An instance of a single connection
* @param {object} easystar - An instance of an easystar pathfinding object
*/
function Connection(easystar) {
	this.easystar = easystar;
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
	const globalStartPoint = this.line.localToGlobal(0,0);

	globalStartPoint.x = Math.floor(globalStartPoint.x);
	globalStartPoint.y = Math.floor(globalStartPoint.y);
	x = Math.floor(x);
	y = Math.floor(y);

	this.easystar.findPath(globalStartPoint.x, globalStartPoint.y, x, y, (path) => {
		const graphics = this.line.graphics;
		this.clear();
		graphics.beginStroke('green').setStrokeStyle(4).moveTo(0,0);
		graphics.moveTo(0,0);

		if(path === null) {
			console.error(`No path could be found from start point ${globalStartPoint} to end point x:${x}, y:${y}`);
			return;
		}

		for(const location of path) {
			const localTarget = this.line.globalToLocal(location.x, location.y);
			graphics.lineTo(localTarget.x, localTarget.y);
		}

		graphics.endStroke();
	});

	this.easystar.calculate();
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
