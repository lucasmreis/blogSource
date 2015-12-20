---
title: ES6 Destructuring Improves Readability
lead: And Is Great At Documenting Functions
template: post.hbt
date: 2015-12-15
tags: javascript, es6, destructuring, react
---

Destructuring is one of the most powerful new features of javascript. It makes it easier to write more concise code, without compromising readability. This week I figured out that destructuring is also very good for documenting functions in javascript, and I want to share this thought with you.

For those not familiar with Destructuring, I suggest [Mozilla website](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) as a good starting point.

The situation is: you are reading code written by another developer (and I include here code that was written by yourself more than one month ago). Suddenly, there's this function call:

```js
const cart = getCart(cartId, 3);
```

It seems like it's a simple function that "gets" the cart with the id `cartId`. Awesome. But one detail creeps you out: what does the `3` means? It could literally be anything. There's no clue in the function call to what it means, and you'll have to open another file with the function declaration to see what that second parameter does.

One way to remedy this situation is accepting a *config object* as a parameter in the function:

```js
const cart = getCart({cartId: cartId, retries: 3});
```

And now we understand that our function gets a cart and retries three times if an error occurs.

But now let's take a look at the function declaration:

```js
function getCart(config) {
  // ...
}
```

When we look at that declaration, we have no clue to what parameters the function actually receives. We have to look inside the function code to see which properties of `config` are being used, which is not optimal. The best way to deal with this was declaring variables in the beginning of the function, which is very verbose:

```js
function getCart(config) {
  const cartId = config.cartId;
  const retries = config.retries;
  // ...
}
```

So we have two situations: using a usual list of parameters, which compromises the readability of function *calls*, and using a `config` object, which compromises the readability of function *declarations*.

You see where this is going, right? By using destructuring, we can use an object as a parameter, without these problems:

```js
// declaration
function getCart({cartId, retries}) {
  // ...
}

// call
const cart = getCart({cartId: cartId, retries: 3});
```

It may seem a minor issue, but it saves a lot of time in the long run! You look at the function declaration, you know what parameters it expects. You look at a function call, you understand what the values being passed mean.

A nice situation where destructuring becomes a very useful documentation tool is React. After version `v0.14`, stateless components were introduced. They are simple components, declared as functions. An example would be:

```js
const LoginForm = ({
  username,
  password,
  onForgetPassword,
  onSubmit}) =>
    //...
```

Smooth, isn't it? :)