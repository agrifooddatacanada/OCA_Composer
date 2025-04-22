const webpack = require("webpack");

module.exports = {
  eslint: {
    enable: false
  },
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert/"),
        util: require.resolve("util/"),
        buffer: require.resolve("buffer/")
      };
      webpackConfig.plugins = (webpackConfig.plugins || []).concat([
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"]
        })
      ]);

      webpackConfig.module.rules.push({
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: /node_modules\/oca_package/
      });
      return webpackConfig;
    }
  }
};
