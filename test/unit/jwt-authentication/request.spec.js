var specHelpers = require('../support/spec-helpers');
var q = require('q');
var failTest = require('../support/fail-test');
var keyCache = require('../../../lib/jwt-authentication/cache/keyCache');

describe('jwt-authentication/request', function () {
    var jwtRequest;
    var axios;

    beforeEach(function () {
        var fakeResponse = {
            status: 200,
            headers: {
                'content-type': 'plain/text'
            },
            data: 'the-body'
        };
        axios = jasmine.createSpyObj('axios', ['get']);
        axios.get.and.callFake(function () {
            return q.resolve(fakeResponse);
        });

        jwtRequest = specHelpers.requireWithMocks('jwt-authentication/request', {
            'axios': axios,
            './cache/keyCache': keyCache
        });
    });

    it('should make a request', function (done) {
        jwtRequest('https://some.url').fail(failTest(done)).then(function () {
            expect(axios.get).toHaveBeenCalledWith('https://some.url',
                {
                    headers : { Accept : 'application/x-pem-file' },
                    timeout: 10000
                }
            );
            done();
        });
    });

    it('should return the key from cache', function (done) {
        jwtRequest('https://some.url').fail(failTest(done)).then(function (body) {
            expect(body).toBe('the-body');
            expect(axios.get).not.toHaveBeenCalled();
            done();
        });
    });

    it('should return the body of the response', function (done) {
        keyCache.flushAll();
        jwtRequest('https://some.url').fail(failTest(done)).then(function (body) {
            expect(body).toBe('the-body');
            done();
        });
    });

    it('should return the error when making the request fails', function (done) {
        axios.get.and.callFake(function () {
            return q.reject(new Error('an error'));
        });
        keyCache.flushAll();
        jwtRequest('https://some.url').then(failTest(done)).fail(function (error) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe(
                'Unable to retrieve public key. Error: "an error" Url: "https://some.url"', 'error.message'
            );
            done();
        });
    });

    it('should return an error when the response code is not 200', function (done) {
        var fakeResponse = {
            status: 500,
            headers: {
                'content-type': 'plain/text'
            },
            data: 'the-body'
        };
        keyCache.flushAll();
        axios.get.and.callFake(function () {
            return q.resolve(fakeResponse);
        });

        jwtRequest('https://some.url').then(failTest(done)).fail(function (error) {
            expect(error).toBeDefined('error');
            expect(error.message).toBe(
                'Unable to retrieve public key. ' +
                'Expected status code: "200" ' +
                'Actual status code: "500" ' +
                'Url: "https://some.url"', 'error.message');
            done();
        });
    });
});
