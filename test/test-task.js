'use strict';

var assert = require('chai').assert,
    sinon = require('sinon'),
    fs = require('fs'),
    mockfs = require('mock-fs'),
    nock = require('nock'),
    lodash = require('lodash'),
    AV = require('../api-validator.js'),
    AS = AV.schema,
    AT = AV.task,

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
            'test.yaml': "- abc\n- def",
            abc: {
               def: {
                   '1.json': '{"title": "OK", "$schema": "http://uschema.github.io/json/strict.json#"}'
               }
            },
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

    it('should save to another namespace when context.savespace provided', function (done) {
        AT.save({
            saveSpace: 'test',
            test: {
                results: [ {test2: 'ok'} ]
            }
        }, function (C) {
            assert.deepEqual({}, C.test.saveError);
            assert.deepEqual(['file_0001.json'], C.test.savedFiles);
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

    it('should do validation task when not passed', function (done) {
        var C = {
            results: [{abc: 123, input: {schema: 'test_what'}}],
            savedFiles: ['123.js']
        };
        AT.validate(C, function (R) {
            assert.deepEqual({
                '123.js': {error: [{
                    message: 'can not find schema "test_what"',
                    type: 'schemas'
                }]}
            }, R.validates);
            done();
        });
    });
});

describe('Task.reduce', function () {
    it('should run all tasks in the queue', function (done) {
        AT.reduce([1,2,3], [function (D, next) {
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

describe('Task.loadRequestList', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should load requests by context.requestYaml', function (done) {
         AT.loadRequestList({requestYaml: 'test.yaml'}, function (C) {
             assert.deepEqual({ requestYaml: 'test.yaml', requests: [ 'abc', 'def' ] }, C);
             done();
         });
    });
});

describe('Task.loadPlan', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should load plan success', function (done) {
         AT.loadPlan('test.yaml', function (C) {
             delete C.schemas;
             delete C.planName;
             delete C.tasks;
             delete C.requestConfig;
             assert.deepEqual(['abc', 'def'], C);
             done();
         });
    });

    it('should load plan error', function (done) {
         AT.loadPlan('test2.yaml', function (C) {
             assert.deepEqual('Can not load plan yaml file: "test2.yaml"', C.error);
             assert.equal(true, C.abort);
             done();
         });
    });
});

describe('Task.loadSchemas', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should load 0 schema file', function (done) {
        AT.loadSchemas({schemas: {}}, function(R) {
            assert.deepEqual({schemas:{}, selfVerify:{}}, R);
            done();
        });
    });

    it('should load 1 schema file can not pass validation when config with schemaDir', function (done) {
        AT.loadSchemas({schemaDir: 'abc', schemas: {}}, function(R) {
            assert.deepEqual({
                "file:///Users/zordius/api-validator.js/abc/def/1.json": {
                    "$schema": "http://uschema.github.io/json/strict.json#",
                    "id": "file:///Users/zordius/api-validator.js/abc/def/1.json",
                    "title": "OK"
                }
            }, R.schemas);
            assert.equal(true, R.abort);
            done();
        });
    });

    it('should console.warn when verbose 2', function (done) {
        sinon.spy(console, 'warn');
        AT.loadSchemas({verbose: 2}, function (R) {
            assert.equal(' (No schemaDir in the plan)', console.warn.getCall(0).args[0]);
            console.warn.restore();
            done();
        });
    });

    it('should show number of loaded files when verbose 2', function (done) {
        sinon.spy(console, 'warn');
        AT.loadSchemas({verbose: 2, schemaDir: 'abc', schemas: {}}, function (R) {
            assert.equal(' 1 JSON schema loaded from abc', console.warn.getCall(0).args[0]);
            console.warn.restore();
            done();
        });
    });
});

describe('Task.validatePlan', function () {
    it('should pass plan schema', function (done) {
        AT.validatePlan({
            requestYaml: 'xxxx',
            planName: 'yyyy',
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.equal(undefined, C.error);
            done();
        });
    });

    it('should invalid', function (done) {
        AT.validatePlan({}, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });
});

describe('Task.preValidateRequests', function () {
    it('should pass requests schema', function (done) {
        AT.preValidateRequests({
            requests: [
                { url: 'http://this.is.ok/' },
                { yql: 'show tables', yqlConfig: {endpoint: "ok"} }
            ],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.equal(undefined, C.abort, JSON.stringify(C.error, null, ' '));
            done();
        });
    });

    it('should invalid when both url and yql provided', function (done) {
        AT.preValidateRequests({
            requests: [{
                url: 'http://this.is.ok',
                yql: 'show tables'
            }],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });

    it('should invalid when url provided and bad pattern', function (done) {
        AT.preValidateRequests({
            requests: [{
                url: 'badurl'
            }],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });
});

describe('Task.validateRequests', function () {
    it('should pass requests schema', function (done) {
        AT.validateRequests({
            requests: [{
                url: 'http://this.is.ok/',
                schema: 'test'
            }],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.equal(undefined, C.abort, JSON.stringify(C.error, null, ' '));
            done();
        });
    });

    it('should invalid when no url', function (done) {
        AT.validateRequests({
            requests: [{
                yql: 'show table'
            }],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });

    it('should invalid when no schema', function (done) {
        AT.validateRequests({
            requests: [{
                url: 'http://test.is.ok'
            }],
            schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });

    it('should invalid when url in bad format', function (done) {
        AT.validateRequests({
            requests: [
                {url: '123'}
            ], schemas: AS.loadCoreSchemas()
        }, function (C) {
            assert.deepProperty(C, 'error');
            assert.equal(true, C.abort);
            done();
        });
    });
});

describe('Task.run', function () {
    before(setupFakeHTTP);
    after(cleanFakeHTTP);

    it('should execute a good plan', function (done) {
        AT.run('test/yaml/plan.yaml', function (D) {
            assert.deepEqual([
               'file_0001.json',
               'file_0002.json'
            ], D.savedFiles, JSON.stringify(D, null, ' '));
            done();
        });
    });
    it('should report bad tasks', function (done) {
        AT.run('test/yaml/wrong_plan.yaml', function (D) {
            assert.equal(false, D.tasks.validate);
            assert.equal(false, D.tasks.save);
            done();
        });
    });
});
