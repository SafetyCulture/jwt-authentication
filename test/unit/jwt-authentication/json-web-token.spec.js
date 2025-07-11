var specHelpers = require('../support/spec-helpers');

var failTest = specHelpers.failTest;

describe('jwt-authentication/json-web-token', function () {
    var crypto;
    var jsonWebTokenClaims;
    var jsonWebToken;
    var jwtPromiseWrapper;

    beforeEach(function () {
        crypto = jasmine.createSpyObj('crypto', ['randomBytes']);
        crypto.randomBytes.and.callFake(function () {
            return new Buffer('');
        });

        jsonWebTokenClaims = {};
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['decode', 'verify', 'sign']);
        jsonWebToken.verify.and.callFake(function (jwtToken, publicKey, options, callback) {
            callback(undefined, jsonWebTokenClaims);
        });

        jwtPromiseWrapper = specHelpers.requireWithMocks('jwt-authentication/json-web-token', {
            'jsonwebtoken': jsonWebToken,
            'crypto': crypto
        });
    });

    describe('create', function () {
        it('should pass through the arguments to jsonWebToken.sign', function() {
            jwtPromiseWrapper.create({iss: 'issuer', sub: 'subject'}, {kid: 'a-kid', privateKey: 'private-key'});

            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                {iss: 'issuer', sub: 'subject', jti: ''},
                'private-key',
                {algorithm: 'RS256', expiresIn: 30, keyid: 'a-kid'});
        });

        it('should allow expiresInSeconds to be set', function () {
            var claims = {iss: 'issuer', sub: 'subject'};
            var options = {expiresInSeconds: 10, privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.any(Object),
                jasmine.any(String),
                jasmine.objectContaining({expiresIn: 10})
            );
        });

        it('should pass through additional claims if they are passed in', function() {
            jwtPromiseWrapper.create(
                {iss: 'issuer', sub: 'subject', claim1: 'foo', claim2: 'bar'},
                {privateKey: 'private-key'}
            );
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                {iss: 'issuer', sub: 'subject', jti: jasmine.any(String),
                    claim1: 'foo', claim2: 'bar'
                },
                jasmine.any(String),
                jasmine.any(Object));
        });

        it('should pass through the kid as a header option', function () {
            var claims = {iss: 'issuer', sub: 'subject'};
            var options = {kid: 'a-kid', privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.any(Object),
                jasmine.any(String),
                jasmine.objectContaining({
                    keyid: 'a-kid'
                })
            );
        });

        it('should generate random jti claim and include it in the token', function () {
            crypto.randomBytes.and.callFake(function () {
                return new Buffer('20-random-bytes');
            });
            var twentyRandomBytesInHex = '32302d72616e646f6d2d6279746573';

            var claims = {iss: 'issuer', sub: 'subject'};
            var options = {kid: 'a-kid', privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);

            expect(crypto.randomBytes).toHaveBeenCalledWith(20);

            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    jti: twentyRandomBytesInHex
                }),
                jasmine.any(String),
                jasmine.any(Object)
            );
        });

        it('should not be possible to override the jti claim', function () {
            var claims = {jti: ['not', 'a string']};
            var options = {kid: 'a-kid', privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);

            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    jti: jasmine.any(String)
                }),
                jasmine.any(String),
                jasmine.any(Object)
            );
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

            expect(jsonWebToken.verify).toHaveBeenCalledWith('jwt-token', 'public-key',
                {ignoreExpiration: true, ignoreNotBefore: true, clockTolerance: 60}, jasmine.any(Function));
        });

        it('should return the claims when the token verification is successful', function (done) {
            jsonWebTokenClaims = {some: 'claims'};

            jwtPromiseWrapper.verify('jwt-token', 'public-key').fail(failTest(done)).then(function (claims) {
                expect(claims).toEqual({some: 'claims'});
                done();
            });
        });

        it('should return the error when the token verification fails', function (done) {
            jsonWebToken.verify.and.callFake(function (jwtToken, publicKey, options, callback) {
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
