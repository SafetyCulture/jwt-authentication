var _ = require('lodash');
var crypto = require('crypto');
var jsonWebToken = require('jsonwebtoken');
var q = require('q');

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
    create: function (claims, options) {
        var jsonWebTokenClaims = _.merge({}, claims, {
            jti: crypto.randomBytes(20).toString('hex')
        });

        var jsonWebTokenOptions = {
            algorithm: 'RS256',
            expiresInMinutes: options.expiresInMinutes || 0.5,
            header: {
                kid: options.kid
            }
        };

        return jsonWebToken.sign(jsonWebTokenClaims, options.privateKey, jsonWebTokenOptions);
    }
};