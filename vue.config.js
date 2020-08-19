const isProduction = process.env.NODE_ENV === 'production';
//const TerserPlugin = require('terser-webpack-plugin'); // yarn -dev add terser-webpack-plugin
module.exports = {
  publicPath: isProduction
    ? '/pluginone/dist/'
    : '/',
  productionSourceMap: isProduction
    ? false : true,
    /*
  chainWebpack: config => {
    config
      .plugin('webpack-bundle-analyzer')
      .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
  }*/
}