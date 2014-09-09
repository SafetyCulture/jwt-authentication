var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtMicroserviceHelper = require('../../lib/jwt-microservice-helper');

describe ('jwt-microservice-helper', function () {

	it('should validate a jwt token', function (done) {
        var secret = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');

		var payload = {
            'iss': 'an-issuer'
		};

		var jwtToken = jwtSimple.encode(payload, secret, 'RS256');

		var validator = jwtMicroserviceHelper.create({
            publicKeyServer: 'http://localhost:8000'
        });

		validator.validate(jwtToken, function(err, claims) {
			expect(err).toBeUndefined('error');
            expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
            done();
		});
	});
});