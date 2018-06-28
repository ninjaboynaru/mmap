/**
* @class
* Generates and modifies grids for pathfinding use
*
* @param {[object]} nodes - A reference to an array of Node objects in the grid
* @param {number} width - Width of the grid/canvas (nodes located outside of this will cause an error)
* @param {number} height - Height of the grid/canvas (nodes located outside of this will cause an error)
* @param {number} scaleFactor - How much to scale the grid resolution down by in order to improve performance. Larger numbers and smaller grids result in less accuracy but better performance. Should be a number between 0 and 1.
*/
function Grid(nodes, width, height, scaleFactor=1) {
	this.nodes = nodes
	this.size = { width, height };
	this.scaleFactor = scaleFactor;
	this.internalGrid = [];
	this.nodesMoved = true;
}

Grid.prototype.scaleDown = function scaleDown(val, floor=true) {
	const newValue = val * this.scaleFactor;
	if(floor === true) {
		return Math.floor(newValue);
	}
	else {
		return Math.round(newValue);
	}
}

Grid.prototype.scaleUp = function scaleUp(val, floor=true) {
	const newValue = val / this.scaleFactor;
	if(floor === true) {
		return Math.floor(newValue);
	}
	else {
		return Math.round(newValue);
	}
}

Grid.prototype.buildBaseGrid = function buildBaseGrid() {
	this.internalGrid = [];
	for(let y = 0; y < this.scaleDown(this.size.height, false); y++) {
		const row = [];
		for(let x = 0; x < this.scaleDown(this.size.width, false); x++) {
			row.push(1);
		}
		this.internalGrid.push(row);
	}
}

Grid.prototype.setNodeBoundaries = function setNodeBoundaries() {
	for(const node of this.nodes) {
		const id = node.shapes.container.id;

		let xPos = this.scaleDown(node.position.x);
		let yPos = this.scaleDown(node.position.y);

		const size = {
			width: this.scaleDown(node.size.width),
			height: this.scaleDown(node.size.height)
		};

		if(xPos < 1) {
			// hack to fix nodes whose scaled down positions end up as negative numbers
			xPos = 0;
		}
		else if(xPos + size.width >= this.internalGrid[0].length) {
			// hack to fix nodes on the edge and moving into the canvas
			xPos = this.internalGrid[0].length - size.width - 1;
		}

		if(yPos < 1) {
			yPos = 0;
		}
		else if(yPos + size.height >= this.internalGrid.length) {
			yPos = this.internalGrid.length - size.height - 1;
		}

		// set boundaries for top and bottom side of the node
		for(let x = xPos; x <= xPos + size.width; x++) {
			this.internalGrid[yPos][x] = id;
			this.internalGrid[yPos + size.height][x] = id;
		}

		// set boundaries for left and right side of the node
		for(let y = yPos; y <= yPos + size.height; y++) {
			this.internalGrid[y][xPos] = id;
			this.internalGrid[y][xPos + size.width] = id;
		}
	}
}

Grid.prototype.getGrid = function getGrid() {
	if(this.nodesMoved === false) {
		return this.internalGrid;
	}

	this.buildBaseGrid();
	this.setNodeBoundaries();

	this.nodesMoved = false;
	return this.internalGrid;
}

Grid.prototype.setNodeMoved = function setNodeMoved() {
	this.nodeMoved = true;
}

export default Grid;
