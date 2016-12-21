let webpack = require("webpack")
let WDS = require("webpack-dev-server")
let config = require("./webpack.config.js")

const server = new WDS(webpack(config), {
	publicPath : config.output.publicPath,
	hot : true,
	contentBase : "./",
	historyApiFallback : true,
})

server.listen(config.port, "localhost", (err, result) => {
	if (err) {
		console.log("wds error: " + err)
	}

	console.log("wds started")
})