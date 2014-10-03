'use strict';

var assert = require('chai').assert,
    fs = require('fs'),
    AV = require('../api-validator.js'),
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
        AV.request({url: NoConnectURL}, function (E) {
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

describe('Validator.promiseAll', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should handle all validation', function (done) {
        AV.promiseAll([{
            url: baseurl + PATHS.ABCDEF,
            schema: testSchema1
        },{
            url: NoConnectURL
        }]).then(function (E) {
            assert.deepEqual([
                null,
                { error: [ { type: 'request', message: 'connect ECONNREFUSED', response: undefined, body: undefined } ] }
            ], E);
            done();
        });
    });
});

describe('Validator.findSchemaFiles', function () {
    it('should search for only matched pattern under the base directory', function (done) {
        assert.deepEqual([
            'test/schemas/test.json'
        ], AV.findSchemaFiles('test/schemas', /test.json/));
        done();
    });

    it('should match 2 files', function (done) {
        assert.sameMembers([
            'test/schemas/test.json',
            'test/schemas/test2.json'
        ], AV.findSchemaFiles('test/schemas', /test(2?).json/));
        done();
    });
});

describe('Validator.loadSchemaFiles', function () {
    it('should load file content', function (done) {
        assert.deepEqual({
            'test/schemas/test.json': require('./schemas/test.json')
        }, AV.loadSchemaFiles(['test/schemas/test.json']));
        done();
    });
});

describe('Validator.resolveFilePath', function () {
    it('should works with any input', function (done) {
        assert.deepEqual(undefined, AV.resolveFilePath());
        assert.deepEqual(1, AV.resolveFilePath(1));
        done();
    });

    it('should resolve file://abc without base', function (done) {
        assert.deepEqual('file://abc', AV.resolveFilePath('file://abc'));
        done();
    });

    it('should resolve file://abc under /def', function (done) {
        assert.deepEqual('file:///def/abc', AV.resolveFilePath('file://abc', '/def'));
        done();
    });

    it('should resolve file://.. under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b', AV.resolveFilePath('file://..', '/a/b/c'));
        done();
    });

    it('should resolve file://../d# under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b/d#', AV.resolveFilePath('file://../d#', '/a/b/c'));
        done();
    });

    it('should resolve file://../../e#2 under /a/b/c/d', function (done) {
        assert.deepEqual('file:///a/b/e#2', AV.resolveFilePath('file://../../e#2', '/a/b/c/d'));
        done();
    });
});

describe('Validator.resolveAllRelativePath', function () {
    it('should be untouched', function (done) {
        assert.deepEqual({123: 456}, AV.resolveAllRelativePath({123: 456}));
        assert.deepEqual({123: 456, ref: 'ok'}, AV.resolveAllRelativePath({123: 456, ref: 'ok'}));
        assert.deepEqual({123: 456, '$ref': 'ok!'}, AV.resolveAllRelativePath({123: 456, '$ref': 'ok!'}));
        assert.deepEqual({123: 456, '$ref': 'http://what/'}, AV.resolveAllRelativePath({123: 456, '$ref': 'http://what/'}));
        done();
    });

    it('should be resolved', function (done) {
        assert.deepEqual({123: {'$ref': 'file:///a/b/c'}}, AV.resolveAllRelativePath({123: {'$ref': 'file://b/c'}}, '/a'));
        done();
    });

    it('should resolve deeper', function (done) {
        assert.deepEqual({123: {456: {'$ref': 'file:///a/b/c'}}}, AV.resolveAllRelativePath({123: {456: {'$ref': 'file://b/c'}}}, '/a'));
        done();
    });
});
