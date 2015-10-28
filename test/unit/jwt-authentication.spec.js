var q = require('q');
var specHelpers = require('./support/spec-helpers');

describe('jwt-authentication', function () {
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

        jwtAuthentication = specHelpers.requireWithMocks('jwt-authentication', {
            './jwt-authentication/json-web-token': jsonWebToken,
            './jwt-authentication/request': request
        });

        validator = jwtAuthentication.create({
            publicKeyServer: 'http://a-public-key-server'
        });
    });

    it('should throw an error if config.publicKeyServer is not set', function() {
        expect(function () {jwtAuthentication.create({foo: 'bar'});}).toThrow(
            new Error('Required config value config.publicKeyServer is missing.'));
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
                var expectedOptions = {expiresInMinutes: undefined, kid: 'kid', privateKey: 'key'};
                expect(jsonWebToken.create).toHaveBeenCalledWith(expectedClaims, expectedOptions);
                done();
            });
        });

        it('should allow the expiry to be set on the token', function (done) {
            var claims = {iss: 'iss', sub: 'sub', aud: 'aud'};
            var options = {expiresInMinutes: 10, kid:'kid', privateKey: 'key'};
            generateToken(claims, options, function () {
                var expectedClaims = {iss: 'iss', sub: 'sub', aud: 'aud'};
                var expectedOptions = {expiresInMinutes: 10, kid: 'kid', privateKey: 'key'};
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

    describe('validate', function () {
        it('should pass the given token to decode', function (done) {
            validator.validate('json-web-token', function () {
                expect(jsonWebToken.decode).toHaveBeenCalledWith('json-web-token');
                done();
            });
        });

        it('should fetch the public key for the token', function (done) {
            jsonWebToken.decode.and.returnValue({iss: 'an-issuer'});

            validator.validate('json-web-token', function () {
                expect(request).toHaveBeenCalledWith('http://a-public-key-server/an-issuer/public.pem');
                done();
            });
        });

        it('should verify the token using fetched public key', function (done) {
            request.and.returnValue(q('public-key'));

            validator.validate('json-web-token', function () {
                expect(jsonWebToken.verify).toHaveBeenCalledWith('json-web-token', 'public-key');
                done();
            });
        });

        it('should return the verified claims', function (done) {
            jsonWebToken.verify.and.returnValue(q({iss: 'an-issuer'}));

            validator.validate('json-web-token', function (error, claims) {
                expect(error).toBeNull('error');
                expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
                done();
            });
        });

        it('should return the error when decoding the claims fails', function (done) {
            jsonWebToken.decode.and.throwError('decode failed');

            validator.validate('json-web-token', function (error, claims) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('decode failed', 'error.message');
                expect(claims).toBeUndefined('claims');
                done();
            });
        });

        it('should return an error when the claims section has no "iss" field', function (done) {
            jsonWebToken.decode.and.returnValue({aToken: 'with-no-iss-field'});

            validator.validate('json-web-token', function (error, claims) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('Cannot verify token with no "iss" claim', 'error.message');
                expect(claims).toBeUndefined('claims');
                done();
            });
        });

        it('should return the error when fetching the public key fails', function (done) {
            request.and.returnValue(q.reject(new Error('request failed')));

            validator.validate('json-web-token', function (error, claims) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('request failed');
                expect(claims).toBeUndefined('claims');
                done();
            });
        });

        it('should return the error when verifying the token fails', function (done) {
            jsonWebToken.verify.and.returnValue(q.reject(new Error('token verification failed')));

            validator.validate('json-web-token', function (error, claims) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('token verification failed');
                expect(claims).toBeUndefined('claims');
                done();
            });
        });

        //it('should not invoke the callback with errors thrown from the callback', function () {
        //    var callback = jasmine.createSpy('callback').and.throwError('oh no!');
        //    validator.validate('json-web-token', callback);
        //
        //    waitsFor(function () {
        //        return callback.callCount > 0;
        //    });
        //
        //    runs(function () {
        //        expect(callback.callCount).toBe(1);
        //    });
        //});
    });
});