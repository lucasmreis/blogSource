var Metalsmith  = require('metalsmith');
var markdown    = require('metalsmith-markdown');
var templates   = require('metalsmith-templates');
var metallic    = require('metalsmith-metallic');
var permalinks  = require('metalsmith-permalinks');
var collections = require('metalsmith-collections');
var moment      = require('moment');

Metalsmith(__dirname)
  .use(metallic())
  .use(formatDate())
  .use(addLink())
  .use(collections({
    posts: {
      pattern: 'posts/*.md',
      sortBy: 'date',
      reverse: true
    }
  }))
  .use(markdown())
  .use(templates('handlebars'))
  .use(permalinks({
      pattern: ':title'
    }))
  .destination('./build')
  .use(log())
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
        files[file].longDate  = moment(new Date(files[file].date)).format('LL');
        files[file].shortDate = moment(new Date(files[file].date)).format('ll');
      }
    }
    done();
  };
};

function addLink() {
  return function(files, metalsmith, done) {
    for (var file in files) {
      if (files[file].title) {
        files[file].link = files[file].title
          .trim()
          .toLowerCase()
          .replace(/,/g, '')
          .replace(/ /g, '-');
      }
    }
    done();
  }
}

function log() {
  return function(files, metalsmith, done) {
    console.log(metalsmith.metadata().collections.posts);
    done();
  }
}