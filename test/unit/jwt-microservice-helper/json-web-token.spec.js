var specHelpers = require('../support/spec-helpers');

var failTest = specHelpers.failTest;

describe('jwt-microservice-helper/json-web-token', function () {
    var jsonWebTokenClaims;
    var jsonWebToken;
    var jwtPromiseWrapper;

    beforeEach(function () {
        jsonWebTokenClaims = {};
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['decode', 'verify', 'sign']);
        jsonWebToken.verify.andCallFake(function (jwtToken, publicKey, callback) {
            callback(undefined, jsonWebTokenClaims);
        });

        jwtPromiseWrapper = specHelpers.requireWithMocks('jwt-microservice-helper/json-web-token', {
            'jsonwebtoken': jsonWebToken
        });
    });

    describe('create', function () {
        it('should pass through the arguments to jsonWebToken.sign', function() {
            jwtPromiseWrapper.create({iss: 'issuer', sub: 'subject'}, 'private-key');
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                {iss: 'issuer', sub: 'subject'},
                'private-key',
                {algorithm: 'RS256'});
        });

        it('should pass through additional claims if they are passed in', function() {
            jwtPromiseWrapper.create({iss: 'issuer', sub: 'subject', claim1: 'foo', claim2: 'bar'}, 'private-key');
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                {iss: 'issuer', sub: 'subject', claim1: 'foo', claim2: 'bar'},
                'private-key',
                {algorithm: 'RS256'});
        });
    });

    describe('decode', function () {
        it('should decode a token', function () {
            expect(jwtPromiseWrapper.decode).toBe(jsonWebToken.decode);
        });
    });

    describe('verify', function () {
        it('should pass through the arguments to jsonWebToken.verify', function () {
            jwtPromiseWrapper.verify('jwt-token', 'public-key');

            expect(jsonWebToken.verify).toHaveBeenCalledWith('jwt-token', 'public-key', jasmine.any(Function));
        });

        it('should return the claims when the token verification is successful', function (done) {
            jsonWebTokenClaims = {some: 'claims'};

            jwtPromiseWrapper.verify('jwt-token', 'public-key').fail(failTest(done)).then(function (claims) {
                expect(claims).toEqual({some: 'claims'});
                done();
            });
        });

        it('should return the error when the token verification fails', function (done) {
            jsonWebToken.verify.andCallFake(function (jwtToken, publicKey, callback) {
                callback(new Error('an error'));
            });

            jwtPromiseWrapper.verify('jwt-token', 'public-key').then(failTest(done)).fail(function (error) {
                expect(error).toBeDefined('error');
                expect(error.message).toBe('an error');
                done();
            });
        });
    });
});