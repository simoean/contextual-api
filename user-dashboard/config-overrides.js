const path = require('path');

module.exports = function override(config, env) {
  config.resolve.alias = {
    ...config.resolve.alias,
    shared: path.resolve(__dirname, 'src/shared'),
    features: path.resolve(__dirname, 'src/features'),
    assets: path.resolve(__dirname, 'src/assets'),
    app: path.resolve(__dirname, 'src/app'),
  };
  return config;
};
