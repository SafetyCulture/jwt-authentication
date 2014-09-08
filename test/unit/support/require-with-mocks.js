var path = require('path');
var proxyquire = require('proxyquire').noCallThru();

module.exports = function (pathRelativeToLib, mocks) {
    var pathRelativeToThisFile = path.normalize('../../../lib/' + pathRelativeToLib);
    return proxyquire(pathRelativeToThisFile, mocks || {});
};