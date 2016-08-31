/**
     * Created by assafrubin on 8/27/16.
     */
var config = require('./config/config').config;
var http = require('http');
var request = require('request');
var fs = require('fs');
var moment = require('moment');
var logger = require('./logger.js').logger;

var FILES_DIR = config.filesDir;
console.log('files dir: ', FILES_DIR);
var currencyMap = {
    EUR: ['USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NOK', 'NZD'],
    USD: ['JPY', 'CHF', 'CAD', 'NOK', 'SEK'],
    GBP: ['USD', 'JPY', 'CAD', 'CHF'],
    AUD: ['USD', 'CAD', 'CHF', 'JPY', 'NZD'],
    CAD: ['CHF', 'JPY'],
    CHF: ['JPY'],
    NZD: ['JPY', 'USD']
};
var hostAddress = 'http://webrates.truefx.com';
var scrapeAddress = '/rates/connect.html?u=assafrubin&p=flash345&q=allrates&f=csv&s=y';
var getCounter = 0;

function connect (callback) {
    request(hostAddress + scrapeAddress, function (error, response, body) {
       if (!error && response.statusCode == 200) {
           logger.info("connect response:", body);
           callback(body);
       } else {
           logger.error('Got error in connect: ', error);
       }
    });
}

function getCurrentTick(sessionId, originCurrencies, callback) {
    var currenciesAsQuery = buildCurrenciesAsQuery(originCurrencies);
    var url = hostAddress + scrapeAddress + currenciesAsQuery + '&id=' + sessionId;
    logger.info('curency query URL: ', url);
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(originCurrencies, body);
        } else {
            logger.error('Got error in connect: ', error);
        }
    });
}

function buildCurrenciesAsQuery(currencies) {
    var query = '';
    for (var i = 0; i<currencies.length; i++) {
        var destCurrencies = currencyMap[currencies[i]];
        for (var j=0; j< destCurrencies.length; j++) {
            query += currencies[i] + '/' + destCurrencies[j] + ',';
        }
    }
    return '&c=' + query.substring(0, query.length-1);
}

function saveCurrencyFile(fileName, data, callback) {
    var filePath = FILES_DIR + fileName + '_' + moment().format('DD-MM-YYYY')+'.csv';
    fs.access(filePath, fs.F_OK, function(notExists) {
        data = data.replace(/(^[ \t]*\n)/gm, "");
        if (notExists) {
            logger.info('creating new file: ', filePath);
            fs.writeFile(filePath, data, callback);
        } else {
            fs.appendFile(filePath, data, callback);
        }
    });
}

function countGetToCallback(callback) {
    if (++getCounter == 5) {
        callback();
    }
}

module.exports.scrape = function(callback) {
    connect(function(sessionId) {
        logger.info('start new scraping...');
        getCounter = 0;
        getCurrentTick(sessionId, ['EUR'], function (originCurrencies, currentTick) {
            saveCurrencyFile('EUR', currentTick, countGetToCallback(callback));
        });
        getCurrentTick(sessionId, ['USD'], function(originCurrencies, currentTick) {
            saveCurrencyFile('USD', currentTick, countGetToCallback(callback));
        });
        getCurrentTick(sessionId, ['GBP'], function(originCurrencies, currentTick) {
            saveCurrencyFile('GBP', currentTick, countGetToCallback(callback));
        });
        getCurrentTick(sessionId, ['AUD'], function(originCurrencies, currentTick) {
            saveCurrencyFile('AUD', currentTick, countGetToCallback(callback));
        });
        getCurrentTick(sessionId, ['CAD', 'CHF', 'NZD'], function(originCurrencies, currentTick) {
            saveCurrencyFile('OTHER', currentTick, countGetToCallback(callback));
        });
    });
};
