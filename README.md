api-validator.js
================

A nodejs lib and command line tool powered by JSON Schema to validate web API output

[![npm version](https://img.shields.io/npm/v/api-validator.svg)](https://www.npmjs.org/package/api-validator) [![Dependency Status](https://david-dm.org/zordius/api-validator.js.png)](https://david-dm.org/zordius/api-validator.js)  [![Build Status](https://travis-ci.org/zordius/api-validator.js.svg?branch=master)](https://travis-ci.org/zordius/api-validator.js) [![Code Climate](https://codeclimate.com/github/zordius/api-validator.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/api-validator.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

Features
--------

* JSON Schema V4 Draft Validation (powered by <a href="https://github.com/acornejo/jjv">jjv</a>)
 * load schema files
 * handle both remote $ref `http://...` or relative file $ref `file://../.`
* API Validation - fetch , save , validate , report
 * describe API request and JSON Schema pairs by yaml file
 * make API requests and save response as json files
 * validate on these response
 * output validation results
 * output different test report formats (powered by <a href="https://github.com/visionmedia/mocha">mocha</a> reports)
* Command line tool
 * Validate your schema files **TODO**
 * List and fetch referenced remote schema files **TODO**
 * API Validation
* Customize
 * Authorize requests **TODO**
 * test on <a href="">YQL tables</a> **TODO**
 * test by API blueprint **TODO**

Command Line Usage
------------------

**Step 1. Make a plan**

```yaml
# plan.yaml
requestYaml: requests.yaml
schemaDir: mySchema/path
prefix: myResults/output/file_
reportJSON: finalReport/file.json
requestConfig:
  timeout: 500
```

**Step 2. List requests**

```yaml
# request.yaml
- url: http://apihost/endpoint1
  schema: schema_name1
- url: http://apihost/endpoint2
  schema: schema_name2
```

**Step 3. Validate!**

```sh
api-validator.js plan.yaml > results.json
```

Will output full context into results.json and exit with 0 when pass.

**Step 4. (optional) Run with Mocha**

Run with mocha then you can using any mocha reporter to see test results. You need to prepare a test.js like this:

```javascript
require('api-reporter').mocha('results.json');
```

Then run mocha:

```shell
mocha test.js
```
