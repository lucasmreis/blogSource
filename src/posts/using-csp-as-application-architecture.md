---
title: Using CSP As Application Architecture 
lead: Process based client-side web applications
template: post.hbt
date: 2015-09-29
tags: javascript, csp, process, architecture, state
draft: true
---

Intro: Clojure, Go... CSP. Quiescent Todomvc

Intro to CSP?

## The Architecture

The application has an object called **state**. The state holds the information needed to render the screen. 

There's a **render process**, that triggers a React render (or whatever view framework you want to use) whenever a new state object is put in the **render channel**.

There are **update processes**, that transform state according to the data put in the **update channels**. After transforming the state, the update process put the new state in the render channel.

There are **complex actions processes**, that are asynchronous processes that can trigger multiple update processes. It usually involves communication with the server, or any action that takes time to complete.

That's it, those are the basic processes in the framework. One could also run more processes, like a router or websocket process, but let's start with the basic ones.

## Application Config

First of all let's create the application config object. An example would be:

```js
// index.js
import {chan, go, take, put, putAsync, buffers} from 'js-csp';

const loadApp = () => ({
  state: {
    words: ['first', 'second', 'last'],
    current: 0,
    loading: false
  },
  updates: {
    channels: {
      view: chan(),
      add: chan(),
      loading: chan()
    },
    consumers: {
      view: Updates.view,
      add: Updates.add,
      loading: Updates.loading
    }
  },
  complexActions: {
    channels: {
      dbInsert: chan()
    },
    consumers: {
      dbInsert: ComplexActions.dbInsert
    }
  },
  renderCh: chan()
});
```
 
And our `start` function:

```js
const start = () => {
  let app = loadApp();
  window.app = app // for debugging
};

start();
```

The config object has the `state`, the render channel `renderCh`, and the `updates` and `complexActions` channels and consumers. I'm going to explain those later.

The `start` function loads the config, and will start all the processes. I like to put the loaded app in the `window` object, so I can play with it in the browser console, very much like Clojure's command line.

Get your build flow running (I like to use [npm as a build tool](http://lucasmreis.github.io/blog/npm-is-an-amazing-build-tool/) for that) and let's dive into the update processes.

## Updates

Let's pick one functionality in our app: adding a new word to the `state.words` list. First, let's implement the function that receives the old state, the word to add, and returns the new state with the word added:

```js
// updates.js

// util functions
const clone = obj => JSON.parse(JSON.stringify(obj)); // naive but cool!

const assoc = (obj, prop, value) => {
  const cl = clone(obj);
  cl[prop] = value;
  return cl;
};

// update function
export const loading = (state, loadingState) =>
  assoc(state, 'loading', loadingState);
```

Every update function will receive two parameters: the state, and the data used in the transformation, and returns a new state. Since it's a pure function, it's super simple to unit test!

Now let's write a function to initiate a process that takes data from the `updates.channels.loading` channel, and transforms `state`:

```js
// index.js

const initLoadingUpdate = app => {
  const updateFn = app.updates.consumers.loading;
  const ch = app.updates.channels.loading;
  go(function* () {
    // the process will go on forever
    while (true) {
      // the process pauses waiting for a
      // value to be put in the channel
      const value = yield take(ch);

      // logging
      console.log(`On update channel [ loading ] received value [ ${JSON.stringify(value)} ]`);

      // updates the state
      app.state = updateFn(app.state, value);
    }
  });
};


```

And we can call it in the `start` function:

```js
const start = () => {
  let app = loadApp();
  window.app = app // for debugging

  initLoadingUpdate(app);
};

start();

// for debugging
window.csp = require('js-csp');
```

Let's test it in the browser. Write in the console:

```js
> app.state.loading
< false

> csp.putAsync(app.updates.channels.loading, true)
< On update channel [ loading ] received value [ true ]

> app.state.loading
< true
```

It works! :)

But we'll have many update processes. In our application we have three: `view`, `add` and `loading`. The first changes the word being shown in the screen (by changing `state.current`), and the second adds a new word. First, the functions:

```js
// update.js

// util function
const append = (array, value) => {
  const cl = clone(array);
  cl.push(value);
  return cl;
};

// update functions
export const view = (state, direction) => {
  const nextCurrent = direction === 'next' ?
    Math.min(state.current + 1, state.words.length - 1) :
    Math.max(state.current - 1, 0);

  return assoc(state, 'current', nextCurrent);
};

export const add = (state, newWord) =>
  assoc(state, 'words', append(state.words, newWord));
```

And let's change `initLoadingUpdate` to `initUpdates`, which loads a process for each update:

```js
const initUpdates = app => {
  Object.keys(app.updates.consumers).forEach(k => {
    const updateFn = app.updates.consumers[k];
    const ch = app.updates.channels[k];
    go(function* () {
      while (true) {
        const value = yield take(ch);
        console.log(`On update channel [ ${k} ] received value [ ${JSON.stringify(value)} ]`);
        app.state = updateFn(app.state, value);
      }
    });
  });
};

const start = () => {
  let app = loadApp();
  window.app = app; // for debugging and testing

  initUpdates(app);
};
```

In the console, use `csp.putAsync` to put data in the channels and check the transformations being done in `app.state`!

## Complex Actions

Sometimes one action cannot be translated in a simple update function. Take, for example, an action that inserts data in a db through a web server. It will set loading to true, make the request, update the state, and set loading to false. 

These are what I'm calling complex actions: functions that call more than one update in a period of time. They also receive two parameters: the update channels object, and the data required for the action.

For instance, let's think of the complex action that changes the nickname of person with a given person ID:

```js
export const changeNickname = (updateChannels, {personId, newNickname}) => {
  go(function* () {
    // do stuff and put in update channels
  });
};
```

For now, let's implement a "fake" complex action:

```js
// complexActions.js
import {go, put, timeout} from 'js-csp';

export const dbInsert = (updateChannels, newWord) => {
  go(function* () {
    yield put(updateChannels.loading, true);

    // do something costly
    yield timeout(1000);
    yield put(updateChannels.add, newWord);

    yield put(updateChannels.loading, false);
  });
};
```

It's not as simple to unit test a complex action, but it's not complicated either. You just create the update channels and check the values passed to them. 

And now the `initComplexActions`, which is very similar to `initUpdates`:

```js
const initComplexActions = app => {
  Object.keys(app.complexActions.consumers).forEach(k => {
    const complexActionFn = app.complexActions.consumers[k];
    const ch = app.complexActions.channels[k];
    go(function* () {
      while (true) {
        const value = yield take(ch);
        console.log(`On complex action channel [ ${k} ] received value [ ${JSON.stringify(value)} ]`);
        complexActionFn(app.updates.channels, value);
      }
    });
  });
};

const start = () => {
  let app = loadApp();
  window.app = app;

  initUpdates(app);
  initComplexActions(app);
};
```

Now go to the browser console and type:

```js
> csp.putAsync(app.complexActions.channels.dbInsert, 'another')
< On complex action channel [ dbInsert ] received value [ "another" ]
< On update channel [ loading ] received value [ true ]
// after 1000 miliseconds...
< On update channel [ add ] received value [ "another" ]
< On update channel [ loading ] received value [ false ]

> app.state.words
< ["first", "second", "last", "another"]
```

And that's exactly what we wanted. 

## Rendering

Rendering process works like this:

1. When a state is received in the `app.renderCh` channel, it triggers the rendering function. In our case it will be React, but it could be any other view framework.
2. The process will be "busy" until the next animation frame. That means it will not trigger the rendering function if a new state is received and rendering is taking place.
3. If a new state is put in the channel, and there's already a state there waiting to be rendered, the older state will be discarded, and only the new state will be rendered. 

Let's start with number 3. That logic is ready for us in the `js-csp` library (and in `core async` too). Change the definition of `app.renderCh` to:

```js
  renderCh: chan(buffers.sliding(1))
```

That means that the channel will hold 1 value at a time. And, if another value is put in the channel, the last one will be discarded and the new value will be available. This is the *sliding strategy*.

Now, to the render process:

```js
const initRender = (app, element) => {
  // render initial state
  putAsync(app.renderCh, app.state);

  go(function* () {
    while(true) {
      const state = yield take(app.renderCh);
      
      // little trick to "synchronize" async functions,
      // explained below
      const finishRender = chan();

      // render passing state and channels, so
      // the user can trigger updates and 
      // complex actions from the interface
      React.render(
        
        // main component
        <Main
          appState = {app.state}
          updateChannels = {app.updates.channels}
          complexActionsChannels = {app.complexActions.channels} />,

        // DOM element to mount
        element,

        // callback to rendering, explained below
        () => window.requestAnimationFrame(() => putAsync(finishRender, {})));
      // waits for a value in the finishRender channel
      yield take(finishRender);
    }
  });
};
```

The first thing the process does is getting a value from the render channel. Then, the `finishRender` channel is created. This is a trick so the process wait for the `React.render` and `window.requestAnimationFrame` functions to continue.

Both functions are async, and don't block the main thread when called. That means that right after `React.render` is called, the expression `yield take(finishRender);` will be evaluated. That way the process will be paused until any value is put in the `finishRender` channel.

`React.render` accepts a callback, and I'm calling `window.requestAnimationFrame`. This function waits for the next browser rendering frame and calls another callback.

So, what is happening here is: whenever the render is started, it waits for the next animation frame to get a new state to render. This way we make sure no unnecessary renders are triggered! Cool, isn't it?

A little modification is needed in the `initUpdates` process: the new state should be put in the render channel:

```js
// ...
app.state = updateFn(app.state, value);
yield put(app.renderCh, app.state);
// ...
```

We start it by calling it in the `start` function:

```js
const start = () => {
  let app = loadApp();
  window.app = app;

  initUpdates(app);
  initComplexActions(app);
  initRender(app, document.getElementById('main'));
};
```

Go to the console and write the following command to add a thousand new words, and see how efficiently it's rendered:

```js
> for (var i = 0; i < 1000; i++) 
  { csp.putAsync(app.updates.channels.add, 'word' + i); }
```

## The Finished Application

The code for the final application can be seen [here](https://github.com/lucasmreis/csp-architecture/tree/master/src), and it can be seen running [here](http://lucasmreis.github.io/csp-architecture/#). Be sure to open the console, inspect the `app` object, and play with the channels!

## Conclusion

CSP is a simple, really powerful and time-tested way of dealing with asynchronous programming. Using it as an application framework was very rewarding. The architecture is very robust, and seems to scale well. I'm certainly going to use it in other projects, and I encourage everyone to try it!

## Next Steps

I want to battle test it in a bigger project, to really get a sense of how it will behave. 

Most client-side application demands could be translated as an update or complex action, at least the ones triggered by the user. But some could be implemented as ever running processes, initiated in the `start` function. For instance, a simple router could be written as:

```js
const initHistory = app => {
  // a nav channel could handle
  // the state transformations
  // caused by changing the route.
  //
  // hash changes => nav channel
  window.addEventListener('hashchange', () => {
    const screen = window.location.hash.slice(2);
    const current = get(app.state, 'screen');
    if (screen !== current) {
      putAsync(app.updates.channels.nav, screen);
    }
  });
}
```

I also would like to experiment this way with web sockets.

If any of you want to exchange some ideas about using CSP as a framework with javascript, or any other flavor of front end programming, feel free to email me at [lucasmreis@gmail.com](mailto:lucasmreis@gmail.com).













