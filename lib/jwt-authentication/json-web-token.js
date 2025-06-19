var _ = require('lodash');
var crypto = require('crypto');
var jsonWebToken = require('jsonwebtoken');
var q = require('q');

module.exports = {
    decode: jsonWebToken.decode,
    verify: function (jwtToken, publicKey) {
        var deferred = q.defer();

        var options = {
            // these are checked by jwt-claims-validator
            ignoreExpiration: true,
            ignoreNotBefore: true,
            clockTolerance: 60 // Allow 60 seconds of leeway for clock skew
        };

        jsonWebToken.verify(jwtToken, publicKey, options, function (error, claims) {
            if (error) {
                deferred.reject(error);
            } else {
                deferred.resolve(claims);
            }
        });

        return deferred.promise;
    },
    create: function (claims, options) {

        var jsonWebTokenClaims = _.extend({}, claims, {
            jti: crypto.randomBytes(20).toString('hex'),
            nbf: options.notBefore,
            iat: options.iat
        });

        var jsonWebTokenClaimsWithoutEmpty = _.omitBy(jsonWebTokenClaims, function (val) {
            return val === undefined;
        });

        var jsonWebTokenOptions = {
            algorithm: 'RS256',
            expiresIn: options.expiresInSeconds || 30,
            keyid: options.kid,
            allowInsecureKeySizes: true // Allow small key sizes for test environments
        };
        return jsonWebToken.sign(jsonWebTokenClaimsWithoutEmpty, options.privateKey, jsonWebTokenOptions);
    }
};
