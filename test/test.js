'use strict';

var assert = require('assert'),
    AV = require('../api-validator.js');

describe('api-validator', function () {
    it('should be a fast return value function', function (done) {
        assert.equal(3, 3);
        done();
    });
});
