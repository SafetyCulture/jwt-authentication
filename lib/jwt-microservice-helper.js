var jsonWebToken = require('./jwt-microservice-helper/json-web-token');
var q = require('q');
var request = require('./jwt-microservice-helper/request');
var util = require('util');
var _ = require('lodash');

var decodeClaims = function (jwtToken) {
    try {
        return q(jsonWebToken.decode(jwtToken));
    } catch (error) {
        return q.reject(error);
    }
};

var getPublicKeyUrl = function (config, claims) {
    if (!claims.iss) {
        return q.reject(new Error('Cannot verify token with no "iss" claim'));
    } else {
        return q(util.format('%s/%s/public.pem', config.publicKeyServer, claims.iss));
    }
};

var returnClaims = function (callback, claims) {
    callback(null, claims);
};

var returnError = function (callback, error) {
    callback(error);
};

var validateClaims = function(claims) {
    if (!claims || !claims.iss || !claims.sub) {
        return {valid: false, error: 'claims body must have both the "iss" and "sub" fields'};
    } else {
        return {valid: true};
    }
};

var validateOptions = function(options) {
    if (!options || !options.privateKey) {
        return {valid: false, error: 'Required value options.privateKey is missing'};
    } else {
        return {valid: true};
    }
};

module.exports = {
    create: function (config) {
        if (!config || !config.publicKeyServer) {
            throw new Error('Required config value config.publicKeyServer is missing.');
        }

        return {
            validate: function (jwtToken, callback) {
                var getUrl = _.partial(getPublicKeyUrl, config);
                var verifyToken = _.partial(jsonWebToken.verify, jwtToken);
                var onSuccess = _.partial(returnClaims, callback);
                var onError = _.partial(returnError, callback);

                decodeClaims(jwtToken).then(getUrl).then(request).then(verifyToken).then(onSuccess, onError);
            },
            generateToken: function (claims, options, callback) {
                if (!validateOptions(options).valid) {
                    callback(new Error(validateOptions(options).error));
                    return;
                }

                if (!validateClaims(claims).valid) {
                    callback(new Error(validateClaims(claims).error));
                    return;
                }

                var token = jsonWebToken.create(claims, options.privateKey);
                callback(null, token);
            },
            generateAuthorizationHeader: function (claims, options, callback) {
                return this.generateToken(claims, options, function(error, token) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, 'x-atl-jwt ' + token);
                    }
                });
            }
        };
    }
};
