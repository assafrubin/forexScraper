/**
 * Created by assafrubin on 8/29/16.
 */
var winston = require('winston');
module.exports.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            filename: 'demo.log'
        })
    ]
});