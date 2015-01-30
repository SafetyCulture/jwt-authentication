var jsonWebToken = require('jsonwebtoken');
var q = require('q');
var _ = require('lodash');

module.exports = {
    decode: jsonWebToken.decode,
    verify: function (jwtToken, publicKey) {
        var deferred = q.defer();

        jsonWebToken.verify(jwtToken, publicKey, function (error, claims) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(claims);
            }
        });

        return deferred.promise;
    },
    create: function (claims, privateKey) {

        return  jsonWebToken.sign(_.cloneDeep(claims), privateKey, {algorithm: 'RS256'});
    }
};