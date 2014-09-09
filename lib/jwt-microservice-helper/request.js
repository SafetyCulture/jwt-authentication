var q = require('q');
var request = require('request');

module.exports = function (options) {
    var deferred = q.defer();

    request(options, function (error, response, body) {
        if (error) {
            deferred.reject(error);
        } else if (response.statusCode !== 200) {
            deferred.reject(new Error(response.statusCode.toString()));
        } else {
            deferred.resolve(body);
        }
    });

    return deferred.promise;
};