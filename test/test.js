'use strict';

var assert = require('assert'),
    AV = require('../api-validator.js'),
    SV = AV.singleValidator;

describe('singleValidator', function () {
    it('should be passed', function (done) {
        assert.equal(true, SV({
            data: {abc: 'dev'},
            schema: {
                "$schema": "http://json-schema.org/draft-04/schema#",
                type: 'object',
                required: ['abc'],
                properties: {
                    abc: {
                        type: 'string'
                    }
                }
            }
        }));
    });
});
