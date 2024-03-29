var q = require('q');
var axios = require('axios');
var util = require('util');
var keyCache = require('./cache/keyCache');
var _ = require('lodash');

var makeRequest = function(url) {
    var options = {
        headers: {
            'Accept': 'application/x-pem-file'
        },
        timeout: 10 * 1000 // 10 seconds
    };

    return q(axios.get(url, options))
        .fail(function(response) {
            var message = response.data || response.message;
            throw new Error(util.format(
                'Unable to retrieve public key. Error: "%s" Url: "%s"', message.trim(), url
            ));
        })
        .then(function(response) {
            if (response.status !== 200) {
                throw new Error(util.format(
                    'Unable to retrieve public key. Expected status code: "200" Actual status code: "%s" Url: "%s"',
                    response.status,
                    url
                ));
            } else {
                return response.data;
            }
        });
};

var getKeyFromCache = function(url) {
    return q.nfcall(keyCache.get, url);
};

var putKeyIntoCache = function(url, key) {
    return q.nfcall(keyCache.set, url, key)
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
