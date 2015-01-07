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
    callback(undefined, claims);
};

var returnError = function (callback, error) {
    callback(error);
};

module.exports = {
    create: function (config) {
        return {
            validate: function (jwtToken, callback) {
                var getUrl = _.partial(getPublicKeyUrl, config);
                var verifyToken = _.partial(jsonWebToken.verify, jwtToken);
                var onSuccess = _.partial(returnClaims, callback);
                var onError = _.partial(returnError, callback);

                decodeClaims(jwtToken).then(getUrl).then(request).then(verifyToken).then(onSuccess, onError);
            },
            generateToken: function (issuer, subject, claims, privateKey, callback) {
                if (!config || !config.publicKeyServer) {
                    callback(new Error('Required config value config.publicKeyServer is missing.'));
                }
                var token = jsonWebToken.create(issuer, subject, claims, privateKey);
                return callback(null, token);
            }
        };
    }
};
