'use strict';

var assert = require('chai').assert,
    LIB = require('../api-validator.js'),
    AV = LIB.validate,
    AS = LIB.schema,
    nock = require('nock'),

    baseurl = 'http://fake.host',
    NoConnectURL = 'http://localhost:1/',

    PATHS = {
        NULL: '/getNull',
        ABC123: '/getJsonAbc123',
        ABCDEF: '/getJsonAbcDef'
    },

    setupFakeHTTP = function () {
        nock(baseurl)
        .get(PATHS.NULL).reply(200, '')
        .get(PATHS.ABC123).reply(200, {abc: 123})
        .get(PATHS.ABCDEF).reply(200, {abc: '123', def: 0});
    },

    cleanFakeHTTP = function () {
        nock.cleanAll();
    },

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

describe('Validator.one', function () {
    it('should be failed as internal error', function (done) {
        assert.deepEqual({"error":[{"type":"internal","message":"No input for AValidator.one"}]}, AV.one());
        done();
    });

    it('should be failed as input error', function (done) {
        assert.deepEqual({"error":[{"type":"input","message":"No schema in input for AValidator.one"}]}, AV.one({}));
        done();
    });

    it('should be passed by the schema', function (done) {
        assert.deepEqual(null, AV.one({
            data: {abc: 'dev', def: 1},
            schema: testSchema1
        }));
        done();
    });

    it('should be failed by the scema', function (done) {
        assert.deepEqual({"error":[{"type":"validation","target":"def","rule":{"required":true}},{"type":"validation","target":"abc","rule":{"type":"string"}}]}, AV.one({
            data: {abc: 1},
            schema: testSchema1
        }));
        done();
    });

    it('should validate by schema name', function (done) {
        assert.deepEqual(null, AV.one({
            data: {abc: 'dev', def: 1},
            schemas: {abcde123: testSchema1},
            schema: 'abcde123'
        }));
        done();
    });
});

describe('Validator.selfVerify', function () {
    it('should passed all core schemas', function (done) {
        assert.deepEqual({}, AV.selfVerify(AS.loadCoreSchemas()));
        done();
    });

    it('should failed by a none title schema', function (done) {
        var C = AS.loadCoreSchemas(),
            FN = 'test/schemas/error.jschema',
            S = AS.load([FN]);

        C['test'] = S[FN];

        assert.deepProperty(AV.selfVerify(C), 'test.error');
        done();
    });

    it('should failed when $schema not founds in provided schemas', function (done) {
        var C = AS.loadCoreSchemas(),
            FN = 'test/schemas/schema_notfound.jschema',
            S = AS.load([FN]);

        C['test'] = S[FN];

        assert.deepEqual({test: {error: [{
            'type': 'schemas',
            message: 'can not find schema "never_be_found"'
        }]}}, AV.selfVerify(C));
        done();
    });
});
