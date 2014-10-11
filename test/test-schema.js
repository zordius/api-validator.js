'use strict';

var assert = require('chai').assert,
    path = require('path'),
    AS = require('../api-validator').schema;

describe('Schema.find', function () {
    it('should search by default match', function (done) {
        var D = AS.find('test/schemas');
        assert.sameMembers([
            'test/schemas/test.json',
            'test/schemas/test2.json',
            'test/schemas/subdir/test3.json',
            'test/schemas/example/show_tables.json'
        ], D, JSON.stringify(D, null, ' '));
        done();
    });

    it('should search for only matched pattern under the base directory', function (done) {
        assert.deepEqual([
            'test/schemas/test.json'
        ], AS.find('test/schemas', /test\.json$/));
        done();
    });

    it('should search by absolute path', function (done) {
        assert.deepEqual([
            path.resolve('test/schemas/test.json')
        ], AS.find(path.resolve('test/schemas'), /test\.json$/));
        done();
    });

    it('should match 2 files', function (done) {
        assert.sameMembers([
            'test/schemas/test.json',
            'test/schemas/test2.json'
        ], AS.find('test/schemas', /test(2?).json/));
        done();
    });
});

describe('Schema.load', function () {
    it('should load file content', function (done) {
        assert.deepEqual({
            'test/schemas/test.json': require('./schemas/test.json')
        }, AS.load(['test/schemas/test.json']));
        done();
    });
});

describe('Schema.resolveFileRef', function () {
    it('should works with any input', function (done) {
        assert.deepEqual(undefined, AS.resolveFileRef());
        assert.deepEqual(1, AS.resolveFileRef(1));
        done();
    });

    it('should resolve file://abc without base', function (done) {
        assert.deepEqual('file:///abc', AS.resolveFileRef('file:///abc'));
        done();
    });

    it('should resolve file://abc under /def', function (done) {
        assert.deepEqual('file:///def/abc', AS.resolveFileRef('file://abc', '/def'));
        done();
    });

    it('should resolve file://.. under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b', AS.resolveFileRef('file://..', '/a/b/c'));
        done();
    });

    it('should resolve file://../d# under /a/b/c', function (done) {
        assert.deepEqual('file:///a/b/d#', AS.resolveFileRef('file://../d#', '/a/b/c'));
        done();
    });

    it('should resolve file://../../e#2 under /a/b/c/d', function (done) {
        assert.deepEqual('file:///a/b/e#2', AS.resolveFileRef('file://../../e#2', '/a/b/c/d'));
        done();
    });
});

describe('Schema.deepResolveFileRef', function () {
    it('should be untouched', function (done) {
        assert.deepEqual({123: 456}, AS.deepResolveFileRef({123: 456}));
        assert.deepEqual({123: 456, ref: 'ok'}, AS.deepResolveFileRef({123: 456, ref: 'ok'}));
        assert.deepEqual({123: 456, '$ref': 'ok!'}, AS.deepResolveFileRef({123: 456, '$ref': 'ok!'}));
        assert.deepEqual({123: 456, '$ref': 'http://what/'}, AS.deepResolveFileRef({123: 456, '$ref': 'http://what/'}));
        done();
    });

    it('should be resolved', function (done) {
        assert.deepEqual({123: {'$ref': 'file:///a/b/c'}}, AS.deepResolveFileRef({123: {'$ref': 'file://b/c'}}, '/a'));
        done();
    });

    it('should resolve deeper', function (done) {
        assert.deepEqual({123: {456: {'$ref': 'file:///a/b/c'}}}, AS.deepResolveFileRef({123: {456: {'$ref': 'file://b/c'}}}, '/a'));
        done();
    });

    it('should resolve with custom resolver', function (done) {
        assert.deepEqual({123: {456: {'$ref': 'file://d/c/b/a'}}}, AS.deepResolveFileRef({123: {456: {'$ref': 'what'}}}, 'base_dir', function (N, B) {
            assert.deepEqual('base_dir', B);
            assert.deepEqual('what', N);
            return 'file://d/c/b/a';
        }));
        done();
    });
});

describe('Schema.loadRelativeFile', function () {
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

        assert.deepEqual(R, AS.loadRelativeFile('test/schemas', /test2\.json$/));
        done();
    });
});

describe('Schema.loadRemoteCached', function () {
    it('should load with correct URI', function (done) {
        var S = require('../schemas/remote/draft4.json'),
            R = {};

        R[S.id] = S;
        assert.deepEqual(R, AS.loadRemoteCached('schemas/remote', /draft4.json/));
        done();
    });
});

describe('Schema.loadCoreSchemas', function () {
    it('should load core schemas', function (done) {
        var C = AS.loadCoreSchemas();

        assert.deepEqual(require('../schemas/remote/draft4.json'), C['http://json-schema.org/draft-04/schema#']);
        done();
    });
});

