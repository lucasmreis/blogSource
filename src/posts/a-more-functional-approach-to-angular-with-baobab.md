---
title: A more functional approach to Angular, with Baobab
lead: Even simpler and more powerful
template: post.hbt
date: 2015-03-10
tags: javascript, angular, functional, state
---

[Last post](http://lucasmreis.github.io/blog/a-more-functional-approach-to-angular/) I described a simple way to deal with state in an Angular application. I didn't detail the actual `AppStateService` implementation, and was about to do it in a "part 2". That's when I came across *Baobab*, a framework-agnostic library that actually implements the idea of a centralized state. In this post I'll recap a little bit on why the concept of a centralized state is important, then I'll present the Baobab library, and finally I'll describe an adaptation of the last post's sample app that uses it.

## Why is having a central state important?

A *state* can be thought of a "picture", or the "value", of something in a certain point in time. I'll call *central state* the value of your *whole application* in a certain point in time. So, as your application changes, every little part of that change will be stored in this central place.

Having present and past states stored in a single place makes it easier to implement new features in an application, and change old ones. It's easier to make sense of what's happening in it. And as I said in the [previously mentioned post](http://lucasmreis.github.io/blog/a-more-functional-approach-to-angular/):

> As the project grows, the complexity seems to grow at a higher rate, and it becomes more and more difficult to answer the simple question *what is happening to my application right now?* Or the even more important *what was happening when that crazy error occurred?*

## Presenting Baobab

In Baobab, the central state is created by passing a regular object to the constructor:

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

One can refer to any part of the tree with the `select` function:

```javascript
var cartCursor = appState.select('cart');
var productsCursor = appState.select('cart', 'products');
```

`select` returns a *cursor*. The first thing you can do with a cursor is *extracting its value*:

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

Now let's use it on a sample application. In it, we'll have two arrays: Foos and Bars. Both will hold strings. To add a weird spec to the mix, the user should not be able to add any Bar unless Foos has the string `'requiredFoo'`. Let's implement it piece by piece, starting with the central state:

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

That was easy! Now let's implement a controller that changes the central state:

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

Note the `form` variable. It holds the temporary values of the HTML inputs. The `addFoo` function receive this as the parameter, and change the value of the tree. We'll call `addFoo` with a button `ng-click`, but that's a design decision. It could also be on the input `ng-change`, for instance. Let's see the view code:

```html
<div ng-controller="FooCtrl as c">
  <h3>"Foo" form</h3>
  <p>
    New Foo: <input type="text" ng-model="c.form.newFoo">
    <button ng-click="c.addFoo(c.form)">Add Foo</button>
  </p>
</div>
```

`BarCtrl` has more features: `cannotAddBar`, the function that implements the weird spec, and `clearState`, the function that clears central state:

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

And that's it! But wait, there's a little problem we need to deal with. The views do not update as soon as the central state is updated. This happens because Angular's change detection mechanism is not triggered by an update in the central state. We can fix it by putting this piece of code inside `AppState`:

```javascript
// services/appState.js
state.on('update', function () {
  setTimeout(function () {
    $rootScope.$apply();
  }, 0);
});
```

And our application will run smoothly!

## Adding features

That's when this architecture shines. Because everything that  changes is stored in one place, we can easily plug new functionalities by interacting with the central state. 

Let's suppose we want to save our state in the local storage, so that every time the user go back to it, the last state will be loaded. 

The idea is to load the saved state when starting the app, and saving it on every change. Let's first implement a `save` and a `load` function in a service:

```javascript
// services/storageService.js
angular.module('simpleStateApp')
  .factory('StorageService', function() {
  
  var save = function(prop, items) {
    window.localStorage.setItem(
      'baobab-app-' + prop, 
      JSON.stringify(items));
    return items;
  };

  var load = function(prop, defaultValue) {
    var items = JSON.parse(
      window.localStorage.getItem(
        'baobab-app-' + prop));
    return items ? items : defaultValue;
  };

  return {
    save: save,
    load: load
  };
});
```

Now let's change `AppState` to load local storage on startup:

```javascript
var initial = {
  foos: [],
  bars: []
};
var state = new Baobab(
  StorageService.load('baobab', initial),
);
```

And let's use a `.run` to save the state on every update:

```javascript
angular.module('simpleStateApp', [])
  .run(function(StorageService, AppState) {
    AppState.on('update', 
      function() { 
        StorageService.save('baobab', AppState.get()); 
      });
  });
```

And the new feature is added. It shined, didn't it? :)

## One little Baobab bonus

Baobab does it work very well, and still gives us a free important and amazing bonus: undo. We just have to first pass a config to the constructor:

```javascript
// services/appState.js
var state = new Baobab(
  StorageService.load('baobab', initial),
  { 
    maxHistory: 10
  }
);
```

And implement the `undo` function on the controller:

```javascript
// controllers/barController.js
var undo = function() { 
  if (AppState.hasHistory()) { 
    AppState.undo(); 
  }
};
```

And our undo is done.

## Conclusions

That was a lot for a post! But I hope I could show some benefits of having a centralized state application architecture. It's all about being very simple to add new features and change old ones, and, as was said before, answering the really important question *what is happening in my application right now?*

## Next steps

Javascript is going through a big change now with ES6, and Angular 2 is on its way. I'm looking forward to see how to implement a centralized state using these tools.

React is a great framework, that's gaining a lot of traction. I knew about Baobab through [Christian Alfoni](http://christianalfoni.github.io/)'s amazing blog, and he wrote an amazing post on [how to use it with React](http://christianalfoni.github.io/javascript/2015/02/06/plant-a-baobab-tree-in-your-flux-application.html).

On another note, I will also implement the app in a *point-free functional* style. I try to write my functions point-free whenever I can; it's also a way to bring simplicity to the function level. More details in an upcoming post!

The example presented in this post has a [live demo here](http://lucasmreis.github.io/baobabStateApp/). Complete source code can be found [here](https://github.com/lucasmreis/baobabStateApp).