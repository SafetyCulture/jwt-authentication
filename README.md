#JWT Micro Service Helper

[![Build Status](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/status.png)](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/latest)

> A library to create and verify json web tokens for service to service authentication purposes.

**Note:** This library is a work in progress and does not yet have a stable api. If stability is important to you wait for the 1.0.0 release.

*TODO: Add summary*

##Features
*TODO: Add features list*

##Example
*TODO: Add example usage*

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