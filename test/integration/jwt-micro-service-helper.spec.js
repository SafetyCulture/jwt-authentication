var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtMicroserviceHelper = require('../../lib/jwt-microservice-helper');

describe ('jwt-microservice-helper', function () {

    describe('validate', function () {
        var createValidator = function (publicKeyServer) {
            return jwtMicroserviceHelper.create({publicKeyServer: publicKeyServer || 'http://localhost:8000'});
        };

        var createJwtToken = function (privateKeyName) {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/' + privateKeyName + '.pem');
            var payload = {'iss': 'an-issuer'};
            return jwtSimple.encode(payload, privateKey, 'RS256');
        };

        it('should validate a jwt token', function (done) {
            var jwtToken = createJwtToken('private');

            createValidator().validate(jwtToken, function(err, claims) {
                expect(err).toBeUndefined('error');
                expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
                done();
            });
        });

        it('should return the error when validating the jwt token fails', function (done) {
            var jwtToken = createJwtToken('private-wrong');

            createValidator().validate(jwtToken, function(error, claims) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('invalid signature');
                expect(claims).toBeUndefined('claims');
                done();
            });
        });
    });
});