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

describe('Validator.request', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should be failed as input error when no callback', function (done) {
        try {
            AV.request({});
        } catch (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No callback for ARequest.request' } ] }, E);
        }
        done();
    });

    it('should be failed as input error', function (done) {
        AV.request(null, function (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No input for ARequest.request' } ] }, E);
            done();
        });
    });

    it('should be failed as input error when no input.url', function (done) {
        AV.request({}, function (E) {
            assert.deepEqual({ error: [ { type: 'input', message: 'No input.url for ARequest.request' } ] }, E);
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
            assert.deepEqual({"error":[{"type":"input","message":"No input for ARequest.request"}]}, E);
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
