var requireWithMocks = require('./support/require-with-mocks');

describe('jwt-micro-service-helper', function () {
    var jsonWebToken;
    var jwtMicroServiceHelper;
    var request;
    var validator;
    var callback;

    beforeEach(function () {
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['decode', 'verify']);
        jsonWebToken.decode.andReturn({
            iss: ''
        });

        request = jasmine.createSpy('request');

        jwtMicroServiceHelper = requireWithMocks('jwtMicroServiceHelper', {
            'jsonwebtoken': jsonWebToken,
            'request': request
        });

        validator = jwtMicroServiceHelper.create({
            publicKeyServer: 'http://a-public-key-server'
        });

        callback = jasmine.createSpy('callback');
    });

    it('should pass the given token to decode', function () {
        validator.validate('json-web-token', callback);

        expect(jsonWebToken.decode).toHaveBeenCalledWith('json-web-token');
    });

    it('should fetch the public key for the token', function () {
        jsonWebToken.decode.andReturn({
            iss: 'an-issuer'
        });

        validator.validate('json-web-token', callback);

        expect(request).toHaveBeenCalledWith(
            'http://a-public-key-server/an-issuer/public.pem', jasmine.any(Function)
        );
    });

    it('should return an error if the claims section has no "iss" field', function () {
        jsonWebToken.decode.andReturn({
            foo: 'a-random-value'
        });

        validator.validate('json-web-token', callback);

        expect(callback).toHaveBeenCalledWith('Cannot verify token with no "iss" claim');
    });

    it('should attempt to verify the token using fetched public key', function () {
        validator.validate('json-web-token', callback);

        var requestCallback = request.mostRecentCall.args[1];
        requestCallback(undefined, {}, 'public-key');

        expect(jsonWebToken.verify).toHaveBeenCalledWith('json-web-token', 'public-key', {}, jasmine.any(Function));
    });

    it('should return an error if it cannot retrieve the public key', function () {
        validator.validate('json-web-token', callback);

        var requestCallback = request.mostRecentCall.args[1];
        requestCallback('Error retrieving public key', undefined, undefined);

        expect(callback).toHaveBeenCalledWith('Error retrieving public key');
    });

    it('should return the decoded claims section if verification is successful', function () {
        jsonWebToken.decode.andReturn({
            iss: 'an-issuer'
        });

        var claims = validator.validate('json-web-token', callback);

        expect(callback).toHaveBeenCalledWith(undefined, {iss: 'an-issuer'});
    });

    xit('should throw an error if the token cannot be decoded', function () {

    });


    xit('should throw an error if the token verification fails', function () {

    });

    xit('should throw an error if the token has expired', function () {

    });
});