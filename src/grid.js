/**
* @class
* Generates and modifies grids for pathfinding use
* @param {object} mindMap - A reference to a MindMap instance
*/
function Grid(mindMap) {
	this.mindMap = mindMap
	this.nodes = mindMap.nodes;
	this.internalGrid = [];
	this.nodeMoved = true;
}

Grid.prototype.buildBaseGrid = function buildBaseGrid() {
	this.internalGrid = [];
	for(let y = 0; y < this.mindMap.stage.canvas.height; y++) {
		const row = [];
		for(let x = 0; x < this.mindMap.stage.canvas.width; x++) {
			row.push(1);
		}
		this.internalGrid.push(row);
	}
}

Grid.prototype.setNodeBoundaries = function setNodeBoundaries() {
	for(const node of this.mindMap.nodes) {
		const container = node.shapes.container;
		const id = container.id;

		const xPos = Math.round(container.x);
		const yPos = Math.round(container.y);
		const size = {
			width: Math.round(node.size.width),
			height: Math.round(node.size.height)
		};

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
	if(this.nodeMoved === false) {
		return this.internalGrid;
	}

	this.buildBaseGrid();
	this.setNodeBoundaries();
	
	this.nodeMoved = false;
	return this.internalGrid;
}

Grid.prototype.setNodeMoved = function setNodeMoved() {
	this.nodeMoved = true;
}

export default Grid;
