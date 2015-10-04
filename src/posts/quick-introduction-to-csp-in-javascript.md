---
title: Quick Introduction To CSP In Javascript
lead: Communicating Sequential Processes In Seven Small Examples
template: post.hbt
date: 2015-09-25
tags: javascript, csp, process, architecture, state
draft: false
---

*What is CSP?* In practice, it's a way of writing concurrent code. The language Go uses it natively, Clojure has core.async which achieves it by using macros, and now we can use it in Javascript because of generators, which were included in ES6.

*Why should I bother?* Because it's very powerful, efficient and simple. What more do you want? :)

*Ok, let's do it. How do I start using it?* We will use [js-csp](https://github.com/ubolonton/js-csp), and we will need need generators, which are only included in ES6.  That means you'll have to use Node 4 or superior, or transpile your browser code with [babel](https://babeljs.io/) (or any other transpile tool that supports generators).

Enough talking, let's go to the examples!

## Example 1: The Process

A process is the first concept we're gonna learn. It runs code. And it's as simple as that. :)

This is the syntax to start a process: just pass a generator as a parameter to the `go` function. 

```js
import {go} from 'js-csp';

go(function* () {
  console.log('something!');
});

// terminal output:
//
// => something!
```

## Example 2: The Process Can Pause

By using the `yield` keyword, you can pause a process, freeing the main thread:

```js
import {go, timeout} from 'js-csp';

go(function* () {
  yield timeout(1000);
  console.log('something else after 1 second!');
});

console.log('something!');

// terminal output:
//
// => something!
// => something else after 1 second!
```

## Example 3: Processes Wait For Values In Channels

The channels are the second and last concept we're gonna learn. They are queues, and whenever process calls `take` on a channel, it pauses until a value is `put` into that channel. 

```js
import {go, chan, take, putAsync} from 'js-csp';

let ch = chan();

go(function* () {
  const received = yield take(ch);
  console.log('RECEIVED:', received);
});

const text = 'something';
console.log('SENDING:', text);

// use putAsync to put a value in a
// channel from outside a process
putAsync(ch, text);

// terminal output:
//
// => SENDING: something
// => RECEIVED: something
```

## Example 4: Processes Communicate Through Channels

On the other side, processes that `put` a value on a channel also pause until some other process uses `take`. 

This example is a little bit more complex, try to follow the flow of the main thread, and check it with the terminal output!

```js
import {go, chan, take, put} from 'js-csp';

let chA = chan();
let chB = chan();

// Process A
go(function* () {
  const receivedFirst = yield take(chA);
  console.log('A > RECEIVED:', receivedFirst);

  const sending = 'cat';
  console.log('A > SENDING:', sending);
  yield put(chB, sending);

  const receivedSecond = yield take(chA);
  console.log('A > RECEIVED:', receivedSecond);
});

// Process B
go(function* () {
  const sendingFirst = 'dog';
  console.log('B > SENDING:', sendingFirst);
  yield put(chA, sendingFirst);

  const received = yield take(chB);
  console.log('B > RECEIVED:', received);

  const sendingSecond = 'another dog';
  console.log('B > SENDING:', sendingSecond);
  yield put(chA, sendingSecond);
});

// terminal output:
//
// => B > SENDING: dog
// => A > RECEIVED: dog
// => A > SENDING: cat
// => B > RECEIVED: cat
// => B > SENDING: another dog
// => A > RECEIVED: another dog
```

## Example 5: Channel Are Queues

Because channels are queues, when a process takes from a channel, the value will not be available for other processes to take. One process puts, one process takes. 

In the example below you can check that the second process will never print `B > RECEIVED: dog`, because the value was already taken by the first process.

```js
import {go, chan, take, put} from 'js-csp';

let ch = chan();

go(function* () {
  const text = yield take(ch);
  console.log('A > RECEIVED:', text);
});

go(function* () {
  const text = yield take(ch);
  console.log('B > RECEIVED:', text);
});

go(function* () {
  const text = 'dog'
  console.log('C > SENDING:', text);
  yield put(ch, text);
});

// terminal output:
//
// => C > SENDING: dog
// => A > RECEIVED: dog
```

## Example 6: Buffered Channels Don't Block On Put

A channel can be buffered, which means that, for a given number of puts, a `put` will not make the process pause. 

In the next example, even though no one called `take`, the first two puts will not block the process. But the channel has a buffer of size 2, so the third put will block the process, until someone takes from it.

```js
import {go, chan, put, buffers} from 'js-csp';

let ch = chan(buffers.fixed(2));

go(function* () {
  yield put(ch, 'value A');
  yield put(ch, 'value B');
  console.log('I should print!');
  yield put(ch, 'value C');
  console.log('I should not print!');
});

// terminal output:
//
// => I should print!
```

## Example 7: Dropping And Sliding Buffers

Apart from the fixed buffer, which blocks after N puts, we have the dropping and sliding buffers too.

The dropping buffer can hold up to N values. Any additional values that are put into a dropping buffer will be discarded.

The sliding buffer can also hold up to N values. But, as opposed to the dropping buffer, when a new value is put into the sliding buffer, the first value put is dropped, and the buffer holds the new value.

In the example below, `value B` and `value C` get dropped in the dropping channel, because it was holding `value A`. On the second process, as soon as `value B` is put in the channel, `value A` is dropped. And as soon as `value C` is put in the channel, `value B` is dropped.

Because of the way they work, dropping and sliding buffers never block!

```js
let droppingCh = chan(buffers.dropping(1));
let slidingCh  = chan(buffers.sliding(1));

go(function* () {
  yield put(droppingCh, 'value A');
  yield put(droppingCh, 'value B');
  yield put(droppingCh, 'value C');
  console.log('DROPPING:', yield take(droppingCh));
});

go(function* () {
  yield put(slidingCh, 'value A');
  yield put(slidingCh, 'value B');
  yield put(slidingCh, 'value C');
  console.log('SLIDING:', yield take(slidingCh));
});

// terminal output:
//
// => DROPPING: value A
// => SLIDING: value C
```

## Conclusion

After using CSP for a while, coding asynchronous code with callback or promises seems jurassic. I'm hopeful that with ES6 generators, CSP will become the standard in Javascript, as it is with Go and is starting to be with Clojure.

## Next Steps

Two other models also seem very interesting, and they could be considered more high level than CSP: *Functional Reactive Programming* and *Actors*, as they are used in Reactive Extensions and Erlang, respectively. I will definetely cover these these in future blog posts.

I also believe that CSP could be an amazing *front end framework*.  To read more, check out my blog post [*Using CSP as Application Architecture*](../using-csp-as-application-architecture/).

