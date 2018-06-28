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

	this.pathId;
	this.intervalId;
	this.nodeA;
	this.nodeB;

	this.easystar.enableDiagonals();
	this.easystar.enableCornerCutting();
	this.easystar.setIterationsPerCalculation(1500);

	window.setInterval(this.easystar.calculate, 10); // perform a batch of path calculations on some interval
}

Connection.prototype.clear = function clear() {
	this.line.graphics.clear();
}
Connection.prototype.beginStroke = function beginStroke() {
	this.clear();
	this.line.graphics.beginStroke('green').setStrokeStyle(4).moveTo(0, 0);
}
Connection.prototype.endStroke = function endStroke() {
	this.line.graphics.endStroke();
}

/**
* @function
* Make a direct connection to a point.
*/
Connection.prototype.directLineTo = function directLineTo(x, y) {
	const localTarget = this.line.globalToLocal(x, y);

	this.beginStroke();
	this.line.graphics.lineTo(localTarget.x, localTarget.y);
	this.endStroke();
}

/**
* @function
*
* Attempt to find a path to a point that avoids intersecting nodes.
* If no path can be found, a direct line to that point will be drawn instead.
*/
Connection.prototype.pathfindTo = function pathfindTo(x, y) {
	const globalStartPoint = this.line.localToGlobal(0, 0);

	globalStartPoint.x = this.grid.scaleDown(Math.floor(globalStartPoint.x));
	globalStartPoint.y = this.grid.scaleDown(Math.floor(globalStartPoint.y));
	x = this.grid.scaleDown(Math.floor(x));
	y = this.grid.scaleDown(Math.floor(y));

	const acceptableTiles = [1, this.nodeA.shapes.container.id];
	if(this.nodeB) {
		acceptableTiles.push(this.nodeB.shapes.container.id);
	}
	if(this.pathId) {
		this.easystar.cancelPath(this.pathId);
	}

	this.easystar.setGrid(this.grid.getGrid());
	this.easystar.setAcceptableTiles(acceptableTiles);

	this.pathId = this.easystar.findPath(globalStartPoint.x, globalStartPoint.y, x, y, (path) => {
		this.beginStroke();

		if(path === null) {
			this.directLineTo(this.grid.scaleUp(x), this.grid.scaleUp(y));
			console.warn(`Could not find connection path from x:${globalStartPoint.x}, y:${globalStartPoint.y} to x:${x}, y:${y}`)
			return;
		}

		for(const location of path) {
			const localTarget = this.line.globalToLocal(this.grid.scaleUp(location.x), this.grid.scaleUp(location.y));
			this.line.graphics.lineTo(localTarget.x, localTarget.y);
		}

		this.endStroke();
	});
}

/**
* @function
*
* Make a connection to a point.
* @param {boolean} pathfind - If true, will attempt to find a path to that point that avoids intersecting nodes.
*/
Connection.prototype.move = function move(x, y, pathfind=false) {
	if(pathfind === false) {
		this.directLineTo(x, y)
	}
	else {
		this.pathfindTo(x, y);
	}
}

/**
* @function
* Begin a connection at a node.
*/
Connection.prototype.start = function start(nodeA) {
	this.nodeA = nodeA;
	this.line.x = nodeA.shapes.container.x + nodeA.size.width/2;
	this.line.y = nodeA.shapes.container.y + nodeA.size.height/2;
}

/**
* @function
* End a connection at a node.
* @param {boolean} pathfind - If true, will attempt to find a path to the end node that avoids intersecting other nodes.
*/
Connection.prototype.end = function end(node, pathfind=true) {
	this.nodeB = node;
	const xPos = node.shapes.container.x + node.size.width/2;
	const yPos = node.shapes.container.y + node.size.height/2;
	this.move(xPos, yPos, pathfind);
}

/**
* @function
* Update a connection.
* @param {boolean} pathfind - If true, will attempt to find a connection path that avoids intersecting other nodes.
*/
Connection.prototype.update = function(pathfind=true) {
	this.start(this.nodeA);
	this.end(this.nodeB, pathfind);
}

export default Connection;
