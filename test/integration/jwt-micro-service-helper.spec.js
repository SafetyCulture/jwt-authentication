var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtMicroserviceHelper = require('../../lib/jwt-microservice-helper');

describe ('jwt-microservice-helper', function () {

    describe('validate', function () {
        var createValidator = function (publicKeyServer) {
            return jwtMicroserviceHelper.create({publicKeyServer: publicKeyServer || 'http://localhost:8000'});
        };

        var createJwtToken = function (privateKeyName, payload) {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/' + privateKeyName + '.pem');
            payload = payload || {'iss': 'an-issuer'};
            return jwtSimple.encode(payload, privateKey, 'RS256');
        };

        it('should validate a jwt token', function (done) {
            var jwtToken = createJwtToken('private');

            createValidator().validate(jwtToken, function(error, claims) {
                expect(error).toBeUndefined('error');
                expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
                done();
            });
        });

        it('should return the error when unable to retrieve the public key', function (done) {
            var jwtToken = createJwtToken('private');

            createValidator('http://localhost:8000/does-not-exist').validate(jwtToken, function (error, claims) {
                expect(claims).toBeUndefined('claims');
                expect(error).toBeDefined('error');
                expect(error.message).toBe('404');
                done();
            });
        });

        it('should return the error when validating the jwt token fails', function (done) {
            var jwtToken = createJwtToken('private-wrong');

            createValidator().validate(jwtToken, function(error, claims) {
                expect(claims).toBeUndefined('claims');
                expect(error).toBeDefined('error');
                expect(error.message).toBe('invalid signature');
                done();
            });
        });

        it('should return an error when the token is expired', function (done) {
            var expiryTimeInSeconds = new Date(2013, 0, 1).getTime() / 1000;
            var jwtToken = createJwtToken('private', {iss: 'an-issuer', exp: expiryTimeInSeconds});

            createValidator().validate(jwtToken, function(error, claims) {
                expect(claims).toBeUndefined('claims');
                expect(error).toBeDefined('error');
                expect(error.message).toBe('jwt expired');

                done();
            });
        });
    });
});