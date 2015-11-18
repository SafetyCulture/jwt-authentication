# JWT Authentication

[![Build Status](https://drone.io/bitbucket.org/atlassianlabs/jwt-authentication/status.png)](https://drone.io/bitbucket.org/atlassianlabs/jwt-authentication/latest)

> A library to create and verify json web tokens for service to service authentication purposes.

**Note:** This library is a work in progress and does not yet have a stable api. If stability is important to you wait for the 1.0.0 release.

[Json Web Tokens](http://jwt.io/) (JWTs) are a secure way to represent claims that are to be transferred between two parties.
However on its own JWT does not provide an end to end authentication mechanism.
Some of the missing pieces include key distribution, default token expiry and a standard set of claims.
The JWT Authentication is a solution to these problems.

## Features

### Client

* Create JWT tokens signed with a private key
* Add custom claims to a token
* Add expiry to tokens

### Server

* TBD

## API

Refer to the [api documentation](https://bitbucket.org/atlassianlabs/jwt-authentication/src/master/docs/API.md) for details on how to use the api.

## Example

### Client

```
var jwtAuthentication = require('jwt-authentication');
var generator = jwtAuthentication.client.create();
var claims = {iss: 'name-of-client', sub: 'name-of-client', aud: 'name-of-server'};
var options = {privateKey: privateKey, kid: 'name-of-client/key-id.pem'};
generator.generateAuthorizationHeader(claims, options, function (error, headerValue) {
    if (error) {
        console.log('Generating the token failed.', error);
    } else {
        //assign headerValue to the Authorization header of your request object
        console.log(headerValue); // -> "Bearer [token]"
    }
});
```

## Creating the public and private key pair

### Private Key

```
openssl genrsa -out private.pem 2048
```

This command will generate a private key. This private key must be kept secret, and should be distributed to the token generator in a secure way. Do not commit this key to version control.

### Public Key

```
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

This command will generate a public key corresponding to the private key. This key should be uploaded to the public key server so receivers of tokens can validate the token.

## Changelog

Refer to the [changelog](https://bitbucket.org/atlassianlabs/jwt-authentication/src/master/docs/CHANGELOG.md) for a list of changes made in each version.

## Contributing

### Development Requirements

* nodejs 0.10.26
* npm 1.4.3
* grunt-cli 0.1.13

### Setting up a development environment

1. Clone the repository
1. `npm install` to install the npm dependencies
1. `grunt` to run a sanity check to ensure everything is working

### During development

* Use `grunt watch` to run the unit tests. When the relevant files are changed the unit tests will automatically be run.
* Use `grunt watchIntegrationTest` to run the integration tests. When the relevant files are changed the integration tests will automatically be run.
* Use `grunt docs` to preview the generated `docs/CHANGELOG.md` and `docs/API.md` files. **Do not commit these**, they are committed during the release task.
* Use `grunt` as a sanity check before pushing.

### Documentation

This library uses [JSDoc](http://usejsdoc.org/) to document it's public api. If you are making changes to the api please update the JSDoc accordingly.

### Changelog

This library automatically generates the changelog from the commit messages. To facilitate this please follow [these conventions](https://github.com/ajoslin/conventional-changelog/blob/master/CONVENTIONS.md) in your commit messages.

### Releasing

* Run `grunt release:patch` to release a patch version of the library.
* Run `grunt release:minor` to release a minor version of the library.
* Run `grunt release:major` to release a major version of the library.
