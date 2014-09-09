var jsonWebToken = require('jsonwebtoken');
var q = require('q');

module.exports = {
    decode: jsonWebToken.decode,
    verify: function (jwtToken, publicKey) {
        var deferred = q.defer();

        jsonWebToken.verify(jwtToken, publicKey, function (error, claims) {
            deferred.resolve(claims);
        });

        return deferred.promise;
    }
};