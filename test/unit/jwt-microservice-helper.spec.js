var q = require('q');
var specHelpers = require('./support/spec-helpers');

describe('jwt-microservice-helper', function () {
    var jsonWebToken;
    var jwtMicroServiceHelper;
    var request;
    var validator;

    beforeEach(function () {
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['create', 'decode', 'verify']);
        jsonWebToken.decode.andReturn({iss: 'default-issuer'});
        jsonWebToken.verify.andReturn(q());
        jsonWebToken.create.andReturn('token');

        request = jasmine.createSpy('request');
        request.andReturn(q());

        jwtMicroServiceHelper = specHelpers.requireWithMocks('jwt-microservice-helper', {
            './jwt-microservice-helper/json-web-token': jsonWebToken,
            './jwt-microservice-helper/request': request
        });

        validator = jwtMicroServiceHelper.create({
            publicKeyServer: 'http://a-public-key-server'
        });
    });

    it('should throw an error if config.publicKeyServer is not set', function() {
        expect(function () {jwtMicroServiceHelper.create({foo: 'bar'});}).toThrow(
            new Error('Required config value config.publicKeyServer is missing.'));
    });

    var checkGenerateTokenHappyPath = function(functionToTest, expectedTokenValue, done) {
        validator[functionToTest]({iss: 'iss', sub: 'sub', foo: 'bar'}, {privateKey: 'key'}, function(error, token) {
            expect(jsonWebToken.create).toHaveBeenCalledWith({iss: 'iss', sub: 'sub', foo: 'bar'}, 'key');
            expect(error).toBeNull();
            expect(token).toBe(expectedTokenValue);
            done();
        });
    };

    it('should pass arguments to create', function(done) {
        checkGenerateTokenHappyPath('generateToken', 'token', done);
        checkGenerateTokenHappyPath('generateAuthorizationHeader', 'x-atl-jwt token', done);
    });

    var checkThatErrorIsReturnedWhenOptionsIsNull = function(functionToTest, done) {
        validator[functionToTest]({iss: 'iss', sub: 'sub'}, null, function(error, token) {
            expect(jsonWebToken.create).not.toHaveBeenCalled();
            expect(error).toEqual(new Error('Required value options.privateKey is'));
            expect(token).toBeUndefined();
            done();
        });
    };

    it('should throw an error if options is null', function(done) {
        checkThatErrorIsReturnedWhenOptionsIsNull('generateToken', done);
        checkThatErrorIsReturnedWhenOptionsIsNull('generateAuthorizationHeader', done);
    });

    var checkThatErrorIsReturnedWhenPrivateKeyIsMissing = function(functionToTest, done) {
        validator[functionToTest]({iss: 'iss', sub: 'sub'}, {publicKey: 'key'}, function(error, token) {
            expect(jsonWebToken.create).not.toHaveBeenCalled();
            expect(error).toEqual(new Error('Required value options.privateKey is missing'));
            expect(token).toBeUndefined();
            done();
        });
    };

    it('should throw an error if options.privateKey is missing', function(done) {
        checkThatErrorIsReturnedWhenPrivateKeyIsMissing('generateToken', done);
        checkThatErrorIsReturnedWhenPrivateKeyIsMissing('generateAuthorizationHeader', done);
    });

    it('should pass the given token to decode', function (done) {
        validator.validate('json-web-token', function () {
            expect(jsonWebToken.decode).toHaveBeenCalledWith('json-web-token');
            done();
        });
    });

    it('should fetch the public key for the token', function (done) {
        jsonWebToken.decode.andReturn({iss: 'an-issuer'});

        validator.validate('json-web-token', function () {
            expect(request).toHaveBeenCalledWith('http://a-public-key-server/an-issuer/public.pem');
            done();
        });
    });

    it('should verify the token using fetched public key', function (done) {
        request.andReturn(q('public-key'));

        validator.validate('json-web-token', function () {
            expect(jsonWebToken.verify).toHaveBeenCalledWith('json-web-token', 'public-key');
            done();
        });
    });

    it('should return the verified claims', function (done) {
        jsonWebToken.verify.andReturn(q({iss: 'an-issuer'}));

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeNull('error');
            expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
            done();
        });
    });

    it('should return the error when decoding the claims fails', function (done) {
        jsonWebToken.decode.andThrow(new Error('decode failed'));

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('decode failed', 'error.message');
            expect(claims).toBeUndefined('claims');
            done();
        });
    });

    it('should return an error when the claims section has no "iss" field', function (done) {
        jsonWebToken.decode.andReturn({aToken: 'with-no-iss-field'});

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('Cannot verify token with no "iss" claim', 'error.message');
            expect(claims).toBeUndefined('claims');
            done();
        });
    });

    it('should return the error when fetching the public key fails', function (done) {
        request.andReturn(q.reject(new Error('request failed')));

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('request failed');
            expect(claims).toBeUndefined('claims');
            done();
        });
    });

    it('should return the error when verifying the token fails', function (done) {
        jsonWebToken.verify.andReturn(q.reject(new Error('token verification failed')));

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('token verification failed');
            expect(claims).toBeUndefined('claims');
            done();
        });
    });

    it('should not invoke the callback with errors thrown from the callback', function () {
        var callback = jasmine.createSpy('callback').andThrow(new Error('oh no!'));
        validator.validate('json-web-token', callback);

        waitsFor(function () {
            return callback.callCount > 0;
        });

        runs(function () {
            expect(callback.callCount).toBe(1);
        });
    });
});