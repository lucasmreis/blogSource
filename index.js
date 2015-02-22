var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var templates  = require('metalsmith-templates');
var metallic   = require('metalsmith-metallic');
var permalinks = require('metalsmith-permalinks');
var moment     = require('moment');

Metalsmith(__dirname)
  .use(metallic())
  .use(markdown())
  .use(formatDate())
  .use(templates('handlebars'))
  .use(permalinks({
      pattern: ':title'
    }))
  .destination('./build')
  .build(buildCallback);

function buildCallback(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Build complete!');
  } 
};

function formatDate() {
  return function(files, metalsmith, done) {
    for (var file in files) {
      if (files[file].date) {
        files[file].date = moment(new Date(files[file].date)).format('LL');
      }
    }
    done();
  };
};