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
            ignoreNotBefore: true
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
        var jsonWebTokenClaims = _.merge({}, claims, {
            jti: crypto.randomBytes(20).toString('hex'),
            nbf: options.notBefore,
            iat: options.iat
        });

        var jsonWebTokenOptions = {
            algorithm: 'RS256',
            expiresIn: options.expiresInSeconds || 30,
            headers: {
                kid: options.kid
            }
        };

        return jsonWebToken.sign(jsonWebTokenClaims, options.privateKey, jsonWebTokenOptions);
    }
};