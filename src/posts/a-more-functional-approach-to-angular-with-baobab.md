---
title: A more functional approach to Angular, with Baobab 
lead: Even simpler and more powerful
template: post.hbt
date: 2015-03-05
tags: javascript, angular, functional, state
---

[Last post]() I described a simple way to deal with state in an Angular application. I didn't detail the actual `AppStateService` implementation, and was about to do it in a "part 2". That's when I came across *Baobab*, a framework-agnostic library that actually implements the idea of a centralized State. In this post I'll recap a little bit on why the concept of a centralized State is important, I'll present the Baobab library, and I'll describe an adaptation of the last post's sample app that uses it.

## Why a central state is important?

A *state* can be thought of a "picture", or the "value", of something in a certain point in time. I'll call *central state* the value of your whole application in a certain point in time. So, as your application changes in time, every little part of that change will be stored in this central place. 

BUT WHY

## Presenting Baobab

In Baobab, the central state is created by passing a regular object to Baobab constructor:

```javascript
// if using node or browserify:
var Baobab = require('baobab');

var appState = new Baobab({
  cart: {
    products: []
  },
  paymentOptions: []
});
```

One can refer to any part of the tree with a the `select` function:

```javascript
var cartCursor = appState.select('cart');
var productsCursor = appState.select('cart', 'products');
```

The `select` function returns a *cursor*. The first thing you can do with a cursor is *extracting its value*:

```javascript
var currentCart = cartCursor.get();
// => currentCart = { products: [] }
var currentProducts = productsCursor.get();
// => currentProducts = []
```

You can also *update its value*, and *listen to updates*:

```javascript
var cartCursor = appState.select('cart');
var productsCursor = appState.select('cart', 'products');
var paymentOptionsCursor = appState.select('paymentOptions');

cartCursor.on('update', someCallback);
productsCursor.on('update', anotherCallback);
paymentOptionsCursor.on('update', yetAnotherCallback);

productCursor.push({ id: 123 });
// only someCallback and anotherCallback will be called
```

What's so great about it? First, the "listening" part of your application does not need to know anything about the "changing" part. You just listen to updates to the tree, and act on it. Also, if you have a view that only needs to know about the products, just listen to updates on the products. No need to listen to the whole tree.

## A sample app

Now let's use it on a sample application. In it, we'll have two arrays: Foos and Bars. Both will hold strings. To add a weird spec to the mix, the user cannot add any Bar unless Foos has the string `'requiredFoo'`. Let's implement it piece by piece, starting with the central state:

```javascript
// app.js
angular.module('simpleStateApp', []);

// services/appState.js
angular.module('simpleStateApp')
  .factory('AppState', function() {
  
  var initial = {
    foos: [],
    bars: []
  };
  var state = new Baobab(initial);
  
  return state;
```

Simple and elegant. Don't we all like when that happens? :) Now let's implement `ReadOnlyCtrl`, a controller that only reads the central state values:

```javascript
// controllers/readOnlyController.js
angular.module('simpleStateApp')
  .controller('ReadOnlyCtrl', function(AppState) {
  
  var state = AppState.get();

  var foosCursor = AppState.select('foos');
  var barsCursor = AppState.select('bars');

  foosCursor.on('update', 
    function() { state.foos = foosCursor.get(); });

  barsCursor.on('update', 
    function() { state.bars = barsCursor.get(); });

  // exposes to view
  this.state = state;
});
```

`state` will be rendered in the view like any other variable:

```html
<div ng-controller="ReadOnlyCtrl as c">
  <h3>Read Only Controller</h3>
  <p>Foos:
    <ul>
      <li ng-repeat="foo in c.state.foos">{{ foo }}</li>
    </ul>
  </p>
  <p>Bars: 
    <ul>
      <li ng-repeat="bar in c.state.bars">{{ bar }}</li>
    </ul>
  </p>
</div>
```

Now let's implement a controller that changes the central state:

```javascript
// controllers/fooController.js
angular.module('simpleStateApp')
  .controller('FooCtrl', function(AppState) {
  
  var foosCursor = AppState.select('foos');

  var state = { 
    foos: foosCursor.get()
  };
  
  // the inputs in the view will refer to
  // this variable
  var form = {
    newFoo: ''
  };

  foosCursor.on('update', 
    function() { state.foos = foosCursor.get() });

  var addFoo = function(form) {
    foosCursor.push(form.newFoo);
  };

  this.state = state;
  this.form = form;

  this.addFoo = addFoo;
});
```

And the view:

```html
<div ng-controller="FooCtrl as c">
  <h3>"Foo" form</h3>
  <p>
    New Foo: <input type="text" ng-model="c.form.newFoo">
    <button ng-click="c.addFoo(c.form)">Add Foo</button>
  </p>
</div>
```

`BarCtrl` is a little more complicated: it has the `cannotAddBar` function that implements the weird spec, and `clearState` that clears central state:

```javascript
// controllers/barController.js
angular.module('simpleStateApp')
  .controller('BarCtrl', function(AppState) {

  var foosCursor = AppState.select('foos');
  var barsCursor = AppState.select('bars');

  var state = AppState.get();
  var form = {
    newBar: ''
  };

  foosCursor.on('update', 
    function() { state.foos = foosCursor.get(); });
  barsCursor.on('update', 
    function() { state.bars = barsCursor.get(); });

  var addBar = function(form) {
    barsCursor.push(form.newBar);
  };

  var cannotAddBar = function(state) {
    return state.foos.indexOf('requiredFoo') === -1;
  };

  var clearState = function() {
    foosCursor.edit([]);
    barsCursor.edit([]);
  };

  this.state = state;
  this.form = form;

  this.addBar = addBar;
  this.cannotAddBar = cannotAddBar;
  this.clearState = clearState;
  this.undo = undo;
});
```

With the view:

```html
<div ng-controller="BarCtrl as c">
  <h3>Second "Bar" form</h3>
    <p>
      New Bar: <input type="text" ng-model="c.form.newBar">
      <button ng-click="c.addBar(c.form)" 
              ng-disabled="c.cannotAddBar(c.state)">
        Add Bar
      </button>
    </p>
    <p>
      Click <a href="" ng-click="c.clearState()">here to clear the State</a>.
    </p>
</div>
```



## Conclusions

xxx

## Next steps

xxx
