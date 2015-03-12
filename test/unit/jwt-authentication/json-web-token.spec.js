var specHelpers = require('../support/spec-helpers');

var failTest = specHelpers.failTest;

describe('jwt-authentication/json-web-token', function () {
    var crypto;
    var jsonWebTokenClaims;
    var jsonWebToken;
    var jwtPromiseWrapper;

    beforeEach(function () {
        crypto = jasmine.createSpyObj('crypto', ['randomBytes']);
        crypto.randomBytes.andCallFake(function (numBytes) {
            return new Buffer(numBytes + '');
        });

        jsonWebTokenClaims = {};
        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['decode', 'verify', 'sign']);
        jsonWebToken.verify.andCallFake(function (jwtToken, publicKey, callback) {
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
                {iss: 'issuer', sub: 'subject', jti: jasmine.any(String)},
                'private-key',
                {algorithm: 'RS256', expiresInMinutes: 0.5, header: {kid: 'a-kid'}});
        });

        it('should allow expiresInMinutes to be set', function () {
            var claims = {iss: 'issuer', sub: 'subject'};
            var options = {expiresInMinutes: 10, privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.any(Object),
                jasmine.any(String),
                jasmine.objectContaining({expiresInMinutes: 10})
            );
        });

        it('should pass through additional claims if they are passed in', function() {
            jwtPromiseWrapper.create(
                {iss: 'issuer', sub: 'subject', claim1: 'foo', claim2: 'bar'},
                {privateKey: 'private-key'}
            );
            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                {iss: 'issuer', sub: 'subject', jti: jasmine.any(String), claim1: 'foo', claim2: 'bar'},
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
                    header: {
                        kid: 'a-kid'
                    }
                })
            );
        });

        it('should generate random jti claim and include it in the token', function () {
            var claims = {iss: 'issuer', sub: 'subject'};
            var options = {kid: 'a-kid', privateKey: 'private-key'};
            jwtPromiseWrapper.create(claims, options);

            var twentyBytes = 20;
            var twentyBytesStringInHex = '3230';

            expect(crypto.randomBytes).toHaveBeenCalledWith(twentyBytes);

            expect(jsonWebToken.sign).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    jti: twentyBytesStringInHex
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