var jsonWebToken = require('jsonwebtoken');
var q = require('q');
var fs = require('fs');

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
    create: function(issuer, subject, claims, privateKeyFileName) {
        var key = fs.readFileSync(privateKeyFileName);
        claims.iss = issuer;
        claims.sub = subject;
        var token = jsonWebToken.sign(claims, key, {algorithm: 'RS256'});
        return token;
    }
};