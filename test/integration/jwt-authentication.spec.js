var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtAuthentication = require('../../lib/jwt-authentication');
var _ = require('lodash');

describe ('jwt-authentication', function () {

    var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');
    var incorrectPrivateKey = fs.readFileSync('test/integration/key-server/an-issuer/private-wrong.pem');

    var createAuthenticator = function (publicKeyServer) {
        return jwtAuthentication.create({publicKeyServer: publicKeyServer || 'http://localhost:8000'});
    };

    it('should throw error if config is null', function() {
        var create = _.partial(jwtAuthentication.create, null);
        expect(create).toThrow(new Error('Required config value config.publicKeyServer is missing.'));
    });

    it('should throw error if config is missing publicKeyServer field', function() {
        var create = _.partial(jwtAuthentication.create, {foo: 'bar'});
        expect(create).toThrow(new Error('Required config value config.publicKeyServer is missing.'));
    });

    var itShouldGenerateAToken = function (generateToken) {
        var validateJwtToken = function (token, publicKeyName) {
            var publicKey = fs.readFileSync('test/integration/key-server/an-issuer/' + publicKeyName + '.pem');
            return jwtSimple.decode(token, publicKey);
        };

        it('should create a correctly signed jwt token', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience', foo: 'abc', bar: 123};
            generateToken(claims, {privateKey: privateKey}, function (error, token) {
                expect(error).toBeNull('error');

                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.iss).toBe('an-issuer');
                expect(actualClaims.sub).toBe('a-subject');
                expect(actualClaims.aud).toBe('an-audience');
                expect(actualClaims.foo).toBe('abc');
                expect(actualClaims.bar).toBe(123);
                done();
            });
        });

        it('should create tokens with a default expiry of 30 seconds', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            generateToken(claims, {privateKey: privateKey}, function (error, token) {
                expect(error).toBeNull('error');

                var nowInSeconds = Math.floor(Date.now() / 1000);

                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.iat).toBeCloseTo(nowInSeconds, 1, 'issued at');
                expect(actualClaims.exp).toBe(actualClaims.iat + 30, 'expires');
                done();
            });
        });

        it('should allow token expiry to be set', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            generateToken(claims, {expiresInMinutes: 10, privateKey: privateKey}, function (error, token) {
                expect(error).toBeNull('error');
                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.exp).toBe(actualClaims.iat + (60 * 10), 'expires');
                done();
            });
        });

        it('should create a signed jwt token that can only be verified with the right public key', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            generateToken(claims, {privateKey: incorrectPrivateKey}, function(error, token) {
                expect(error).toBeNull('error');

                var validate = _.partial(validateJwtToken, token, 'public');
                expect(validate).toThrow(new Error('Signature verification failed'));
                done();
            });
        });

        it('should return an error if claims are missing "iss" field', function (done) {
            var claims = {sub: 'a-subject', aud: 'an-audience'};
            generateToken(claims, {privateKey: privateKey}, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should return an error if claims are missing "sub" field', function (done) {
            var claims = {iss: 'an-issuer', aud: 'an-audience'};
            generateToken(claims, {privateKey: privateKey}, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should return an error if claims are missing "aud" field', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject'};
            generateToken(claims, {privateKey: privateKey}, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });
    };

    describe('generateToken', function () {
        var invokeGenerateToken = function (claims, options, callback) {
            return createAuthenticator().generateToken(claims, options, callback);
        };

        itShouldGenerateAToken(invokeGenerateToken);
    });

    describe('generateAuthorizationHeader', function () {
        it('should prefix the token with "Bearer" followed by a space', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {privateKey: privateKey};
            createAuthenticator().generateAuthorizationHeader(claims, options, function (error, headerValue) {
                expect(error).toBeNull('error');
                expect(headerValue.substr(0, 7)).toBe('Bearer ');
                done();
            });
        });

        var invokeGenerateAuthorizationHeader = function (claims, options, callback) {
            return createAuthenticator().generateAuthorizationHeader(claims, options, function (error, headerValue) {
                var token = (headerValue || '').split(' ')[1];
                callback(error, token);
            });
        };

        itShouldGenerateAToken(invokeGenerateAuthorizationHeader);
    });

    describe('validate', function () {
        var createJwtToken = function (privateKeyName, payload) {
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/' + privateKeyName + '.pem');
            payload = payload || {'iss': 'an-issuer'};
            return jwtSimple.encode(payload, privateKey, 'RS256');
        };

        it('should validate a jwt token', function (done) {
            var jwtToken = createJwtToken('private');

            createAuthenticator().validate(jwtToken, function(error, claims) {
                expect(error).toBeNull('error');
                expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
                done();
            });
        });

        it('should return the error when unable to retrieve the public key', function (done) {
            var jwtToken = createJwtToken('private');

            createAuthenticator('http://localhost:8000/does-not-exist').validate(jwtToken, function (error, claims) {
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

            createAuthenticator().validate(jwtToken, function(error, claims) {
                expect(claims).toBeUndefined('claims');
                expect(error).toBeDefined('error');
                expect(error.message).toBe('invalid signature');
                done();
            });
        });

        it('should return an error when the token is expired', function (done) {
            var expiryTimeInSeconds = new Date(2013, 0, 1).getTime() / 1000;
            var jwtToken = createJwtToken('private', {iss: 'an-issuer', exp: expiryTimeInSeconds});

            createAuthenticator().validate(jwtToken, function(error, claims) {
                expect(claims).toBeUndefined('claims');
                expect(error).toBeDefined('error');
                expect(error.message).toBe('jwt expired');

                done();
            });
        });
    });
});