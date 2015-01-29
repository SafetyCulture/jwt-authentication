#JWT Micro Service Helper

[![Build Status](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/status.png)](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/latest)

> A library to create and verify json web tokens for service to service authentication purposes.

**Note:** This library is a work in progress and does not yet have a stable api. If stability is important to you wait for the 1.0.0 release.

[Json Web Tokens](http://jwt.io/) (JWTs) are a secure way to represent claims that are to be transferred between two parties.
However on its own JWT does not provide an end to end authentication mechanism.
Some of the missing pieces include key distribution, default token expiry and a standard set of claims.
The JWT Micro Service Helper is a solution to these problems.

##Features

###Client

* Create JWT tokens signed with a private key
* Add custom claims to a token

###Server

* Validate a JWT token
* Automatically retrieve the public key of the issuer of the token
* Validate the token expiry

##Example

### Client

```
var jwtMicroServiceHelper = require('jwt-microservice-helper');
var jwt = jwtMicroServiceHelper.create({publicKeyServer: 'https://your-public-key-store.com'});
var tokenClaims = {iss: 'client-name', sub: 'client-name'};
jwt.generateAuthorizationHeader(claims, {privateKey: privateKey}, function (error, authorizationHeader) {
    if (error) {
        console.log('generating the token failed');
    } else {
        //assign header to your request object
        console.log(authorizationHeader); // -> "x-atl-jwt [jwt token]"
    }
});
```

### Server

```
var jwtMicroServiceHelper = require('jwt-microservice-helper');
var jwt = jwtMicroServiceHelper.create({publicKeyServer: 'https://your-public-key-store.com'});
jwt.validate(token, function (error, claims) {
    if (error) {
        console.log('the token is not valid');
    } else {
        console.log('the token claims are', claims);
    }
});
```

##API

*TODO: Add api documentation*

##Contributing

###Development Requirements

* nodejs 0.10.26
* npm 1.4.3
* grunt-cli 0.1.13

###Setting up a development environment

1. Clone the repository
1. `npm install` to install the npm dependencies
1. `grunt` to run a sanity check to ensure everything is working

###During development

* Use `grunt watch` to run the unit tests. When the relevant files are changed the unit tests will automatically be run.
* Use `grunt watchIntegrationTest` to run the integration tests. When the relevant files are changed the integration tests will automatically be run.
* Use `grunt` as a sanity check before pushing.

###Commit messages

This library automatically generates the changelog from the commit messages. To facilitate this please follow [these conventions](https://github.com/ajoslin/conventional-changelog/blob/master/CONVENTIONS.md) in your commit messages.

###Releasing

* Run `grunt release:patch` to release a patch version of the library.
* Run `grunt release:minor` to release a minor version of the library.
* Run `grunt release:major` to release a major version of the library.
