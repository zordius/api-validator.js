'use strict';

var assert = require('assert'),
    AV = require('../api-validator.js'),
    nock = require('nock'),
    baseurl = 'http://fake.host',

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
});

describe('Validator.all', function () {
    it('should be failed as input error', function (done) {
        assert.deepEqual({"error":[{"type":"input","message":"Input is not array for AValidator.all"}]}, AV.all({}));
        done();
    });

    it('should return array of validation results', function (done) {
        assert.deepEqual([
            null,
            {"error":[{"type":"validation","target":"def","rule":{"required":true}}]}
        ], AV.all([{
            data: {abc: 'dev', def: 1},
            schema: testSchema1
        }, {
            data: {abc: 'ok'},
            schema: testSchema1
        }]));
        done();
    });
});

describe('Validator.request', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should be failed as input error when no callback', function (done) {
        try {
            AV.request({});
        } catch (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No callback for AValidator.request' } ] }, E);
        }
        done();
    });

    it('should be failed as input error', function (done) {
        AV.request(null, function (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No input for AValidator.request' } ] }, E);
            done();
        });
    });

    it('should be failed as input error when no input.url', function (done) {
        AV.request({}, function (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No input.url for AValidator.request' } ] }, E);
            done();
        });
    });

    it('should be failed as request error when connection refused', function (done) {
        AV.request({url: 'http://localhost:1/'}, function (E) {
            assert.deepEqual({ error: [ { type: 'request', message: 'connect ECONNREFUSED', response: undefined, body: undefined } ] }, E);
            done();
        });
    });

    it('should be failed when response null', function (done) {
        AV.request({
            url: baseurl + PATHS.NULL,
            schema: testSchema1
        }, function (E) {
            assert.deepEqual({"error":[{"type":"validation","target":"type","rule":"object"}]}, E);
            done();
        });
    });

    it('should be passed', function (done) {
        AV.request({
            url: baseurl + PATHS.ABCDEF,
            schema: testSchema1
        }, function (E) {
            assert.deepEqual(null, E);
            done();
        });
    });
});

describe('Validator.promise', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should be failed as input error', function (done) {
        AV.promise().then(function (E) {
            assert.deepEqual({"error":[{"type":"input","message":"No input for AValidator.request"}]}, E);
            done();
        });
    });
});
