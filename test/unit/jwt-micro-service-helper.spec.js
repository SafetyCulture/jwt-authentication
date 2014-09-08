var requireWithMocks = require('./support/require-with-mocks');

describe('jwt-micro-service-helper', function () {
    var jsonWebToken;
    var jwtMicroServiceHelper;
    var request;
    var validator;

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
    });

    it('should fetch the public key for the token', function () {
        jsonWebToken.decode.andReturn({
            iss: 'an-issuer'
        });

        validator.validate('json-web-token');

        expect(request).toHaveBeenCalledWith(
            'http://a-public-key-server/an-issuer/public.pem', jasmine.any(Function)
        );
    });

    it('should pass the given token to decode', function () {
        validator.validate('json-web-token');

        expect(jsonWebToken.decode).toHaveBeenCalledWith('json-web-token');
    });

    it('should attempt to verify the token using fetched public key', function () {
        var validator = jwtMicroServiceHelper.create({
            publicKeyServer: 'http://a-public-key-server'
        });

        validator.validate('json-web-token');

        var requestCallback = request.mostRecentCall.args[1];
        requestCallback(undefined, {}, 'public-key');

        expect(jsonWebToken.verify).toHaveBeenCalledWith('json-web-token', 'public-key');
    });
});