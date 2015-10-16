var jwtMiddleware = require('../../../../lib/server/http/jwt-auth-middleware');

describe('jwtAuthMiddleware', function() {
    var authMiddleware;
    var jwtAuthenticator;
    var logger;
    var response;
    var next;

    var getRequestWithHeader = function(headerValue) {
        return {
            headers: headerValue || {}
        };
    };

    beforeEach(function() {
        jwtAuthenticator = jasmine.createSpyObj('jwtAuthenticator', ['validate']);
        jwtAuthenticator.validate.and.callFake(function(token, authorizedSubjects, callback) {
            callback(null, {claims: 'claims'});
        });
        logger = jasmine.createSpyObj('logger', ['info']);
        response = jasmine.createSpyObj('response', ['end', 'setHeader']);
        next = jasmine.createSpy('next');

        authMiddleware = jwtMiddleware.create(jwtAuthenticator, ['an-issuer'], logger);
    });

    it('should fail if authorization header is not set', function(done) {
        authMiddleware(getRequestWithHeader(), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.argsForCall[0][0].message)
                    .toBe('Request to billing service had missing or incorrect credentials.');
                expect(JSON.parse(response.end.argsForCall[0][0]).errors[0].originalError)
                    .toBe('Missing authorization header');
                expect(response.statusCode).toBe(401);
                done();
            });
    });

    it('should fail if authorization header has wrong format', function(done) {
        authMiddleware(getRequestWithHeader({authorization: 'wrong-format'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.argsForCall[0][0].message)
                    .toBe('Request to billing service had missing or incorrect credentials.');
                expect(JSON.parse(response.end.argsForCall[0][0]).errors[0].originalError)
                    .toBe('Authorization header has a wrong format');
                expect(response.statusCode).toBe(401);
                done();
            });
    });

    it('should fail if authorization header has wrong scheme', function(done) {
        authMiddleware(getRequestWithHeader({authorization: 'Base someauth'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.argsForCall[0][0].message)
                    .toBe('Request to billing service had missing or incorrect credentials.');
                expect(JSON.parse(response.end.argsForCall[0][0]).errors[0].originalError)
                    .toBe('Authorization header has a wrong scheme');
                expect(response.statusCode).toBe(401);
                done();
            });
    });

    it('should parse the auth header and call next if validation succeeds', function(done) {
        authMiddleware(getRequestWithHeader({authorization: 'Bearer someauth'}), response, next)
            .then(function() {
                expect(next).toHaveBeenCalled();
                expect(jwtAuthenticator.validate.argsForCall[0][0]).toBe('someauth');
                done();
            });
    });

    it('should parse the auth header and fail if validation fails', function(done) {
        jwtAuthenticator.validate.and.callFake(function(token, authorizedSubjects, callback) {
            callback(new Error('Validation failed'), {claims: 'claims'});
        });
        authMiddleware = jwtMiddleware.create(jwtAuthenticator, ['an-issuer'], logger);
        authMiddleware(getRequestWithHeader({authorization: 'Bearer someauth'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.argsForCall[0][0].message)
                    .toBe('Request to billing service had missing or incorrect credentials.');
                expect(JSON.parse(response.end.argsForCall[0][0]).errors[0].originalError)
                    .toBe('Validation failed');
                expect(response.statusCode).toBe(401);
                done();
            });
    });

});
