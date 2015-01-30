var q = require('q');
var request = require('request');
var util = require('util');

module.exports = function (url) {
    var deferred = q.defer();

    request(url, function (error, response, body) {
        if (error) {
            deferred.reject(new Error(util.format(
                'Unable to retrieve public key. Error: "%s" Url: "%s"', error.message, url
            )));
            deferred.reject(error);
        } else if (response.statusCode !== 200) {
            deferred.reject(new Error(util.format(
                'Unable to retrieve public key. Expected status code: "200" Actual status code: "%s" Url: "%s"',
                response.statusCode,
                url
            )));
        } else {
            deferred.resolve(body);
        }
    });

    return deferred.promise;
};