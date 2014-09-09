var q = require('q');
var request = require('request');

module.exports = function (options) {
    var deferred = q.defer();

    request(options, function (error, response, body) {
        deferred.resolve(body);
    });

    return deferred.promise;
};