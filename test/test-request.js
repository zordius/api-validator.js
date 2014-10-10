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

    it('should throw exception when no callback', function (done) {
        try {
            AR.one({});
        } catch (E) {
            assert.deepEqual({ body: undefined, request: {}, response: undefined, error: [ { type: 'input', message: 'No callback for ARequest.one' } ] }, E);
        }
        done();
    });

    it('should response input error', function (done) {
        AR.one(null, function (E) {
            assert.deepEqual({ body: undefined, request: {}, response: undefined, error: [ { type: 'input', message: 'No input for ARequest.one' } ] }, E);
            done();
        });
    });

    it('should response input error when no input.url', function (done) {
        AR.one({}, function (E) {
            assert.deepEqual({ body: undefined, request: {}, response: undefined, error: [ { type: 'input', message: 'No input.url for ARequest.one' } ] }, E);
            done();
        });
    });

    it('should response one error when connection refused', function (done) {
        var I = {url: NoConnectURL};
        AR.one(I, function (E) {
            assert.deepEqual({ input: I, body: undefined, request: {}, response: undefined, error: [ { type: 'request', message: 'connect ECONNREFUSED' } ] }, E);
            done();
        });
    });

    it('should response empty string', function (done) {
        var I = {
            url: baseurl + PATHS.NULL
        };

        AR.one(I, function (E) {
            assert.property(E, 'request');
            assert.property(E, 'response');
            delete E.request;
            delete E.response;
            assert.deepEqual({ input: I, body: '', error:[]}, E);
            done();
        });
    });

    it('should response json', function (done) {
        AR.one({
            url: baseurl + PATHS.ABCDEF,
            json: true
        }, function (E) {
            assert.deepEqual({abc: '123', def: 0}, E.body);
            done();
        });
    });
});

describe('Request.all', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should handle all request', function (done) {
        var R1 = {url: baseurl + PATHS.ABCDEF, json: true},
            R2 = {url: NoConnectURL};

        AR.all([R1, R2], function (E) {
            assert.property(E[0], 'request');
            assert.property(E[0], 'response');
            delete E[0].request;
            delete E[0].response;
            assert.property(E[1], 'request');
            delete E[1].request;
            assert.deepEqual([
                {input: R1, error: [], body: {abc: '123', def: 0}},
                {input: R2, error: [ { type: 'request', message: 'connect ECONNREFUSED' } ], response: undefined, body: undefined}
            ], E);
            done();
        });
    });
});
