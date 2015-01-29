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

/** @class */
var JwtHelper = function (config) {
    /**
     * @callback ValidateCallback
     * @param {Error} error - The error if the token is not valid or is not able to be validated, else `null`.
     * @param {Object} claims - The claims contained within the token.
     */

    /**
     * Validates a jwt token.
     * The public key used for validation is retrieved from the configured
     * `publicKeyServer` based on the issuer of the token.
     *
     * @example
     * ```js
     * jwtHelper.validate(token, function (error, claims) {
     *     if (error) {
     *         console.log('Token validation failed.', error);
     *     } else {
     *         console.log(claims); // -> "{iss: 'name-of-client', sub: 'name-of-client'}"
     *     }
     * });
     * ```
     * @param {String} jwtToken - The jwt token to validate.
     * @param {ValidateCallback} callback - The callback that is called when the validate has been completed.
     */
    this.validate = function (jwtToken, callback) {
        var getUrl = _.partial(getPublicKeyUrl, config);
        var verifyToken = _.partial(jsonWebToken.verify, jwtToken);
        var onSuccess = _.partial(returnClaims, callback);
        var onError = _.partial(returnError, callback);

        decodeClaims(jwtToken).then(getUrl).then(request).then(verifyToken).then(onSuccess, onError);
    };

    /**
     * @callback GenerateTokenCallback
     * @param {Error} error - The error if generating the token fails, else `null`.
     * @param {String} token - The generated token.
     */

    /**
     * Generates a jwt token.
     *
     * @example
     * ```js
     * var claims = {iss: 'name-of-client', sub: 'name-of-client'};
     * var options = {privateKey: 'a-private-key'};
     * jwtHelper.generateToken(claims, options, function (error, token) {
     *     if (error) {
     *         console.log('Generating token failed.', error);
     *     } else {
     *         console.log(token); // -> "[token]"
     *     }
     * });
     * ```
     * @param {Object} claims - The claims to be included in the token. Custom claims are permitted.
     * @param {String} claims.iss - Issuer. The name of the system issuing the token.
     * This name should match the name of a key in the `publicKeyServer`.
     * @param {String} claims.sub - Subject. The name of the system the token is for.
     * If the subject is generating tokens for itself the `sub` and `iss` should be the same.
     * @param {Object} options
     * @param {String} options.privateKey - The private key to use when generating the token.
     * @param {GenerateTokenCallback} callback - The callback that is called when the token has been generated.
     */
    this.generateToken = function (claims, options, callback) {
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
    };

    /**
     * @callback GenerateAuthorizationHeaderCallback
     * @param {Error} error - The error if generating the authorization header fails, else `null`.
     * @param {String} authorizationHeader - The generated authorization header value.
     */

    /**
     * Generates an authorization header value containing a jwt token.
     * The format of the value is `x-atl-jwt [token]`.
     *
     * @example
     * ```js
     * var claims = {iss: 'name-of-client', sub: 'name-of-client'};
     * var options = {privateKey: 'a-private-key'};
     * jwtHelper.generateAuthorizationHeader(claims, options, function (error, headerValue) {
     *     if (error) {
     *         console.log('Generating authorization header failed.', error);
     *     } else {
     *         console.log(headerValue); // -> "x-atl-jwt [token]"
     *     }
     * });
     * ```
     * @param {Object} claims - The claims to be included in the token. Custom claims are permitted.
     * @param {String} claims.iss - Issuer. The name of the system issuing the token.
     * This name should match the name of a key in the `publicKeyServer`.
     * @param {String} claims.sub - Subject. The name of the system the token is for.
     * If the subject is generating tokens for itself the `sub` and `iss` should be the same.
     * @param {Object} options
     * @param {String} options.privateKey - The private key to use when generating the token.
     * @param {GenerateAuthorizationHeaderCallback} callback -
     * The callback that is called when the authorization header has been generated.
     */
    this.generateAuthorizationHeader = function (claims, options, callback) {
        this.generateToken(claims, options, function(error, token) {
            if (error) {
                callback(error);
            } else {
                callback(null, 'x-atl-jwt ' + token);
            }
        });
    };
};

/** @module */
module.exports = {
    /**
     * Constructor of `JwtHelper` objects.
     *
     * @example
     * ```js
     * var jwtMicroserviceHelper = require('jwt-microservice-helper');
     * var jwtHelper = jwtMicroserviceHelper.create({publicKeyServer: 'https://public-key-server.com'});
     * ```
     * @param {Object} config
     * @param {String} config.publicKeyServer -
     * A base url for the server containing the public keys of the issuers of the tokens.
     * @returns {JwtHelper}
     */
    create: function (config) {
        if (!config || !config.publicKeyServer) {
            throw new Error('Required config value config.publicKeyServer is missing.');
        }

        return new JwtHelper(config);
    }
};
