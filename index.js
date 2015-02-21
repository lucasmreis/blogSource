var Metalsmith = require('metalsmith');
var markdown   = require('metalsmith-markdown');
var templates  = require('metalsmith-templates');
var metallic   = require('metalsmith-metallic');
var permalinks = require('metalsmith-permalinks');

Metalsmith(__dirname)
  .use(metallic())
  .use(markdown())
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