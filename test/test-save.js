'use strict';

var assert = require('chai').assert,
    fs = require('fs'),
    mockfs = require('mock-fs'),
    lodash = require('lodash'),
    AS = require('../api-validator.js').save,

    initMockFS = function () {
        mockfs({
            output: {},
            output_dir: {}
        });
    },

    clearMockFS = function () {
        mockfs.restore();
    };

describe('Save.format', function () {
    it('should return number with default format', function (done) {
        assert.equal('0001', AS.format(1));
        assert.equal('0010', AS.format(10));
        assert.equal('9876', AS.format(9876));
        assert.equal('2345', AS.format(12345));
        done();
    });

    it('should return number with provided format', function (done) {
        assert.equal('12345', AS.format(12345, '00000'));
        done();
    });
});

describe('Save.namer', function () {
    it('should return default name for first item', function (done) {
        assert.equal('file_0001.json', AS.namer(0));
        done();
    });

    it('should return name by provided number and options', function (done) {
        assert.equal('file_0004.js', AS.namer(3, null, {ext: '.js'}));
        assert.equal('result_0004.js', AS.namer(3, null, {ext: '.js', prefix: 'result_'}));
        assert.equal('../schemas/result_0004.js', AS.namer(3, null, {ext: '.js', prefix: '../schemas/result_'}));
        done();
    });

    it('should return untouched name when index is string', function (done) {
        assert.equal('0', AS.namer('0'));
        assert.equal('3', AS.namer('3', null, {ext: '.js'}));
        assert.equal('4', AS.namer('4', null, {ext: '.js', prefix: 'result_'}));
        assert.equal('test_ok', AS.namer('test_ok', null, {ext: '.js', prefix: '../schemas/result_'}));
        done();
    });
});

describe('Save.one', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should failed when no directory', function (done) {
        assert.deepEqual({
            error: [{
                type: 'save',
                message: "ENOENT, no such file or directory 'never/saved/directory'"
            }]
        }, AS.one('never/saved/directory'));
        done();
    });

    it('should save JSON with default options', function (done) {
        var F = 'output_dir/test.json';

        assert.equal(undefined, AS.one(F, {status: 'OK'}));
        assert.equal('{\n    "status": "OK"\n}', fs.readFileSync(F, 'utf8'));
        done();
    });

    it('should save JSON without indent', function (done) {
        var F = 'output_dir/test2.json';

        AS.one(F, {status: 'OK'}, {space: ''});
        assert.equal('{"status":"OK"}', fs.readFileSync(F, 'utf8'));
        done();
    });

    it('should save JSON with 2 spacing indent', function (done) {
        var F = 'output_dir/test3.json';

        AS.one(F, {a: {b: 'c'}}, {space: '  '});
        assert.equal('{\n  "a": {\n    "b": "c"\n  }\n}', fs.readFileSync(F, 'utf8'));
        done();
    });

    it ('should save JSON with provided replacer', function (done) {
        var F = 'output_dir/test3.json';

        AS.one(F, {a: 'c', b: 2, c: '3'}, {replacer: function (K, V) {
            return lodash.isNumber(V) ? AS.format(V) : V;
        }});
        assert.equal('{\n    "a": "c",\n    "b": "0002",\n    "c": "3"\n}', fs.readFileSync(F, 'utf8'));
        done();
    });
});

describe('Save.all', function () {
    before(initMockFS);
    after(clearMockFS);

    it('should return save result', function (done) {
        assert.deepEqual({'never/saved/directory': {error: [{
            type: 'save',
            message: "ENOENT, no such file or directory 'never/saved/directory'",
        }]}}, AS.all({
            'test_json': {a: 'OK!'},
            'never/saved/directory': {}
        }));

        assert.equal('{\n    "a": "OK!"\n}', fs.readFileSync('test_json', 'utf8'));
        done();
    });
});
