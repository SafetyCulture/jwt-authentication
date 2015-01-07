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
    create: function(issuer, subject, customClaims, privateKey) {
        var claims = _.cloneDeep(customClaims);
        claims.iss = issuer;
        claims.sub = subject;
        return  jsonWebToken.sign(claims, privateKey, {algorithm: 'RS256'});
    }
};