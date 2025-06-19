'use strict';

var nodeForge = require('node-forge');

var DATA_URI_PATTERN = /^data:application\/(?:pkcs8|x-pem-file);kid=([\w.\-\+/]+);?(?:base64)?,([a-zA-Z0-9+/=]+)$/;

function parsePrivateKey(privateKeyDerBase64) {
    try {
        // First, try to decode the base64 string
        var privateKeyBuffer = nodeForge.util.decode64(privateKeyDerBase64);
        
        // Check if it's already in PEM format (contains BEGIN PRIVATE KEY)
        if (privateKeyBuffer.indexOf('BEGIN PRIVATE KEY') !== -1 || 
            privateKeyBuffer.indexOf('BEGIN RSA PRIVATE KEY') !== -1) {
            return privateKeyBuffer.trim();
        }
        
        // Otherwise, parse it as DER format
        var privateKeyAsn1 = nodeForge.asn1.fromDer(privateKeyBuffer);
        var privateKeyObj = nodeForge.pki.privateKeyFromAsn1(privateKeyAsn1);
        var privateKeyPem = nodeForge.pki.privateKeyToPem(privateKeyObj);
        return privateKeyPem.trim();
    } catch (e) {
        // If we encounter any errors, just return the original string
        // This is better than failing and allows the JWT library to handle it
        console.log('Warning: Error parsing private key', e);
        return Buffer.from(privateKeyDerBase64, 'base64').toString().trim();
    }
}

function canonicalizePrivateKey(keyId, privateKey) {

    var uriDecodedPrivateKey = decodeURIComponent(privateKey);

    if (!uriDecodedPrivateKey.startsWith('data:')) {
        return privateKey;
    }

    var match = DATA_URI_PATTERN.exec(uriDecodedPrivateKey);
    
    if (!match) {
        throw new Error('Malformed Data URI');
    }

    if (keyId !== match[1]) {
        throw new Error('Supplied key id does not match the one included in data uri.');
    }

    return parsePrivateKey(match[2]);
}

module.exports = canonicalizePrivateKey;
