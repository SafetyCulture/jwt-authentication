var q = require('q');
var axios = require('axios');
var util = require('util');
var keyCache = require('./cache/keyCache');
var crypto = require('crypto');
var _ = require('lodash');

var makeRequest = function(url) {
    var options = {
        headers: {
            'Accept': 'application/x-pem-file'
        },
        timeout: 3 * 60 * 1000 // 3 minutes
    };

    return q(axios.get(url, options))
        .fail(function(response) {
            var message = response.data || response.message;
            return q.reject(new Error(util.format(
                'Unable to retrieve public key. Error: "%s" Url: "%s"', message.trim(), url
            )));
        })
        .then(function(response) {
            if (response.status !== 200) {
                return q.reject(new Error(util.format(
                    'Unable to retrieve public key. Expected status code: "200" Actual status code: "%s" Url: "%s"',
                    response.status,
                    url
                )));
            } else {
                return q.resolve(response.data);
            }
        });
};

var generateHashFromUrl = function(url) {
    return crypto.createHash('sha256').update(url).digest('hex');
};

var getKeyFromCache = function(url) {
    var hash = generateHashFromUrl(url);
    return q.nfcall(keyCache.get, hash);
};

var putKeyIntoCache = function(url, key) {
    var hash = generateHashFromUrl(url);
    return q.nfcall(keyCache.set, hash, key)
        .thenResolve(key);
};

var checkCachedKey = function(url, cachedKey) {
    var setKeyInCacheAndReturn = _.partial(putKeyIntoCache, url);

    if (cachedKey) {
        return q.resolve(cachedKey);
    } else {
        return makeRequest(url)
            .then(setKeyInCacheAndReturn);
    }
};

module.exports = function (url) {
    var returnKeyOrFetch = _.partial(checkCachedKey, url);

    return getKeyFromCache(url)
        .then(returnKeyOrFetch);
};