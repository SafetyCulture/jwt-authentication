var currentTime = require('../../common/current-time');
var q = require('q');
var _ = require('lodash');

var MAX_LIFE = 60 * 60; // maximum life time is one hour

/**
 * The JWT spec says that implementers "MAY provide for some small leeway, usually no more than a few minutes,
 * to account for clock skew". Calculations of the current time for the purposes of accepting or rejecting time-based
 * claims (e.g. "exp" and "nbf") will allow for the current time being plus or minus this leeway, resulting in
 * some time-based claims that are marginally before or after the current time being accepted instead of rejected.
 */
var TIME_CLAIM_LEEWAY = process.env.ASAP_SERVER_LEEWAY_SECONDS || 30;

var validateIssuerIsNotEmpty = function(issuer) {
    if (!issuer || /^\s*$/.test(issuer)) {
        return q.reject(new Error('Issuer cannot be blank'));
    }
    return q.resolve();
};

var subjectValidation = function(authorizedSubjects, subject) {
    if (authorizedSubjects && !_.includes(authorizedSubjects, subject)) {
        return q.reject(new Error('Unknown or unauthorized subject'));
    }
    return q.resolve();
};

var keyIdVerification = function(issuer, keyId) {
    if (keyId.indexOf(issuer + '/') !== 0) {
        return q.reject(new Error('The issuer claim does not match the key id'));
    }
    return q.resolve();
};

var issuerAndSubjectValidation = function(issuer, subject, authorizedSubjects, keyId) {
    var validateSubject = _.partial(subjectValidation, authorizedSubjects, subject);
    var validateKeyIdAndIssuer = _.partial(keyIdVerification, issuer, keyId);
    return validateIssuerIsNotEmpty(issuer)
        .then(validateSubject)
        .then(validateKeyIdAndIssuer);
};

var audienceValidation = function(audience, resourceServerAudience) {
    if (!_.isArray(audience)) {
        audience = [audience];
    }

    if (audience.indexOf(resourceServerAudience) === -1) {
        return q.reject(new Error('Unrecognised audience'));
    }

    return q.resolve();
};

var expiryValidation = function(expiry, issuedAt) {
    if (expiry < issuedAt) {
        return q.reject(new Error('Expiry time set before issue time'));
    }
    return q.resolve();
};

var lifeTimeValidation = function(issuedAt, expiry) {
    if ((issuedAt + MAX_LIFE) < expiry) {
        return q.reject(new Error('Token exceeds lifetime limit of ' + MAX_LIFE + ' seconds'));
    }

    return q.resolve();
};

var beforeTimeValidation = function(issuedAt, expiry, mayBeNotBefore) {
    if (mayBeNotBefore) {
        if (mayBeNotBefore > expiry) {
            return q.reject(new Error('The expiry time must be after the not-before time'));
        }

        if (mayBeNotBefore < issuedAt) {
            return q.reject(new Error('The token must not be valid before it was issued'));
        }
    }

    return q.resolve();
};

var formalTimeClaimsValidation = function(issuedAt, expiry, mayBeNotBefore, ignoreLifeTimeValidation) {
    var validateExpiry = _.partial(expiryValidation, expiry, issuedAt);
    var validateLifeTime = ignoreLifeTimeValidation ? _.identity : _.partial(lifeTimeValidation, issuedAt, expiry);
    var validateBeforeTime = _.partial(beforeTimeValidation, issuedAt, expiry, mayBeNotBefore);

    return validateExpiry()
        .then(validateLifeTime)
        .then(validateBeforeTime);
};

var relativeTimeValidation = function(issuedAt, expiry, mayBeNotBefore) {
    var nowMinusLeeway = currentTime.get() - TIME_CLAIM_LEEWAY;
    var nowPlusLeeway = currentTime.get() + TIME_CLAIM_LEEWAY;

    if (expiry < nowMinusLeeway) {
        return q.reject(new Error('The token has already expired'));
    }

    if (mayBeNotBefore > nowPlusLeeway) {
        return q.reject(new Error('The token is not valid yet'));
    }

    return q.resolve();
};

module.exports = {
    validate: function(authorizedSubjects, config, header, claims) {
        var issuer = claims.iss;
        var subject = claims.sub || issuer;
        var audience = claims.aud;
        var issuedAt = claims.iat;
        var expiry = claims.exp;
        var keyId = header.kid;
        var mayBeNotBefore = claims.nbf || issuedAt;
        var resourceServerAudience = config.resourceServerAudience;
        var ignoreLifeTimeValidation = config.ignoreMaxLifeTime || false;

        var validateAudience = _.partial(audienceValidation, audience, resourceServerAudience);
        var validateFormalTime = _.partial(formalTimeClaimsValidation, issuedAt, expiry, mayBeNotBefore,
            ignoreLifeTimeValidation);
        var validateRelativeTime = _.partial(relativeTimeValidation, issuedAt, expiry, mayBeNotBefore);

        return issuerAndSubjectValidation(issuer, subject, authorizedSubjects, keyId)
            .then(validateAudience)
            .then(validateFormalTime)
            .then(validateRelativeTime)
            .thenResolve(claims);
    }
};
