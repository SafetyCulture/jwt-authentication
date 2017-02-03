'use strict';

var canonicalizePrivateKey = require('../../../lib/client/canonicalize');
var keySupport = require('../support/key-support');

describe('canonicalizePrivateKey', function () {

    it('parses the private key data uri', function () {
        var privateKey = canonicalizePrivateKey('an-issuer/the-keyid', keySupport.privateKeyDataUri);

        expect(privateKey).toBe(keySupport.privateKeyPem);
    });

    it('fails if the key ids do not match up', function () {
        var fn = function () {
          canonicalizePrivateKey('an-issuer/the-keyid-2', keySupport.privateKeyDataUri);
        };

        expect(fn).toThrowError(/key id does not match the one included in data uri/);
    });

    it('returns the private key if it does not match the pattern', function () {
        var privateKey = canonicalizePrivateKey('an-issuer/the-keyid', keySupport.privateKeyPem);

        expect(privateKey).toBe(keySupport.privateKeyPem);
    });
});
