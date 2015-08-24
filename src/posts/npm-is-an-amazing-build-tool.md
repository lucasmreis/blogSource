---
title: NPM is an amazing build tool
lead: And solves 90% of the build issues
template: post.hbt
date: 2015-08-22
draft: false
tags: javascript, build, npm
---

I really like the "build first approach" to development, in which we automate common tasks and simplify workflow as soon as we can. We lose a few minutes setting up the build tool, but save hours with the automation and have quicker feedback for errors and problems. No one argues with that these days.

I read a really good book on the "build first approach" applied to javascript, [Javascript Application Design](http://www.manning.com/bevacqua/), which was published in January 2015. It describes good practices on building javascript applications, and illustrate the task automations with Grunt.

But we know the javascript world, and now, in August 2015, Grunt is old enough to be in a museum. Gulp is the new thing, let's use it! I've worked with both, and I agree that the Gulp approach seems more sensible. But this time I want to talk about a third approach I've come accross: using *NPM itself* as the build tool. I've found that it solves 90% of all the build issues we have, and it's suitable for most projects we'll get involved with.

## Npm Scripts = Tasks

The `package.json` file has a `scripts` key, and that's where the tasks are registered. Each task is simply a command that will be run. For instance, let's suppose Mocha is being used as the testing framework, with [Babel](https://babeljs.io/) transpiler. To use it, we run the command in the terminal:

```
$ npm install -g mocha
$ mocha --recursive --compilers js:babel/register --reporter spec
```

One have to install Mocha globally, and run this complex command everytime one wants to run the tests. If we use npm scripts, that's how we would do it: first, edit the `package.json` file:

```javascript
"scripts": {
  "test": "mocha --recursive --compilers js:babel/register --reporter spec"
}
```

And then we use it simply by runnig the command `npm test` in the terminal.

There's a bonus for using the npm scripts: the packages do not have to be installed globally to be used in a script! That means that one only has to install Mocha by running `npm install --save-dev mocha`, and the `npm test` above will run. I find this is really good, since no global installing is needed, and every package used ends up listed in the `package.json`.

## Organizing The Project

I like to organize my project by having three folders: `src`, `test` and `dist`. The tests are all in `test`, and the source code in `src` gets compiled to `dist`. We already have the `npm test` task registered, let's register the task to compile javascript, using [Browserify](http://browserify.org/):

```javascript
"scripts": {
  "js": "browserify src/scripts/index.js -t babelify --outfile dist/app.js"
}
```

Which we use by running:

```
$ npm run js
```

**Important:** the `test` and `start` are "default" scripts, and can be called directly with `npm test` and `npm start`. The other scripts we are going to write need to be called with `npm run`.

One can also call simple commands in scripts. For instance, sometimes we only need to copy files to `dist` folder:

```javascript
"scripts": {
  "html":   "cp src/index.html dist/",
  "assets": "cp -R src/assets/ dist/assets/"
}
```

One can also run npm scripts inside npm scripts! Let's create a first version of a complete `build` script, using the `js`, `html` and `assets` scripts:

```javascript
"scripts": {
  "build": "npm run js && npm run html && npm run assets"
}
```

Simple and direct! :)

## Serving Static Files

I like to use the default script `npm start` to start a local server and serve the static files"

```javascript
"scripts": {
  "start": "cd dist && httpserver"
}
```

The [httpserver](https://www.npmjs.com/package/httpserver) package is super simple: fire it, and it starts serving the files in the current directory. By using the script, we do not need to enter and exit the `dist` directory, and we do not need to install `httpserver` globally!

## What About Watching Files?

A crucial part of a good build workflow is minimizing the time between editing and serving the files. That results in quick feedback, and errors can be spotted earlier. 

A lot of the packages we use to build our project already have support for listening to changes on source files. Let me illustrate it with the package [node-sass](https://github.com/sass/node-sass), which I've been using to compile Sass files to CSS:

```javascript
"scripts": {
  "css":       "node-sass src/styles/ -o dist/",
  "css:watch": "node-sass -w src/styles/ -o dist/"
}
```

If a terminal command is being used, or there's no watch capabilities in the library used, one can use one of many watching packages available in npm. I've been using [onchange](https://github.com/Qard/onchange):

```javascript
"scripts": {
  "html":         "cp src/index.html dist/",
  "html:watch":   "onchange 'src/*.html' -v -- npm run html",
  "assets":       "cp -R src/assets/ dist/assets/",
  "assets:watch": "onchange 'src/assets/*.*' -v -- npm run assets",
}
```

After having all the `:watch` versions of the scripts, we can write our `build:watch` script. We could call all the scripts with `&&`, just like we did in `build`, but let's do something different this time: let's run the tasks in parallel! I'll use [parallelshell](https://github.com/keithamus/parallelshell):

```javascript
"scripts": {
  "build:watch": "parallelshell 'npm run js:watch' 'npm run css:watch' 'npm run html:watch' 'npm run assets:watch'"
}
```

And there we have it: watching and compiling all the files, in parallel.

## Conclusions

I personally like the approach of developing small building blocks, and I enjoy the fact that each script is a terminal command. I found these characteristics make npm scripts direct, easy and simple.

These commands alse are definitely more perennial than Grunt and Gulp programming style. This makes npm builds mre robust to technology changes than these two frameworks.

Even if one does not use it to build, npm scripts can make our job easier when dealing with complex terminal commands. In our example, if we want to deploy our application to Github Pages, we need to push the `dist` directory as a root to the `gh-pages` branch. It's a complex git command, and we can automate it this way:

```javascript
"scripts": {
  "deploy": "git subtree push --prefix dist origin gh-pages"
}
```

And that's it: a new tool to make our development life easier. 






