const path = require('path');

let mode;
let devtool;
if(process.env.NODE_ENV === 'production') {
	console.log('Webpack building for production');
	mode = 'production';
	devtool = 'eval-source-map';
}
else {
	console.log('Webpack building for development');
	mode = 'development';
	devtool = 'eval-source-map';
}

module.exports = {
	mode,
	devtool,
	entry: path.join(__dirname, '/src/index.js'),
	output: {
		path: path.join(__dirname, '/dist'),
		filename: 'mindmap.js',
	},
	resolve: {
		extensions: ['.js', '.json'],
		alias: {
			lib: path.join(__dirname, '/src/lib/')
		},
	}
}
