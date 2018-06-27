import Easystar from 'easystarjs';
const createjs = window.createjs;

/**
* @class
* An instance of a single connection
* @param {object} grid - An instance of a Grid object
*/
function Connection(grid) {
	this.grid = grid;
	this.line = new createjs.Shape();
	this.easystar = new Easystar.js();
	this.previousPathId;
	this.nodeA;
	this.nodeB;

	this.easystar.enableDiagonals();
	this.easystar.enableCornerCutting();
	this.easystar.setIterationsPerCalculation(500);
	setInterval(this.easystar.calculate, 0);
}

Connection.prototype.start = function start(nodeA) {
	this.nodeA = nodeA;
	this.line.x = nodeA.shapes.container.x + nodeA.size.width/2;
	this.line.y = nodeA.shapes.container.y + nodeA.size.height/2;
}

Connection.prototype.move = function move(x, y, pathfind=false) {
	const globalStartPoint = this.line.localToGlobal(0,0);
	const graphics = this.line.graphics;

	globalStartPoint.x = Math.floor(globalStartPoint.x);
	globalStartPoint.y = Math.floor(globalStartPoint.y);
	x = Math.floor(x);
	y = Math.floor(y);

	if(pathfind === false) {
		this.clear();
		graphics.beginStroke('green').setStrokeStyle(4).moveTo(0,0);

		const localTarget = this.line.globalToLocal(x, y);
		graphics.lineTo(localTarget.x, localTarget.y);
		graphics.endStroke();
	}
	else {
		const acceptableTiles = [1, this.nodeA.shapes.container.id];
		if(this.nodeB) {
			acceptableTiles.push(this.nodeB.shapes.container.id);
		}
		if(this.previousPathId) {
			this.easystar.cancelPath(this.previousPathId);
		}

		this.easystar.setGrid(this.grid.getGrid());
		this.easystar.setAcceptableTiles(acceptableTiles);

		this.previousPathId = this.easystar.findPath(globalStartPoint.x, globalStartPoint.y, x, y, (path) => {
			this.clear();
			graphics.beginStroke('green').setStrokeStyle(4).moveTo(0,0);

			if(path === null) {
				return;
			}

			for(const location of path) {
				const localTarget = this.line.globalToLocal(location.x, location.y);
				graphics.lineTo(localTarget.x, localTarget.y);
			}

			graphics.endStroke();
		});
	}
}

Connection.prototype.end = function end(node, pathfind=true) {
	this.nodeB = node;
	const xPos = node.shapes.container.x + node.size.width/2;
	const yPos = node.shapes.container.y + node.size.height/2;
	this.move(xPos, yPos, pathfind);
}

Connection.prototype.update = function(pathfind=true) {
	this.start(this.nodeA);
	this.end(this.nodeB, pathfind);
}
Connection.prototype.clear = function clear() {
	this.line.graphics.clear();
}

export default Connection;
