'use strict';

var assert = require('assert'),
    AV = require('../api-validator.js'),
    SV = AV.singleValidator,
    LV = AV.loopValidator,

    testSchema1 = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        'type': 'object',
        required: ['abc', 'def'],
        properties: {
            abc: {
                type: 'string'
            },
            def: {}
        }
    };

describe('singleValidator', function () {
    it('should be failed as internal error', function (done) {
        assert.deepEqual({"error":[{"type":"internal","message":"No input for singleValidator"}]}, SV());
        done();
    });

    it('should be failed as input error', function (done) {
        assert.deepEqual({"error":[{"type":"input","message":"No schema in input for singleValidator"}]}, SV({}));
        done();
    });

    it('should be passed by the schema', function (done) {
        assert.deepEqual(null, SV({
            data: {abc: 'dev', def: 1},
            schema: testSchema1
        }));
        done();
    });

    it('should be failed by the scema', function (done) {
        assert.deepEqual({"error":[{"type":"validation","target":"def","rule":{"required":true}},{"type":"validation","target":"abc","rule":{"type":"string"}}]}, SV({
            data: {abc: 1},
            schema: testSchema1
        }));
        done();
    });
});

describe('loopValidator', function () {
    it('should be failed as input error', function (done) {
        assert.deepEqual({"error":[{"type":"input","message":"Input is not array for loopValidator"}]}, LV({}));
        done();
    });
});
