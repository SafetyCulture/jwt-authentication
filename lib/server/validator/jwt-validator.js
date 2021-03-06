var jsonWebToken = require('../../jwt-authentication/json-web-token');
var q = require('q');
var _ = require('lodash');
var keyProviderFactory = require('../keys/http-public-key-provider-factory');
var claimsValidator = require('./jwt-claims-validator');

var PATH_PATTERN = /^[\w.\-\+\/]*$/;

var validateTraversalComponents = function(keyId) {
    var pathComponents = keyId.split('/');
    if (_.includes(pathComponents, '.') || _.includes(pathComponents, '..')) {
        return q.reject(new Error('Path traversal components not allowed in kid'));
    }
    return q.resolve(keyId);
};

var validateFormat = function(keyId) {
    var pathComponents = keyId.split('/');
    if (_.includes(pathComponents, '')) {
        return q.reject(new Error('Invalid format of kid'));
    }
    return q.resolve(keyId);
};

var validatePattern = function(keyId) {
    if (!keyId.match(PATH_PATTERN)) {
        return q.reject(new Error('Invalid character found in kid'));
    }

    return q.resolve(keyId);
};

var validateKeyId = function(header) {
    if (!header || !header.kid) {
        return q.reject(new Error('The kid header is required'));
    }

    var keyId = header.kid;
    return validateTraversalComponents(keyId)
        .then(validateFormat)
        .then(validatePattern);
};

var returnClaims = function (callback, claims) {
    callback(null, claims);
};

var returnError = function (callback, error) {
    callback(error);
};


/** @class */
var Validator = function (config) {

    var keyProvider = keyProviderFactory.create(config);

    /**
     * @callback ValidateCallback
     * @param {Error} error - The error if the token is not valid or is not able to be validated, else `null`.
     * @param {Object} claims - The claims contained within the token.
     */

    /**
     *
     * Validates a jwt token.
     * The public key used for validation is retrieved from the configured
     * `publicKeyServer` based on the issuer of the token.
     *
     * @example
     * ```js
     * validator.validate(token, authorizedSubjects, function (error, claims) {
     *     if (error) {
     *         console.log('Token validation failed.', error);
     *     } else {
     *         console.log(claims); // -> "{iss: 'name-of-client', sub: 'name-of-client'}"
     *     }
     * });
     * ```
     * @param {String} jwtToken - The jwt token to validate.
     * @param {Array.<String>} authorizedSubjects - list of authorized subjects to access the service
     * @param {ValidateCallback} callback - The callback that is called when the validate has been completed.
     */
    this.validate = function (jwtToken, authorizedSubjects, callback) {
        var verifiableToken = jsonWebToken.decode(jwtToken, {complete: true});

        if (!verifiableToken) {
            return callback(new Error('Token could not be parsed'));
        }

        var verifyToken = _.partial(jsonWebToken.verify, jwtToken);
        var validateClaims = _.partial(claimsValidator.validate, authorizedSubjects, config, verifiableToken.header);
        var onSuccess = _.partial(returnClaims, callback);
        var onError = _.partial(returnError, callback);

        validateKeyId(verifiableToken.header)
            .then(keyProvider.getKey)
            .then(verifyToken)
            .then(validateClaims)
            .then(onSuccess, onError);
    };
};

/** @module */
module.exports = {
    /**
     * Constructor of `Validator` objects.
     *
     * @example
     * ```js
     * var server = require('jwt-authentication').server;
     * var validator = server.create({
     *                                 publicKeyBaseUrl: 'https://public-key-server.com/',
     *                                 resourceServerAudience: 'my-service'
     *                               });
     * ```
     * @param {Object} config
     * @param {String} config.publicKeyBaseUrl -
     * A base url for the server containing the public keys of the issuers of the tokens. Must end with a slash
     * @param {String} config.resourceServerAudience - all JWT messages will need to have this audience to be valid
     * @param {boolean} config.ignoreMaxLifeTime - Setting this property will skip the 1 hour max lifetime checks 
     * and make your server less secure. Do not include this if you are not sure what you are doing.
     * @returns {Validator}
     */
    create: function (config) {
        if (!config || !config.publicKeyBaseUrl) {
            throw new Error('Required config value config.publicKeyBaseUrl is missing.');
        }

        if (!config.resourceServerAudience) {
            throw new Error('Required config value config.resourceServerAudience is missing.');
        }

        return new Validator(config);
    }
};
