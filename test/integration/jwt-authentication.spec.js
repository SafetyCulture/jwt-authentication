var _ = require('lodash');
var fs = require('fs');
var jwtSimple = require('jwt-simple');
var jwtGeneratorFactory = require('../../lib/client/jwt-generator');
var jwtValidatorFactory = require('../../lib/server/validator/jwt-validator');
var q = require('q');
var jasmineHttpServerSpy = require('jasmine-http-server-spy');

describe ('jwt-authentication', function () {

    var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');
    var privateKeyDataUri = fs.readFileSync('test/integration/key-server/an-issuer/private-datauri');
    var incorrectPrivateKey = fs.readFileSync('test/integration/key-server/an-issuer/private-wrong.pem');

    var createGenerator = function () {
        return jwtGeneratorFactory.create();
    };

    var createValidator = function (publicKeyServer) {
        return jwtValidatorFactory.create(
            {
                publicKeyBaseUrl: publicKeyServer || 'http://localhost:8000/',
                resourceServerAudience: 'inttest'
            }
        );
    };

    it('should throw error if config is null', function() {
        var create = _.partial(jwtValidatorFactory.create, null);
        expect(create).toThrow(new Error('Required config value config.publicKeyBaseUrl is missing.'));
        create = _.partial(jwtValidatorFactory.create, {publicKeyBaseUrl: 'http://localhost:8000'});
        expect(create).toThrow(new Error('Required config value config.resourceServerAudience is missing.'));
    });

    var itShouldGenerateAToken = function (generateToken) {
        var validateJwtToken = function (token, publicKeyName) {
            var publicKey = fs.readFileSync('test/integration/key-server/an-issuer/' + publicKeyName + '.pem');
            return jwtSimple.decode(token, publicKey);
        };

        it('should create a correctly signed jwt token', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience', foo: 'abc', bar: 123};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
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

        it('should create a correctly signed jwt token with data-uri private key', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience', foo: 'abc', bar: 123};
            var options = {kid: 'an-issuer/public.pem', privateKey: privateKeyDataUri};
            generateToken(claims, options, function (error, token) {
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

        it('should create a correctly signed jwt token with audience as an array', function (done) {
            var claims = {
                iss: 'an-issuer',
                sub: 'a-subject',
                aud: ['an-audience', 'another-audience'],
                foo: 'abc',
                bar: 123
            };
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeNull('error');

                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.iss).toEqual('an-issuer');
                expect(actualClaims.sub).toEqual('a-subject');
                expect(actualClaims.aud).toEqual(['an-audience', 'another-audience']);
                expect(actualClaims.foo).toEqual('abc');
                expect(actualClaims.bar).toEqual(123);
                done();
            });
        });

        it('should contain the kid header in the token', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience', foo: 'abc', bar: 123};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeNull('error');

                var segments = token.split('.');
                var headerSegment = segments[0];
                var header = JSON.parse(new Buffer(headerSegment, 'base64').toString());

                expect(header.kid).toBe('path/to/publicKey');
                done();
            });
        });

        it('should create tokens with a default expiry of 30 seconds', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
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
            var options = {expiresInSeconds: 600, kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeNull('error');
                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.exp).toBe(actualClaims.iat + 600, 'expires');
                done();
            });
        });

        it('should allow not before to be set', function (done) {
            var notBefore = new Date(2000, 1, 1, 1, 1, 1, 1) / 1000;
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {notBefore: notBefore, kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeNull('error');
                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.nbf).toBe(notBefore, 'not before');
                done();
            });
        });

        it('should create a signed jwt token that can only be verified with the right public key', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {privateKey: incorrectPrivateKey, kid: 'path/to/publicKey'};
            generateToken(claims, options, function(error, token) {
                expect(error).toBeNull('error');

                var validate = _.partial(validateJwtToken, token, 'public');
                expect(validate).toThrow(new Error('Signature verification failed'));
                done();
            });
        });

        it('should create tokens with a generated jti claim', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeNull('error');

                var actualClaims = validateJwtToken(token, 'public');
                expect(actualClaims.jti).toEqual(jasmine.any(String));
                done();
            });
        });

        it('should not be trivial to generate the same jti claim twice', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};

            var generateTokenWithClaims = q.nfbind(generateToken, claims, options);

            q.all([generateTokenWithClaims(), generateTokenWithClaims()]).spread(function (token1, token2) {
                var claims1 = validateJwtToken(token1, 'public');
                var claims2 = validateJwtToken(token2, 'public');

                expect(claims1.jti).not.toEqual(claims2.jti);
                done();
            }).fail(function () {
                done('Expected promise to succeed');
            });
        });

        it('should return an error if claims are missing "iss" field', function (done) {
            var claims = {sub: 'a-subject', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should return an error if claims are missing "sub" field', function (done) {
            var claims = {iss: 'an-issuer', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should return an error if claims are missing "aud" field', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should return an error if options are missing "kid" field', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {privateKey: privateKey};
            generateToken(claims, options, function (error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Options must contain "privateKey" and "kid" fields');
                expect(token).toBeUndefined();
                done();
            });
        });
    };

    describe('generateToken', function () {
        var invokeGenerateToken = function (claims, options, callback) {
            return createGenerator().generateToken(claims, options, callback);
        };

        itShouldGenerateAToken(invokeGenerateToken);
    });

    describe('generateAuthorizationHeader', function () {
        it('should prefix the token with "Bearer" followed by a space', function (done) {
            var claims = {iss: 'an-issuer', sub: 'a-subject', aud: 'an-audience'};
            var options = {kid: 'path/to/publicKey', privateKey: privateKey};
            createGenerator().generateAuthorizationHeader(claims, options, function (error, headerValue) {
                expect(error).toBeNull('error');
                expect(headerValue.substr(0, 7)).toBe('Bearer ');
                done();
            });
        });

        var invokeGenerateAuthorizationHeader = function (claims, options, callback) {
            return createGenerator().generateAuthorizationHeader(claims, options, function (error, headerValue) {
                var token = (headerValue || '').split(' ')[1];
                callback(error, token);
            });
        };

        itShouldGenerateAToken(invokeGenerateAuthorizationHeader);
    });

    describe('validate', function () {

        beforeEach(function() {
            jasmine.clock().install();
            jasmine.clock().mockDate(new Date(2016, 1, 1));
        });

        afterEach(function() {
            jasmine.clock().uninstall();
        });

        var createJwtToken = function (privateKeyName, payload) {
            var deferred = q.defer();
            var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/' + privateKeyName + '.pem');
            var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: 'inttest'};
            var options = _.extend({}, payload, {kid: 'an-issuer/public.pem', privateKey: privateKey});
            createGenerator().generateToken(claims, options, function(error, token) {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(token);
                }
            });
            return deferred.promise;
        };

        it('should validate a jwt token', function (done) {
            createJwtToken('private').then(function(jwtToken) {
                createValidator().validate(jwtToken, ['an-issuer'], function(error, claims) {
                    expect(claims).toEqual({
                        iss : 'an-issuer',
                        sub : 'an-issuer',
                        aud : 'inttest',
                        jti : jasmine.any(String),
                        iat : jasmine.any(Number),
                        exp : jasmine.any(Number)
                    });
                    done();
                });
            });
        });

        it('should return the error when unable to retrieve the public key', function (done) {

            createJwtToken('private').then(function(jwtToken) {
                createValidator('http://localhost:8000/does-not-exist/')
                    .validate(jwtToken, ['an-issuer'], function (error, claims) {
                        expect(claims).toBeUndefined('claims');
                        expect(error).toBeDefined('error');
                        expect(error.message).toBe('Unable to retrieve public key. ' +
                            'Error: "Request failed with status code 404" ' +
                            'Url: "http://localhost:8000/does-not-exist/an-issuer/public.pem"');
                        done();
                    });
                }
            );
        });

        it('should return the error when validating the jwt token fails', function (done) {
            createJwtToken('private-wrong').then(function(jwtToken) {
                createValidator().validate(jwtToken, ['an-issuer'], function (error, claims) {
                    expect(claims).toBeUndefined('claims');
                    expect(error).toBeDefined('error');
                    expect(error.message).toBe('invalid signature');
                    done();
                });
            });
        });

        it('should return an error when the token is expired', function (done) {
            var issuedAt = Math.floor(Date.now() / 1000) - 100;
            createJwtToken('private', {iat: issuedAt, expiresInSeconds: -31}).then(function(jwtToken) {
                createValidator().validate(jwtToken,['an-issuer'], function (error, claims) {
                    expect(claims).toBeUndefined('claims');
                    expect(error).toBeDefined('error');
                    expect(error.message).toBe('Expiry time set before issue time');
                    done();
                });
            });
        });

        it('should allow 30 seconds leeway when the token is expired', function (done) {
            // For jsonwebtoken v9.0.2, we need to construct a token that's slightly expired but within leeway
            // Using current time minus 15 seconds as the expiration (within the 30s leeway)
            var now = Math.floor(Date.now() / 1000);
            var issuedAt = now - 60; // Issued 60 seconds ago
            var expiresAt = now - 15; // Expired 15 seconds ago (within 30s leeway)
            
            // Calculate expiry in seconds from issued time
            var expiresInSeconds = expiresAt - issuedAt;
            
            createJwtToken('private', {iat: issuedAt, expiresInSeconds: expiresInSeconds}).then(function(jwtToken) {
                createValidator().validate(jwtToken, ['an-issuer'], function (error, claims) {
                    expect(claims).toEqual(jasmine.objectContaining({iss: 'an-issuer'}));
                    expect(error).toBe(null);
                    done();
                });
            });

        });

        it('should return an error when the token was created in the future', function (done) {
            var notBefore = Math.floor(Date.now() / 1000) + 31;
            createJwtToken('private', {notBefore: notBefore, expiresInSeconds: 60}).then(function(jwtToken) {
                createValidator().validate(jwtToken,['an-issuer'], function (error, claims) {
                    expect(claims).toBeUndefined();
                    expect(error).toBeDefined();
                    expect(error.message).toBe('The token is not valid yet');
                    done();
                });
            });
        });

        it('should allow 30 seconds leeway when the token was created in the future', function (done) {
            var notBefore = Math.floor(Date.now() / 1000) + 30;
            createJwtToken('private', {notBefore: notBefore, expiresInSeconds: 60}).then(function(jwtToken) {
                createValidator().validate(jwtToken,['an-issuer'], function (error, claims) {
                    expect(claims).toEqual(jasmine.objectContaining({iss: 'an-issuer'}));
                    expect(error).toBe(null);
                    done();
                });
            });
        });

        describe('keyCaching', function() {
            var httpSpy;

            beforeAll(function(done) {
                httpSpy = jasmineHttpServerSpy.createSpyObj('mockServer', [
                    {
                        method: 'get',
                        url: '/an-issuer/public.pem',
                        handlerName: 'getPublicKey'
                    }
                ]);
                return httpSpy.server.start(8082, done);
            });

            afterAll(function(done) {
                httpSpy.server.stop(done);
            });

            afterEach(function() {
                httpSpy.getPublicKey.calls.reset();
            });

            it('should return fetched key from cache', function (done) {
                httpSpy.getPublicKey.and.returnValue('some key');
                createJwtToken('private').then(function(jwtToken) {
                    var validator = createValidator('http://localhost:8082/');
                    validator.validate(jwtToken, ['an-issuer'], function() {
                        expect(httpSpy.getPublicKey).toHaveBeenCalled();
                        httpSpy.getPublicKey.calls.reset();
                        validator.validate(jwtToken, ['an-issuer'], function() {
                            expect(httpSpy.getPublicKey).not.toHaveBeenCalled();
                            done();
                        });
                    });
                });
            });
        });
    });
});