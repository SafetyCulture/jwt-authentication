var jsonWebToken = require('../jwt-authentication/json-web-token');
var _ = require('lodash');
var canonicalizePrivateKey = require('./canonicalize');

var getRequiredClaimsValidators = function() {
    return [
        function (claims) {
            return _.isString(claims.iss);
        },
        function (claims) {
            return _.isString(claims.sub);
        },
        function (claims) {
            return _.isString(claims.aud) || _.isArray(claims.aud);
        }
    ];
};

var validateClaims = function(claims) {
    var allRequiredClaimsProvided = _.every(getRequiredClaimsValidators(), function (claimValidator) {
        return claims && claimValidator(claims);
    });
    if (!allRequiredClaimsProvided) {
        return {valid: false, error: 'claims body must contain "iss", "sub" and "aud" fields'};
    } else {
        return {valid: true};
    }
};

var validateOptions = function(options) {
    if (!options || !options.privateKey || !options.kid) {
        return {valid: false, error: 'Options must contain "privateKey" and "kid" fields'};
    } else {
        return {valid: true};
    }
};

/** @class */
var Generator = function () {

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
     * var claims = {iss: 'name-of-client', sub: 'name-of-client', aud: 'name-of-server'};
     * var options = {privateKey: 'a-private-key', kid: 'name-of-client/key-id.pem'};
     * generator.generateToken(claims, options, function (error, token) {
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
     * @param {String} claims.aud - Audience. The value that identifies the resource server. This can
     * also be an array of strings when the token is intended for multiple resource servers.
     * @param {Object} options
     * @param {String} options.privateKey - The private key to use when generating the token.
     * @param {String} options.kid - Key ID. The identifier of the key used to sign the token in the format
     * 'issuer/key-id' where issuer matches claims.iss.
     * @param {Number} [options.expiresInSeconds=30] - The number of seconds until the token expires.
     * @param {Number} [options.notBefore=Date] -
     * date not before the token is valid (in seconds Math.floor(date / 1000).
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

        var token;
        try {
            token = jsonWebToken.create(claims, {
                expiresInSeconds: options.expiresInSeconds,
                privateKey: canonicalizePrivateKey(options.kid, options.privateKey),
                kid: options.kid,
                iat: options.iat,
                notBefore: options.notBefore
            });
        } catch (e) {
            callback(new Error('Error generating token: ' + e.message));
            return;
        }
        callback(null, token);
    };

    /**
     * @callback GenerateAuthorizationHeaderCallback
     * @param {Error} error - The error if generating the authorization header fails, else `null`.
     * @param {String} authorizationHeader - The generated authorization header value.
     */

    /**
     * Generates an authorization header value containing a jwt token.
     * The format of the value is `Bearer [token]`.
     *
     * @example
     * ```js
     * var claims = {iss: 'name-of-client', sub: 'name-of-client', aud: 'name-of-server'};
     * var options = {privateKey: 'a-private-key', kid: 'name-of-client/key-id.pem'};
     * generator.generateAuthorizationHeader(claims, options, function (error, headerValue) {
     *     if (error) {
     *         console.log('Generating authorization header failed.', error);
     *     } else {
     *         console.log(headerValue); // -> "Bearer [token]"
     *     }
     * });
     * ```
     * @param {Object} claims - The claims to be included in the token. Custom claims are permitted.
     * @param {String} claims.iss - Issuer. The name of the system issuing the token.
     * This name should match the name of a key in the `publicKeyServer`.
     * @param {String} claims.sub - Subject. The name of the system the token is for.
     * If the subject is generating tokens for itself the `sub` and `iss` should be the same.
     * @param {String} claims.aud - Audience. The value that identifies the resource server. This can also
     * be an array of strings when the token is intended for multiple resource servers.
     * @param {Object} options
     * @param {String} options.privateKey - The private key to use when generating the token.
     * @param {String} options.kid - Key ID. The identifier of the key used to sign the token in the format
     * 'issuer/key-id' where issuer matches claims.iss.
     * @param {Number} [options.expiresInSeconds=30] - The number of seconds until the token expires.
     * @param {Number} [options.notBefore=Date] -
     * date not before the token is valid (in seconds Math.floor(date / 1000).
     * @param {GenerateAuthorizationHeaderCallback} callback -
     * The callback that is called when the authorization header has been generated.
     */
    this.generateAuthorizationHeader = function (claims, options, callback) {
        this.generateToken(claims, options, function(error, token) {
            if (error) {
                callback(error);
            } else {
                callback(null, 'Bearer ' + token);
            }
        });
    };
};

/** @module */
module.exports = {
    /**
     * Constructor of `Generator` objects.
     *
     * @example
     * ```js
     * var client = require('jwt-authentication').client;
     * var generator = generator.create();
     * ```
     * A base url for the server containing the public keys of the issuers of the tokens.
     * @returns {Generator}
     */
    create: function () {
        return new Generator();
    }
};
