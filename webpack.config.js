// webpack.config.js
let path = require("path")
let webpack = require("webpack")

const DEV_PORT = 8080

module.exports = {
	port : DEV_PORT,
	devtool : "#source-map",
	entry : [
		"webpack-dev-server/client?http://localhost:" + DEV_PORT,
		"webpack/hot/dev-server",
		"./src/main.js",
		// "./less/main.less",
	],

	resolve : {
		root : path.resolve("./"),
		modulesDirectories : ["node_modules", "./"],
	},

	output : {
		path : path.resolve("./"),
		filename : "bundle.js",
		publicPath : "/",
	},

	module : {
		loaders : [
			{
				test : /\.js$/,
				loader : "babel-loader", query : { presets : ["es2015", "stage-0"] },
				include : path.join(__dirname, "src"),
				exclude : /(node_modules|bower_components)/,
			},
			// { test : /\.less/, loader : "style!css!less!", },
			// { test : /\.html/, loader : "html-loader" },
			{ test : /\.json/, loader : "json-loader" },
		]
	},

	watchOptions : {
		aggregateTimeout : 400,
		poll : 1000,
	},

	plugins : [
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin(),
	]

}