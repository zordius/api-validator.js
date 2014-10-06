'use strict';

var assert = require('chai').assert,
    AS = require('../api-validator.js').save;

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
});
