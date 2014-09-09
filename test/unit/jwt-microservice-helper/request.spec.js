var q = require('q');
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
            callback(undefined, undefined, body);
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
});