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

describe('Task.fetch', function () {
    before(function () {
        initMockFS();
        setupFakeHTTP();
    });
    after(function () {
        clearMockFS();
        cleanFakeHTTP();
    });

    it('should save results and return save status', function (done) {
        AT.fetch([
            {url: baseurl + PATHS.NULL},
            {url: NoConnectURL},
            {url: baseurl + PATHS.ABC123},
            {url: baseurl + PATHS.ABCDEF, json: true}
        ], {callback: function (L) {
            assert.deepEqual({}, L);
            assert.deepEqual('', JSON.parse(fs.readFileSync('file_0001.json'), 'utf8').body);
            assert.deepEqual({type: 'request', message: 'connect ECONNREFUSED'}, JSON.parse(fs.readFileSync('file_0002.json'), 'utf8').error[0]);
            assert.deepEqual('{"abc":123}', JSON.parse(fs.readFileSync('file_0003.json'), 'utf8').body);
            assert.deepEqual({abc:'123', def: 0}, JSON.parse(fs.readFileSync('file_0004.json'), 'utf8').body);
            done();
        }});
    });

    it('should save results and save by option', function (done) {
        AT.fetch([{url: NoConnectURL}], {
            prefix: 'output/',
            callback: function () {
                assert.deepEqual({type: 'request', message: 'connect ECONNREFUSED'}, JSON.parse(fs.readFileSync('output/0001.json'), 'utf8').error[0]);
                done();
            }
        });
    });
});
