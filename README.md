#JWT Micro Service Helper

[![Build Status](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/status.png)](https://drone.io/bitbucket.org/atlassianlabs/jwt-microservice-helper/latest)

> Library that is used to create and verify json web tokens for service to service authentication purposes.

##Development Requirements

* nodejs 0.10.26
* npm 1.4.3
* grunt-cli 0.1.13

##Setting up a development environment

1. Clone the repository
1. `npm install` to install the npm dependencies
1. `grunt` to run a sanity check to ensure everything is working

##During development

* Use `grunt watch` to run the unit tests. When the relevant files are changed the unit tests will automatically be run.
* Use `grunt watchIntegrationTest` to run the integration tests. When the relevant files are changed the integration tests will automatically be run.
* Use `grunt` as a sanity check before pushing.