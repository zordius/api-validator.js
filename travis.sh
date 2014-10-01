#!/bin/sh

echo "DEBUG ENV: ${TRAVIS_JOB_NUMBER} ${TRAVIS_BUILD_NUMBER} ..."

if [ "${TRAVIS_BUILD_NUMBER}.2" != "${TRAVIS_JOB_NUMBER}" ]; then
  echo "Only run sauce labs 1 time 1 commit... quit."
  exit 0
fi

if [ "${TRAVIS_REPO_SLUG}" != "zordius/api-validator.js" ]; then
  echo "Skip deploy because this is a fork... quit."
  exit 0
fi

# push coverage to codeclimate
npm install codeclimate-test-reporter
npm run-script coverage
node_modules/.bin/codeclimate < coverage/lcov.info

# skip browser build, browser test and deploy when api-validator.js.js not changed.
CODEDIFF=`git show --name-only ${TRAVIS_COMMIT} |grep api-validator.js`
if [ -z "$CODEDIFF" ]; then
  echo api-validator.js is not changed, SKIP browser build/test and deploy.
  exit 0
fi

# build JS files for dist and test
npm install grunt grunt-cli grunt-contrib-connect grunt-saucelabs
npm run-script lint && npm run-script build_std && npm run-script build_dbg && npm run-script build_min && npm run-script build_req && npm run-script build_tst

CODE=$?
if [ $CODE -ne 0 ]; then
  echo Build failed, abort.
  exit 1
fi
exit 0
# do sauce labs tests
node_modules/.bin/grunt || exit $?

# Setup git
git config --global user.name "Travis-CI"
git config --global user.email "zordius@yahoo-inc.com"

git add dist
git commit -m "Auto build dist files for ${TRAVIS_COMMIT} [ci skip]"

# push back dist files
git push "https://${GHTK}@github.com/zordius/api-validator.js.git" HEAD:${TRAVIS_BRANCH} > /dev/null 2>&1
