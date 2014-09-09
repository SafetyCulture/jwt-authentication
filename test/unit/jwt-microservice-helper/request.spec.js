var specHelpers = require('../support/spec-helpers');

var failTest = specHelpers.failTest;

describe('jwt-microservice-helper/request', function () {
    var body;
    var jwtRequest;
    var request;

    beforeEach(function () {
        body = '';

        request = jasmine.createSpy('request');
        request.andCallFake(function (options, callback) {
            callback(undefined, {statusCode: 200}, body);
        });

        jwtRequest = specHelpers.requireWithMocks('jwt-microservice-helper/request', {
            'request': request
        });
    });

    it('should make a request', function (done) {
        jwtRequest({some: 'options'}).fail(failTest(done)).then(function () {
            expect(request).toHaveBeenCalledWith({some: 'options'}, jasmine.any(Function));
            done();
        });
    });

    it('should return the body of the response', function (done) {
        body = 'the-body';

        jwtRequest().fail(failTest(done)).then(function (body) {
            expect(body).toBe('the-body');
            done();
        });
    });

    it('should return the error when making the request fails', function (done) {
        request.andCallFake(function (options, callback) {
            callback(new Error('an error'));
        });

        jwtRequest().then(failTest(done)).fail(function (error) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('an error', 'error.message');
            done();
        });
    });

    it('should return an error when the response code is not 200', function (done) {
        request.andCallFake(function (options, callback) {
            callback(undefined, {statusCode: 404}, 'a-404-response-body');
        });

        jwtRequest().then(failTest(done)).fail(function (error) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe('404', 'error.message');
            done();
        });
    });
});