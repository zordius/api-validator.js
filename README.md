api-validator.js
================

A nodejs lib and command line tool powered by JSON Schema to validate web API output

[![npm version](https://img.shields.io/npm/v/api-validator.svg)](https://www.npmjs.org/package/api-validator) [![Dependency Status](https://david-dm.org/zordius/api-validator.js.png)](https://david-dm.org/zordius/api-validator.js)  [![Build Status](https://travis-ci.org/zordius/api-validator.js.svg?branch=master)](https://travis-ci.org/zordius/api-validator.js) [![Test Coverage](https://codeclimate.com/github/zordius/api-validator.js/badges/coverage.svg)](https://codeclimate.com/github/zordius/api-validator.js) [![Code Climate](https://codeclimate.com/github/zordius/api-validator.js/badges/gpa.svg)](https://codeclimate.com/github/zordius/api-validator.js) [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)

```sh
# [You provide] to api-validator.js , (it do):
[Test Plan] + [API Request Lists] -> (Make Requests) +
                              [API Response Schemas] + -> (Validation!) = (CI for API!)
```

```sh
# In future the whole picture:
[API Spec] -> (Document generation)
           -> (Mock API Server)
           -> (API Request Lists) +
                      (Test Plan) + -> (Make Requests) +
           ->                   (API Response Schemas) + -> (Validation!) = (CI for API!)
```

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
 * test on <a href="https://developer.yahoo.com/yql/">YQL tables</a>
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
- yql: select * from sometable
  schema: schema_name3
```

**Step 3. Validate!**

```sh
api-validator.js plan.yaml > results.json
```

Will output full context into results.json and exit with 0 when pass.

**Step 4. (optional) Run with Mocha**

Run with mocha then you can using any mocha reporter to see test results. You need to prepare a test.js like this:

```javascript
require('api-validator').mocha('results.json');
```

Then run mocha:

```shell
mocha test.js
```

The output will be:

```
  API Validator tests reports by test/yaml/example_yql_plan.yaml
    ✓ Task "validatePlan" should be executed
    ✓ Task "loadSchemas" should be executed
    ✓ Task "loadRequestList" should be executed
    ✓ Task "preValidateRequests" should be executed
    ✓ Task "prepareRequest" should be executed
    ✓ Task "validateRequests" should be executed
    ✓ Task "request" should be executed
    ✓ Task "save" should be executed
    ✓ Task "validate" should be executed
    ✓ [Saved in file_0001.json] https://query.yahooapis.com/v1/public/yql should pass schema "https://raw.githubusercontent.com/zordius/api-validator.js/master/schemas/yql.json#/definitions/result"
    ✓ [Saved in file_0002.json] https://query.yahooapis.com/v1/public/yql should pass schema "example://yql.yahoo.com/show_tables"


  11 passing (7ms)
```

Good JSON Schema practices
--------------------------

* file name: `*.json` or `*.schema.json`
* `title` , `id` and `$schema` are required
* Refer to any resources by correct URI. (GOOD: `"$ref": "http://real.host/real.json#"` , bad: `"$ref": "any_name"` )
* Use `definitions` and `$ref` to decouple schema into many sub schemas
* Reuse sub schemas

Check <a href="https://github.com/USchema/json">boundled schemas</a> to see examples.
