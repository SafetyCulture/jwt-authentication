var q = require('q');
var _ = require('lodash');

var logInfo = function(logger, request, message) {
    if (logger) {
        logger.info({
            requestContext: {
                url: request.originalUrl
            },
            message: message
        });
    }
};

var tokenValidation = function(jwtValidator, authorizedSubjects, token) {
    var validIssuers = authorizedSubjects || [];
    return q.nfcall(jwtValidator.validate, token, validIssuers);
};

/* jshint maxcomplexity:7 */
var getBearerToken = function(request) {
    var authHeader = request.headers.authorization;
    if (!authHeader) {
        return q.reject(new Error('Missing authorization header'));
    }

    var parts = authHeader.split(' ');
    if (!parts || parts.length !== 2) {
        return q.reject(new Error('Authorization header has a wrong format'));
    }

    var authScheme = parts[0];
    if (authScheme !== 'Bearer') {
        return q.reject(new Error('Authorization header has a wrong scheme'));
    }

    return q.resolve(parts[1]);
};

var authenticateRequest = function(request, jwtValidator, authorizedSubjects) {
    var validateToken = _.partial(tokenValidation, jwtValidator, authorizedSubjects);

    return getBearerToken(request)
            .then(validateToken);
};

/** @module */
module.exports = {
    /**
     * @callback next
     */

    /**
     * @callback JWTAuthMiddlewareCallback
     * @param {Object} request - http request
     * @param {Object} response - http response
     * @param {next} next - function to call the next middleware
     */

    /**
     * Constructor of http middleware function for jwt authentication.
     *
     * @example
     * ```js
     * var server = require('jwt-authentication').server;
     * var validator = server.create({
     *                                 publicKeyBaseUrl: 'https://public-key-server.com/',
     *                                 resourceServerAudience: 'my-service'
     *                               });
     * var authMiddleware = require('jwt-authentication').httpAuthMiddleware;
     * var validator = server.create(validator);
     * ```
     * @param {Validator} jwtValidator - `Validator` object
     * @param {Array.<String>} authorizedSubjects - array of authorized subject
     * @param {Object} [logger] - optional logger object to log 401 errors
     * @returns {JWTAuthMiddlewareCallback} - middleware function to authenticate requests
     */
    create: function(jwtValidator, authorizedSubjects, logger) {
        return function(request, response, next) {
            return authenticateRequest(request, jwtValidator, authorizedSubjects)
                .then(function(claims) {
                    request.claims = claims;
                    next();
                })
                .fail(function(error) {
                    var err = error.error || error;
                    response.setHeader('Content-Type', 'application/json');
                    response.statusCode = 401;
                    var unauthorizedMessage = 'Request to billing service had missing or incorrect credentials.';
                    response.end(JSON.stringify({errors: [
                        {
                            message: unauthorizedMessage,
                            originalError: err.message
                        }
                    ]}));
                    logInfo(logger, request, unauthorizedMessage);
                });
        };
    }
};