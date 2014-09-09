var jsonWebToken = require('./jwt-microservice-helper/json-web-token');
var request = require('./jwt-microservice-helper/request');
var util = require('util');
var _ = require('lodash');

module.exports = {
    create: function (config) {
        return {
            validate: function (jwtToken, callback) {
                var claims = jsonWebToken.decode(jwtToken);

                if (claims.iss === undefined) {
                    callback(new Error('Cannot verify token with no "iss" claim'));
                    return;
                }

                var url = util.format('%s/%s/public.pem', config.publicKeyServer, claims.iss);

                request(url)
                    .then(_.partial(jsonWebToken.verify, jwtToken))
                    .then(function (claims) {
                        callback(undefined, claims);
                    });
            }
        };
    }
};
