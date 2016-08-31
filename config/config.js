/**
 * Created by assafrubin on 8/31/16.
 */
var _ = require('lodash');
var P = require('autoresolve');

var env = {};
var define = require('node-constants')(env);
define({
    ENV_DEVELOPMENT: 'development',
    ENV_PRODUCTION: 'production',
    ENV_UNKNOWN: 'unknown',
});
exports.env = env;

var argv =
    require('optimist')
        .options('environment', {
            string: true,
            default: env.ENV_DEVELOPMENT,
            alias: 'env',
        })
        .options('debug', {
            boolean: true,
            default: false,
        })
        .argv;
if (process.env.DY_ENV &&
    process.env.DY_ENV.trim() !== '' &&
    process.env.DY_ENV.toLowerCase().trim() !== env.ENV_UNKNOWN) {
    argv.environment = process.env.DY_ENV.toLowerCase().trim();
}
var config = {};
config.environment = process.env.DY_ENV || argv.environment;

_.merge(config,
    require(P(_.template('config/environments/${environment}.json')({ environment: config.environment }))));

config.debug = argv.debug;

if (config.debug) {
    console.log('%j', config);
}

config.dev = config.environment === env.ENV_DEVELOPMENT;

exports.config = config;
