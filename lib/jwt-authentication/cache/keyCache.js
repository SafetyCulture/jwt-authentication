var NodeCache = require('node-cache');

var cacheOptions = {
    stdTTL: 24 * 60 * 60, // 24 hours
    checkperiod: 10 // 10 seconds
};

var keyCache =  new NodeCache(cacheOptions);
module.exports = keyCache;
