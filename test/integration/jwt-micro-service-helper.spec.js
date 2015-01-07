var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtMicroserviceHelper = require('../../lib/jwt-microservice-helper');

describe ('jwt-microservice-helper', function () {

    describe('generateToken', function () {
        var createTokenCreator = function() {
            return jwtMicroserviceHelper.create({publicKeyServer: 'public-key-server-url'});
        };

        var validateJwtToken = function (token, publicKeyName) {
            var publicKey = fs.readFileSync('test/integration/key-server/an-issuer/' + publicKeyName + '.pem');
            return jwtSimple.decode(token, publicKey);
        };

        it('should create a correctly signed jwt token', function () {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');
            var jwt = createTokenCreator().generateToken('an-issuer', 'a-subject', {}, privateKey);

            var decodedJwt = validateJwtToken(jwt, 'public');

            expect(decodedJwt.iss).toBe('an-issuer');
            expect(decodedJwt.sub).toBe('a-subject');
        });

        it('should create a correctly signed jwt token with custom claims', function () {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');
            var jwt = createTokenCreator().generateToken('an-issuer', 'a-subject', {foo: 'abc', bar: 123}, privateKey);

            var decodedJwt = validateJwtToken(jwt, 'public');

            expect(decodedJwt.iss).toBe('an-issuer');
            expect(decodedJwt.sub).toBe('a-subject');
            expect(decodedJwt.foo).toBe('abc');
            expect(decodedJwt.bar).toBe(123);
        });

        it('should create a signed jwt token that can only be verified with the right public key', function () {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private-wrong.pem');
            var jwt = createTokenCreator().generateToken('an-issuer', 'a-subject', {}, privateKey);

            expect( function() {validateJwtToken(jwt, 'public');}).toThrow(new Error('Signature verification failed'));
        });

        it('should throw an error if config is missing publicKeyServer', function () {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private-wrong.pem');
            var tokenCreator = jwtMicroserviceHelper.create({});
            expect(function() {tokenCreator.generateToken('an-issuer', 'a-subject', {}, privateKey);}).toThrow(
                new Error('Required config value config.publicKeyServer is missing.'));
        });
    });

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
                expect(error.message).toBe(
                    'Unable to retrieve public key. ' +
                    'Expected status code: "200" ' +
                    'Actual status code: "404" ' +
                    'Url: "http://localhost:8000/does-not-exist/an-issuer/public.pem"'
                );
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