var q = require('q');
var specHelpers = require('./support/spec-helpers');
var _ = require('lodash');

describe('jwt-microservice-helper', function () {
    var jsonWebToken;
    var jwtMicroServiceHelper;
    var request;
    var validator;

    beforeEach(function () {
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['decode', 'verify']);
        jsonWebToken.decode.andReturn({iss: ''});
        jsonWebToken.verify.andReturn(q());

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

    it('should pass the given token to decode', function () {
        validator.validate('json-web-token', _.noop);

        expect(jsonWebToken.decode).toHaveBeenCalledWith('json-web-token');
    });

    it('should fetch the public key for the token', function () {
        jsonWebToken.decode.andReturn({iss: 'an-issuer'});
        validator.validate('json-web-token', _.noop);

        expect(request).toHaveBeenCalledWith('http://a-public-key-server/an-issuer/public.pem');
    });

    it('should verify the token using fetched public key', function (done) {
        request.andReturn(q('public-key'));

        validator.validate('json-web-token', function () {
            expect(jsonWebToken.verify).toHaveBeenCalledWith('json-web-token', 'public-key');
            done();
        });
    });

    it('should return the verified claims', function (done) {
        jsonWebToken.verify.andReturn({iss: 'an-issuer'});

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeUndefined('error');
            expect(claims).toEqual({iss: 'an-issuer'}, 'claims');
            done();
        });
    });

    it('should return an error if the claims section has no "iss" field', function (done) {
        jsonWebToken.decode.andReturn({aToken: 'with-no-iss-field'});

        validator.validate('json-web-token', function (error, claims) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('Cannot verify token with no "iss" claim', 'error.message');
            expect(claims).toBeUndefined('claims');
            done();
        });
    });

    xit('should return an error if it cannot retrieve the public key', function (done) {
    });

    xit('should throw an error if the token cannot be decoded', function () {

    });


    xit('should throw an error if the token verification fails', function () {

    });

    xit('should throw an error if the token has expired', function () {

    });
});