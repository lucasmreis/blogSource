---
title: A more functional approach to Angular, part 2
lead: An implementation of the centralized state
template: post.hbt
date: 2015-03-05
tags: javascript, angular, functional, state
---

Talk about part 1. In this post, I present the implementation of  `AppStateService`.

Let me show you `AppStateService`:

```javascript
angular.module('simpleStateApp').factory('AppStateService', function(StateService) {
  var state = {
    foos: [1, 2, 3], // initial values
    bars: ['a', 'b', 'c']
  };

  var listeners = [];

  var get    = StateService.get(state);
  var change = StateService.change(state, listeners);
  var listen = StateService.listen(state, listeners);

  return {
    get: get,
    change: change,
    listen: listen
  };
});
```

We have a `state` variable that holds that actual State of the application. This is the variable that's going to be changed and listened to.

The `listeners` array is where we register everyone who is listening to `state`, together with the actions that will run once the listened part of `state` is changed. Here's the structure of a listener:

```javascript
var listener = {
  prop: 'foos',
  action: function(f) {
    console.log('New Foos Value:', f);
  }
};
```

To understand `get`, `change` and `listen`, I'm gonna show you `StateService`:

```javascript
var clone = R.clone; // using Ramda.js

function get(state) {
  return function() {
    return clone(state);
  };
}
```

`get` is simple: it returns a function that returns a clone of the state that was passed as a parameter. That's why `get(state)` is exposed at `AppStateService`.

The `listen` function is a little more complicated. Let's break it, starting from the signature:

```javascript
var listen = R.curry(function(state, listeners, prop, action) { ... };
```

`curry` is a function that let us call the function parameter by parameter, so `f(x, y, z)` could be called `f(x, y)(z)`, `f(x)(y, z)` or `f(x)(y)(z)`. It's *crucial* to this implementation - `AppStateService` exposes `listen` with both parameters `state` and `listeners` already filled!

So, why did I choose to implement `listen` that way?


```javascript
var listen = curry(function(state, listeners, prop, action) {
  var listener = {prop: prop, action: action};
  listeners.push(listener);

  var unsubscribe = function() {
    return listeners.splice(listeners.indexOf(listener), 1);
  };

  action(getStateProp(state, prop));

  return unsubscribe;
});
```
