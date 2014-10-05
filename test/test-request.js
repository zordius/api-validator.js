'use strict';

var assert = require('chai').assert,
    AR = require('../api-validator.js').request,
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

describe('Request.one', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should be failed as input error when no callback', function (done) {
        try {
            AR.one({});
        } catch (E) {
            assert.deepEqual({ body: undefined, response: undefined, error: [ { type: 'input', message: 'No callback for ARequest.one' } ] }, E);
        }
        done();
    });

    it('should be failed as input error', function (done) {
        AR.one(null, function (E) {
            assert.deepEqual({ body: undefined, response: undefined, error: [ { type: 'input', message: 'No input for ARequest.one' } ] }, E);
            done();
        });
    });

    it('should be failed as input error when no input.url', function (done) {
        AR.one({}, function (E) {
            assert.deepEqual({ body: undefined, response: undefined, error: [ { type: 'input', message: 'No input.url for ARequest.one' } ] }, E);
            done();
        });
    });

    it('should be failed as one error when connection refused', function (done) {
        AR.one({url: NoConnectURL}, function (E) {
            assert.deepEqual({ body: undefined, response: undefined, error: [ { type: 'request', message: 'connect ECONNREFUSED' } ] }, E);
            done();
        });
    });

    it('should be failed when response null', function (done) {
        AR.one({
            url: baseurl + PATHS.NULL
        }, function (E) {
            assert.deepEqual({"error":[{"type":"validation","target":"type","rule":"object"}]}, E);
            done();
        });
    });

    it('should be passed', function (done) {
        AR.one({
            url: baseurl + PATHS.ABCDEF
        }, function (E) {
            assert.deepEqual(null, E);
            done();
        });
    });
});

describe('Request.promise', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should be failed as input error', function (done) {
        AR.promise().then(function (E) {
            assert.deepEqual({"error":[{"type":"input","message":"No input for ARequest.one"}]}, E);
            done();
        });
    });
});

describe('Request.promiseAll', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should handle all validation', function (done) {
        AR.promiseAll([{
            url: baseurl + PATHS.ABCDEF
        },{
            url: NoConnectURL
        }]).then(function (E) {
            assert.deepEqual([
                null,
                { error: [ { type: 'one', message: 'connect ECONNREFUSED', response: undefined, body: undefined } ] }
            ], E);
            done();
        });
    });
});
