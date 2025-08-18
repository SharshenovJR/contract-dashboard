const path = require('path');

module.exports = {
  webpack: {
    configure: (config) => {
      const isFunctionEntry = typeof config.entry === 'function';
      const originalEntry = isFunctionEntry ? config.entry() : config.entry;

      const mainEntry = Array.isArray(originalEntry)
        ? originalEntry
        : originalEntry.main || originalEntry;

      config.entry = {
        main: mainEntry,
        project: path.resolve(__dirname, 'src/Project.js'),
      };

      if (config.mode === 'production') {
        config.output.filename = 'static/js/[name].[contenthash:8].js';
        config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
      } else {
        config.output.filename = 'static/js/[name].js';
        config.output.chunkFilename = 'static/js/[name].chunk.js';
      }

      const htmlPluginIndex = config.plugins.findIndex(
        (p) => p && p.constructor && p.constructor.name === 'HtmlWebpackPlugin'
      );

      if (htmlPluginIndex !== -1) {

        const existing = config.plugins[htmlPluginIndex];
        const HtmlWebpackPluginCtor = existing.constructor;
        config.plugins.splice(htmlPluginIndex, 1);
        config.plugins.splice(htmlPluginIndex, 0, new HtmlWebpackPluginCtor({
          inject: true,
          chunks: ['main'],
          filename: 'index.html',
          template: path.resolve(__dirname, 'public/index.html'),
        }));

        config.plugins.push(new HtmlWebpackPluginCtor({
          inject: true,
          chunks: ['project'],
          filename: 'project.html',
          template: path.resolve(__dirname, 'public/project.html'),
        }));
      }

      return config;
    },
  },
};


