---
title: Immutable Data Structures and Javascript
lead: Using Mori to bring simplicity to state handling
template: post.hbt
date: 2015-07-04
tags: javascript, functional, state, immutable, mori
---

One of the most difficult - perhaps *the* most difficult - issue in a complex front end application is state handling. I've written before about storing [all application state](http://lucasmreis.github.io/blog/a-more-functional-approach-to-angular/) in a [single, centralized object](http://lucasmreis.github.io/blog/a-more-functional-approach-to-angular-with-baobab/), and now I'll do it using *immutable data structures*.

I found that working with immutable data structures actually made the implementation *much simpler*! How can a limitation make something more powerful, one may ask? Follow me and let me explain.

##Why did I try this immutable thing

First of all, because I've been watching a lot of Rich Hickey videos lately, and everything this guy says just make sense. He says that an immutable collection is not only an "array that cannot be modified", but it is an *array that can be treated as a value*.

When we have two Numbers or two Strings, and we want to know if they are equal, we simply ask "are they equal?" by using the `===` operator. That's it - `2` always equals `2`, and if `a = 2` and `b = 2` we can say for sure that `a === b`. The same would be true for other values like `'this string' === 'this string'`.

But, if we have two arrays or objects, `===` does not work the same way. It works by comparing references, so `[1, 2, 3] === [1, 2, 3]` is false, because they are actually *two different collections that happen to have the same values*.

When working with immutable collections and objects, they are compared just like values. If they have the same elements, they are the same collection. Simple, isn't it? :)

This is possible due to smart algorithms and data structure implementation made by libraries like [Mori](http://swannodette.github.io/mori/) and [Immutable.js](https://facebook.github.io/immutable-js/). I will not go into detail here, but here's what we need to know regarding these data structures:

```js
import Mori from 'mori';

// a vector is an example of
// immutable data structure
const a = mori.vector(1, 2, 3);

// conj appends a value to the
// end of a vector, and returns
// a new vector
const b = mori.conj(a, 4);

mori.equals(b, mori.vector(1, 2, 3, 4))
// => true

// cool feature: the original vector is preserved
//   (that's why they are also called
//   persistent data structures)
mori.equals(a, mori.vector(1, 2, 3))
// => true

```

**Question 1.** Are the objects cloned every time I apply a transformation? **No.** And that's a key part of the reason the performance is almost the same as the mutable counterparts. These libraries are implemented so that a transformed object *share as much memory as possible* with the original object. ([more details here](http://hypirion.com/musings/understanding-persistent-vector-pt-1))

**Question 2.** That means that storing transformed versions of objects use little memory? **Yes!** If we have an one million elements conventional array that occupies 1GB of memory, clone it, append an element, and save both versions, we'll use 2GB of memory. If we use an immutable vector and `conj`, storing both versions will not occupy much more than storing only one vectors.

Pause a little bit to think about this last property of immutable objects, and think of how much awesomeness this "limitation" can bring to your code. ;)

##Back to application state

The application will only consist of two lists, Foos and Bars. The user can add a new Foo or a new Bar by the app inputs. Foos and Bars are unique.

Let's do it step by step:

* The application state will be represented by a vector of hashmaps. The last hasmap will be the current state:

```js
// appState.js
const initialValue = hashMap(
  'foos', set([1, 2, 3]),
  'bars', set(['a', 'b', 'c']));

// sets are unordered lists that have
// unique elements

let history = vector(initialValue);

// get current state
export const currentState = () => peek(history);
```

* To react to changes in the state, we register listeners. It consists of two functions: `listenTo`, that specifies a part/transformation of the state which will be listened to, and a `callback` to run if the state changes:

```js
// appState.js
let listeners = vector();

export const listen = (listenTo, callback) => {
  listeners = conj(listeners, hashMap(
    'listenTo', listenTo,
    'callback', callback
  ));
};
```

Example of a `listen` call:
```js
const prop = key => o => Mori.get(o, key);
listen(prop('bars'), renderSomething);
```

That means that everytime the property `bars` change, the function `renderSomething` will be run with `bars` as argument.

* To change state, one calls the update function. It changes it and call all listeners if their new `listenTo` result is different from the previous state:

```js
// appState.js

// callListener is called by the update
// function for each listener registered, with
// the previous and the new state value:
const callListener =
  (previousState, newState) => listener => {

    const listenTo =
    get(listener, 'listenTo');

  const previousListenTo =
    listenTo(previousState);

  const newListenTo =
    listenTo(newState);

    // if state does not change for
    // listener, nothing happens.
    // Remember 'equals' is super cheap! :)
  if (!equals(
    previousListenTo, newListenTo)) {
        get(listener, 'callback')(newListenTo);
  }
  };

export const update = fn => {
  const previousState = peek(history);

  // calculate new state
  const newState = fn(previousState);

  if (!equals(previousState, newState)) {
    // add new state to history.
    // Remember our data structures
    // are persistent, and share
    // memory space! :)
    history = conj(history, newState);

    // fire listener callbacks
    each(listeners, callListener(previousState, newState));
  }
};
```

* Good bonus: undo!

```js
// appState.js
export const undo = () => {
  if (count(history) > 1) {

    const previousState =
      peek(history);

    history =
      subvec(history, 0, count(history) - 1);

    const newState =
      peek(history);

    each(listeners,
      callListener(previousState, newState));
  }
}
```

* One can use

```js
// render.js
export let renderList = elem => seq =>
  elem.innerHTML =
    reduce(makeLi, '<ul>', seq) + '</ul>';

// index.js

// starts by rendering initial state:
const initialState =
  currentState();

renderList
  (foosElement)
  (get(initialState, 'foos'));

// renders again on state change:
listen(prop('foos'),
  renderList(foosElement));
```

* User interactions will call the `update` function to change state. The argument passed is a function that will transform the current state. Let's call those transformations commands:

```js
// command.js
const conjItem = item => coll =>
  conj(coll, item);

export const addFoo = foo => state =>
  updateIn(state, ['foos'], conjItem(foo));

// index.js

// input
let newFooElement =
  document.getElementById('new-foo');

// button
let addFooElement =
  document.getElementById('add-foo');

addFooElement.onclick = () =>
  update(addFoo(newFooElement.value));
```

And that's it!

The architecture is really simple, let's recap it:

* The application state is represented by an immutable object.
* The views are rendered according to the state object.
* Listeners with callbacks are registered. Changes in state cause callbacks to be called.
* State is changed by calling the update function.
* User interactions or any other event can call the update function.

##And what did we gain by using immutable data structures?

My first impression was: it was simple. After getting used to the Mori functions, it is very straightforward to manipulate the data structures. And the fact that Mori handles memory and performance very well makes the code very direct too.

Immutable persistent data structures make comparison very cheap, and it proved to be very important to the update function. Memory sharing is also an amazing feature that practically gave "undo" for free.

So, in the end it made easy, explicit and performant to implement application state as series of values.

##Next steps

I chose Mori because it's an interface to clojurescript native data structures. [Clojure](http://clojure.org/) is an amazing language, and I'm starting to study and experiment with it now.

Staying in javascript, it would also be interesting to get a look at [immutable.js](https://facebook.github.io/immutable-js/). It's maintained by facebook, and seems to play very well with React.
