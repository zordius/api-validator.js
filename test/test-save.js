'use strict';

var assert = require('chai').assert,
    fs = require('fs'),
    mockfs = require('mock-fs'),
    AS = require('../api-validator.js').save,

    initMockFS = function () {
        mockfs({
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
        assert.equal('output/file_0001.json', AS.namer(0));
        done();
    });

    it('should return name by provided options', function (done) {
        assert.equal('output/file_0004.js', AS.namer(3, null, {ext: '.js'}));
        assert.equal('output/result_0004.js', AS.namer(3, null, {ext: '.js', prefix: 'result_'}));
        assert.equal('../schemas/result_0004.js', AS.namer(3, null, {ext: '.js', prefix: 'result_', basedir: '../schemas'}));
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

        AS.one(F, {status: 'OK'});
        assert.equal('{\n    "status": "OK"\n}', fs.readFileSync(F, 'utf8'));
        done();
    });

    it('should save JSON without indent', function (done) {
        var F = 'output_dir/test2.json';

        AS.one(F, {status: 'OK'}, {space: ''});
        assert.equal('{"status":"OK"}', fs.readFileSync(F, 'utf8'));
        done();
    });
});
