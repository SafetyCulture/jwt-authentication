var request = require('request'),
    jsonwebtoken = require('jsonwebtoken'),
    util = require('util');



module.exports = {
    create: function (config) {
        return {
            validate: function (jwtToken) {
                var claims = jsonwebtoken.decode(jwtToken);

                if (claims.iss === undefined) {
                    //callback('Cannot verify token with no "iss" claim');
                    return;
                }

                var url = util.format('%s/%s/public.pem', config.publicKeyServer, claims.iss);

                request(url, function (err, response, body) {

                    jsonwebtoken.verify(jwtToken, body, {}, function (err) {
                        callback(undefined, claims);
                    });
                });
            }
        };
    }
};
