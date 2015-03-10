---
title: A more functional approach to Angular
lead: Keeping sanity while managing state
template: post.hbt
date: 2015-02-22
tags: javascript, angular, functional, state
---

We all know the story: a project is started with all the current best practices and an elegant architecture. Everything is beautiful - until it is not anymore. As the project grows, the complexity seems to grow at a higher rate, and it becomes more and more difficult to answer the simple question *what is happening to my application right now?* Or the even more important *what was happening when that crazy error occurred?* In this post, I propose a solution to this problem.

One day I was googling ways to deal with this type of complexity, and I came across the talk [Simple Made Easy](http://www.infoq.com/presentations/Simple-Made-Easy) by Rich Hickey and the paper [Out of the Tar Pit](https://github.com/papers-we-love/papers-we-love/tree/master/design/out-of-the-tar-pit.pdf), by Ben Moseley and Peter Marks. This material changed the way I think about programming, and every time I come back to them, I learn a little bit more.

I can see now that most of that complexity was coming from the way I was storing and dealing with the *state* of my application. It was all over the place. I was getting information from the APIs and storing them in the services themselves. It wasn't clear who was reading that information, who was transforming it, or who was writing it. A lot of debugging was needed to understand what was happening at any point in time, and it was really difficult to write tests for everything.

## The Solution

In order to solve this problem, I took a more *functional* approach by avoiding mutation as much possible and only changing variables in a few controlled places. In addition, to take it a step further, I stored *all the application state in a single place* (some React frameworks work this way, like [Om](https://github.com/omcljs/om) and [Morearty](https://github.com/moreartyjs/moreartyjs)).

The architecture is simple: all the state will be in one factory. Other services will consist of pure functions. The controllers will listen and/or change the state. And that's it! Let me explain it more, and illustrate with an example.

Remark: the solution will be illustrated in Angular, but it could, with little work, be implemented in other frameworks (or even vanilla JS for that matter).

The state will be stored in the `AppStateService` service. It has two methods: `listen` and  `change`. `listen` is used to observe one part of the state. Every time the `change` method is called, the listeners will be updated.

The controllers will have a `state` variable exposed to the views, which will be listening to `AppStateService`. It's important the that variable remain *immutable*; let's remember that `AppStateService` should only be mutated via the `change` method:

```javascript
// INSIDE CONTROLLER

// local variable to store the state values
var state = {};

// every time AppStateService changes,
// local state will change too:
AppStateService.listen('somePart',
  function(s) { state.somePart = s; });
// => state = { somePart: null }

// change AppStateService:
AppStateService.change('somePart', 'someValue');
// => state = { somePart: 'someValue' }
```

The `state` variable should be exposed to the views, together with pure functions to transform it:

```javascript
// using "Controller As" syntax
this.state = state;
this.summary = SomeService.summary;
```

```html
<div ng-controller="SomeController as ctrl">
  <p>Some Part: {{ ctrl.state.somePart }}</p>
  <p>Summary: {{ ctrl.summary(ctrl.state) }}</p>
</div>
```

If the view has any input, the controller will have another variable called `form`, to take advantadge of Angular's two-way binding:

```javascript
var form = { newFoo: 'initial value' };
this.form = form;
```

```html
<p>
  New Foo: <input type="text" ng-model="c.form.newFoo">
</p>
```

Now let's take this Foo example a little further, and start changing the State.

## A More Complete Example

Let `AppStateService` hold a `foos` array. We want a view with an input and a button that, when pressed, add a new Foo to `foos`:

```javascript
angular.module('simpleStateApp')
  .controller('FooCtrl', function(AppStateService) {

  var state = {};
  var form = {
    newFoo: ''
  };

  AppStateService.listen('foos',
    function(f) { state.foos = f; });

  // changeFoos is a function that
  // only affects the foos property
  var changeFoos = AppStateService.change('foos');

  var addFoo = function(state, form) {
    // using Ramda library
    var newFoos =
      R.append(form.newFoo, state.foos);
    changeFoos(newFoos);
  };

  // exposed to the view:
  this.state = state;
  this.form = form;

  this.addFoo = addFoo;
});
```

```html
<div ng-controller="FooCtrl as c">
  <h3>"Foo" form</h3>
  <p>
    New Foo: <input type="text" ng-model="c.form.newFoo">
    <button ng-click="c.addFoo(c.state, c.form)">
      Add Foo
    </button>
  </p>
</div>
```

So, now we have an `addFoo` function. It changes the state by appending `form.newFoo` to the `foos` array. The best part is: every part of the application listening to the `foos` array will be updated once the `changeFoos` function is called!

I setup a small project illustrating that idea [on Github](https://github.com/lucasmreis/simpleStateApp). It illustrates well the benefits of using this approach:

1. There's a "read only" controller, listening to both `foos` and `bars` arrays from `AppStateService`;
2. There's a Foo controller;
3. There's a Bar controller being used in *two* different views;
4. The Bar controller also listens to `foos`, and the user can only add a Bar after a Foo named `requiredFoo` is created (I call this the "weird spec" :) ). This is used to illustrate how different controllers can interplay in intricate ways through the State;
5. The application also listens to changes in state and save them on local storage.

## Conclusions

So, what have we gained from this architecture? In one word, *simplicity*. The entire application becomes more easily understandable. It's simple to reason about the whole application. Everything that changes with time is confined to `AppStateService`. You know exactly who changes and who listens to each part of it.

In the example posted, I also implemented the method `AppStateService.get()`, that returns the whole state object. Inject it into the console, and you have an incredible debugging tool. This answers the question we ask at the beginning of this post: *what is happening to my application right now?*

## Next Steps

This solution works really well for my current project, but, of course, I'm sure it could be improved. I would appreciate any input!

One feature I would love to see implemented: whenever a big problem happens, an error event would be sent to the server with the State object, so the developers can see exactly where the user was when the error ocurred. That would be awesome.

Here's the [working demo](https://github.com/lucasmreis/simpleStateApp).

**Update 2015-03-10**: I illustrate again this idea in the [next post](../a-more-functional-approach-to-angular-with-baobab), this time using the Baobab library. Check it out, it even has *undo*! :)

