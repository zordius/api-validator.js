'use strict';

var assert = require('chai').assert,
    path = require('path'),
    AS = require('../api-validator').schema,
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
    };

describe('Schema.findSchemaFiles', function () {
    it('should search for only matched pattern under the base directory', function (done) {
        assert.deepEqual([
            'test/schemas/test.json'
        ], AS.findSchemaFiles('test/schemas', /test.json/));
        done();
    });

    it('should match 2 files', function (done) {
        assert.sameMembers([
            'test/schemas/test.json',
            'test/schemas/test2.json'
        ], AS.findSchemaFiles('test/schemas', /test(2?).json/));
        done();
    });
});

describe('Schema.loadSchemaFiles', function () {
    it('should load file content', function (done) {
        assert.deepEqual({
            'test/schemas/test.json': require('./schemas/test.json')
        }, AS.loadSchemaFiles(['test/schemas/test.json']));
        done();
    });
});

describe('Schema.resolveFilePath', function () {
    it('should works with any input', function (done) {
        assert.deepEqual(undefined, AS.resolveFilePath());
        assert.deepEqual(1, AS.resolveFilePath(1));
        done();
    });

    it('should resolve file://abc without base', function (done) {
        assert.deepEqual('file:///abc', AS.resolveFilePath('file:///abc'));
        done();
    });

    it('should resolve file://abc under /def', function (done) {
        assert.deepEqual('file:///def/abc', AS.resolveFilePath('file://abc', '/def'));
        done();
    });

    it('should resolve file://.. under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b', AS.resolveFilePath('file://..', '/a/b/c'));
        done();
    });

    it('should resolve file://../d# under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b/d#', AS.resolveFilePath('file://../d#', '/a/b/c'));
        done();
    });

    it('should resolve file://../../e#2 under /a/b/c/d', function (done) {
        assert.deepEqual('file:///a/b/e#2', AS.resolveFilePath('file://../../e#2', '/a/b/c/d'));
        done();
    });
});

describe('Schema.resolveAllRelativePath', function () {
    it('should be untouched', function (done) {
        assert.deepEqual({123: 456}, AS.resolveAllRelativePath({123: 456}));
        assert.deepEqual({123: 456, ref: 'ok'}, AS.resolveAllRelativePath({123: 456, ref: 'ok'}));
        assert.deepEqual({123: 456, '$ref': 'ok!'}, AS.resolveAllRelativePath({123: 456, '$ref': 'ok!'}));
        assert.deepEqual({123: 456, '$ref': 'http://what/'}, AS.resolveAllRelativePath({123: 456, '$ref': 'http://what/'}));
        done();
    });

    it('should be resolved', function (done) {
        assert.deepEqual({123: {'$ref': 'file:///a/b/c'}}, AS.resolveAllRelativePath({123: {'$ref': 'file://b/c'}}, '/a'));
        done();
    });

    it('should resolve deeper', function (done) {
        assert.deepEqual({123: {456: {'$ref': 'file:///a/b/c'}}}, AS.resolveAllRelativePath({123: {456: {'$ref': 'file://b/c'}}}, '/a'));
        done();
    });

    it('should resolve with custom resolver', function (done) {
        assert.deepEqual({123: {456: {'$ref': 'file://d/c/b/a'}}}, AS.resolveAllRelativePath({123: {456: {'$ref': 'what'}}}, 'base_dir', function (N, B) {
            assert.deepEqual('base_dir', B);
            assert.deepEqual('what', N);
            return 'file://d/c/b/a';
        }));
        done();
    });
});

describe('Schema.loadRelativeSchemaFiles', function () {
    it('should loaded with $ref resolved', function (done) {
        var F = 'file://' + path.resolve('test/schemas/test2.json'),
            R = {};

        R[F] = {
            id: F,
            '$schema': 'http://json-schema.org/draft-04/schema#',
            'extends': {
                '$ref': F.replace(/test2/, 'test')
            },
            properties: {
                def: {
                    type: 'number'
                }
            },
            required: [
                'abc',
                'def'
            ]
        };

        assert.deepEqual(R, AS.loadRelativeSchemaFiles('test/schemas', /test2.json/));
        done();
    });
});

describe('Schema.loadRemoteCachedSchemaFiles', function () {
    it('should load with correct URI', function (done) {
        var S = require('../schemas/remote/draft4.json'),
            R = {};

        R[S.id] = S;
        assert.deepEqual(R, AS.loadRemoteCachedSchemaFiles('schemas/remote', /draft4.json/));
        done();
    });
});
