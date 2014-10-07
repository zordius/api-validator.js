'use strict';

var assert = require('chai').assert,
    fs = require('fs'),
    mockfs = require('mock-fs'),
    nock = require('nock'),
    lodash = require('lodash'),
    AT = require('../api-validator.js').task,

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

    initMockFS = function () {
        mockfs({
            output: {}
        });
    },

    clearMockFS = function () {
        mockfs.restore();
    };

describe('Task.request', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should update context.results', function (done) {
        AT.request({requests: [
            {url: baseurl + PATHS.NULL},
            {url: NoConnectURL},
            {url: baseurl + PATHS.ABC123},
            {url: baseurl + PATHS.ABCDEF, json: true}
        ]}, function (L) {
            assert.equal('', L.results[0].body);
            assert.deepEqual({type: 'request', message: 'connect ECONNREFUSED'}, L.results[1].error[0]);
            assert.deepEqual('{"abc":123}', L.results[2].body);
            assert.deepEqual({abc:'123', def: 0}, L.results[3].body);
            done();
        });
    });
});

describe('Task.save', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should save files', function (done) {
        AT.save({results: [
            'test1',
            {test: 'ok'}
        ]}, function () {
            assert.deepEqual('test1', JSON.parse(fs.readFileSync('file_0001.json'), 'utf8'));
            assert.deepEqual({test: 'ok'}, JSON.parse(fs.readFileSync('file_0002.json'), 'utf8'));
            done();
        });
    });

    it('should save files with options', function (done) {
        AT.save({results: [
            {test2: 'ok'}
        ], prefix: 'output/'}, function () {
            assert.deepEqual({test2: 'ok'}, JSON.parse(fs.readFileSync('output/0001.json'), 'utf8'));
            done();
        });
    });

    it('should update context.savedFiles and saveError', function (done) {
        AT.save({results: [
            {test2: 'ok'}
        ], prefix: 'output/'}, function (C) {
            assert.deepEqual(['output/0001.json'], C.savedFiles);
            assert.deepEqual({}, C.saveError);
            done();
        });
    });
});

describe('Task.validate', function () {
    it('should do validation task when passed', function (done) {
        var C = {
            results: [{abc: 123, input: {schema: 'test'}}],
            savedFiles: ['123.js'],
            schemas: {test: {properties: {abc: {type: 'number'}}, required: ['abc']}}
        };
        AT.validate(C, function (R) {
            assert.deepEqual({}, R.validates);
            delete R.validates;
            assert.deepEqual(C, R);
            done();
        });
    });
});

describe('Task.run', function () {
    it('should call the tasks in the queue', function (done) {
        AT.run([1,2,3], [function (D, next) {
            D.pop();
            next(D);
        }, function (D, next) {
            D.unshift(4);
            next(D);
        }, function (D, next) {
            assert.deepEqual([4, 1, 2], D);
            done();
        }]);
    });
});
