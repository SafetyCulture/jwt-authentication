var q = require('q');
var specHelpers = require('../support/spec-helpers');

describe('jwt-generator', function () {
    var jsonWebToken;
    var jwtAuthentication;
    var request;
    var validator;

    beforeEach(function () {
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['create', 'decode', 'verify']);
        jsonWebToken.decode.and.returnValue({iss: 'default-issuer'});
        jsonWebToken.verify.and.returnValue(q());
        jsonWebToken.create.and.returnValue('');

        request = jasmine.createSpy('request');
        request.and.returnValue(q());

        jwtAuthentication = specHelpers.requireWithMocks('/client/jwt-generator', {
            '../jwt-authentication/json-web-token': jsonWebToken
        });

        validator = jwtAuthentication.create({
            publicKeyServer: 'http://a-public-key-server',
            resourceServerAudience: 'an-audience'
        });
    });

    var itShouldGenerateAToken = function (methodToTestName) {
        var generateToken = function (claims, options, callback) {
            return validator[methodToTestName](claims, options, callback);
        };

        it('should create a jwt token', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud', foo: 'bar'};
            var options = {kid: 'kid', privateKey: 'key'};
            generateToken(claims, options, function () {
                var expectedClaims = {iss: 'iss', sub: 'sub', aud: 'aud', foo: 'bar'};
                var expectedOptions = {expiresInSeconds: undefined, kid: 'kid', privateKey: 'key',
                    iat: undefined, notBefore: undefined};
                expect(jsonWebToken.create).toHaveBeenCalledWith(expectedClaims, expectedOptions);
                done();
            });
        });

        it('should create a jwt token with audience as an array', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: ['aud1', 'aud2'], foo: 'bar'};
            var options = {kid: 'kid', privateKey: 'key'};
            generateToken(claims, options, function () {
                var expectedClaims = {iss: 'iss', sub: 'sub', aud: ['aud1', 'aud2'], foo: 'bar'};
                var expectedOptions = {expiresInSeconds: undefined, kid: 'kid', privateKey: 'key',
                    iat: undefined, notBefore: undefined};
                expect(jsonWebToken.create).toHaveBeenCalledWith(expectedClaims, expectedOptions);
                done();
            });
        });

        it('should allow the expiry to be set on the token', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {expiresInSeconds: 600, kid:'kid', privateKey: 'key'};
            generateToken(claims, options, function () {
                var expectedClaims = {iss: 'iss', sub: 'sub', aud: 'aud'};
                var expectedOptions = {expiresInSeconds: 600, kid: 'kid', privateKey: 'key',
                    iat: undefined, notBefore: undefined };
                expect(jsonWebToken.create).toHaveBeenCalledWith(expectedClaims, expectedOptions);
                done();
            });
        });

        it('should allow the not before to be set on the token', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {notBefore: 600, kid:'kid', privateKey: 'key'};
            generateToken(claims, options, function () {
                var expectedClaims = {iss: 'iss', sub: 'sub', aud: 'aud'};
                var expectedOptions = {expiresInSeconds: undefined, notBefore: 600, kid: 'kid',
                    privateKey: 'key', iat: undefined};
                expect(jsonWebToken.create).toHaveBeenCalledWith(expectedClaims, expectedOptions);
                done();
            });
        });

        it('should throw an error if options is null', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = null;
            generateToken(claims, options, function(error, token) {
                expect(jsonWebToken.create).not.toHaveBeenCalled();
                expect(error).toBeDefined();
                expect(error.message).toEqual('Options must contain "privateKey" and "kid" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should throw an error if options.privateKey is missing', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {kid: 'kid', publicKey: 'key'};
            generateToken(claims, options, function(error, token) {
                expect(jsonWebToken.create).not.toHaveBeenCalled();
                expect(error).toBeDefined();
                expect(error.message).toEqual('Options must contain "privateKey" and "kid" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        it('should throw an error if options.kid is missing', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {privateKey: 'key'};
            generateToken(claims, options, function(error, token) {
                expect(jsonWebToken.create).not.toHaveBeenCalled();
                expect(error).toBeDefined();
                expect(error.message).toEqual('Options must contain "privateKey" and "kid" fields');
                expect(token).toBeUndefined();
                done();
            });
        });

        var itShouldThrowErrorWhenClaimsAreInvalid = function (spec, claims) {
            it('should throw an error if ' + spec, function (done) {
                var options = {kid: 'kid', privateKey: 'key'};
                generateToken(claims, options, function (error, token) {
                    expect(jsonWebToken.create).not.toHaveBeenCalled();
                    expect(error).toBeDefined();
                    expect(error.message).toBe('claims body must contain "iss", "sub" and "aud" fields');
                    expect(token).toBeUndefined();
                    done();
                });
            });
        };

        describe('claims validation', function () {
            itShouldThrowErrorWhenClaimsAreInvalid('claims is null', null);

            itShouldThrowErrorWhenClaimsAreInvalid('iss field is missing', {sub: 'sub', aud: 'aud'});
            itShouldThrowErrorWhenClaimsAreInvalid('sub field is missing', {iss: 'iss', aud: 'aud'});
            itShouldThrowErrorWhenClaimsAreInvalid('aud field is missing', {iss: 'iss', sub: 'sub'});

            itShouldThrowErrorWhenClaimsAreInvalid('iss field is null', {iss: null, sub: 'sub', aud: 'aud'});
            itShouldThrowErrorWhenClaimsAreInvalid('sub field is null', {iss: 'iss', sub: null, aud: 'aud'});
            itShouldThrowErrorWhenClaimsAreInvalid('aud field is null', {iss: 'iss', sub: 'sub', aud: null});
        });

        it('should throw an error if signing the token generated an error', function (done) {
            jsonWebToken.create.and.callFake(function () {
                throw new Error('jsonWebTokenCreateError');
            });

            var claims = {iss: 'iss', aud: 'aud', sub: 'sub'};
            var options = {kid:'kid', privateKey: 'key'};
            generateToken(claims, options, function(error, token) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Error generating token: jsonWebTokenCreateError');
                expect(token).toBeUndefined();
                done();
            });
        });
    };

    describe('generateToken', function () {
        it('should return the generated token', function (done) {
            jsonWebToken.create.and.returnValue('token');

            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {kid:'kid', privateKey: 'key'};
            validator.generateToken(claims, options, function (error, token) {
                expect(error).toBeNull();
                expect(token).toBe('token');
                done();
            });
        });

        it('should invoke the callback exactly once', function() {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {kid: 'kid', privateKey: 'key'};

            var callback = jasmine.createSpy('callback').and.throwError(new Error('expected error'));
            var invokeGenerateToken = function () {
                validator.generateToken(claims, options, callback);
            };

            expect(invokeGenerateToken).toThrow(new Error('expected error'));
            expect(callback.calls.count()).toBe(1);
        });

        itShouldGenerateAToken('generateToken');
    });

    describe('generateAuthorizationHeader', function () {
        it('should return the authorization header containing the token', function (done) {
            jsonWebToken.create.and.returnValue('token');

            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {kid:'kid', privateKey: 'key'};
            validator.generateAuthorizationHeader(claims, options, function (error, headerValue) {
                expect(error).toBeNull();
                expect(headerValue).toBe('Bearer token');
                done();
            });
        });

        itShouldGenerateAToken('generateAuthorizationHeader');
    });
});