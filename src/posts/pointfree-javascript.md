---
title: Pointfree Javascript
lead: Modularity at the function level
template: post.hbt
date: 2015-03-20
tags: javascript, functional, pointfree, compose, modularity
---

Javascript is really a very flexible language. It has functional and object oriented characteristics, and it allows for programming in a lot of different styles. In this post I will present what is called *pointfree* style programming, and I will go through some common scenarios to demonstrate its benefits.

## One Step Back

First, let me show the standard imperative way to extract information from an array - the for loop:

```js
// imperative style
var getAdminEmails = function(users) {
  var emails = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'admin') {
      emails.push(users[i].email);
    }
  }
  return emails;
}
```

What does this function do? Let's analyze it. I have an empty array. Then I go through every user. If a user's role is equal to `'admin'`, we add it's email to the array. Then we return that array.

I've just described the function's code, but it's still not very clear what it *does*. A much clearer way to say it would be: *it returns all the emails of the users with admin role*.

Let's rewrite the function in a functional style, using javascript's own `filter` and `map` functions (I'm using ES6 syntax here - gotta love those arrow functions!):

```js
  var getAdminEmails = users =>
    users
      .filter(u => u.role === 'admin')
      .map(u => u.email);
```

Analyzing this function is easier: we get the users, separate only the admins, and then get the emails. The first strong point of this style is that *the code of the function is closer to the description of what the function does*. This makes it easier to understand and reason about it, and to look into a new piece of code and understanding quickly what is supposed to happen.

Filters and maps go through an array's elements, just like the for loop, but they have specific purposes: returning subsets and transforming elements, respectively. In contrast, anything can happen inside a for loop. That means that every time you bump into a for loop code, you have to investigate more to understand if a subset will be returned or not, if an element will be transformed, if values will be aggregated, or any combination of those outcomes.

When you use filters and maps, you have a quicker understanding of the function, and you can deepen that understanding little by little as you need to. I know `getAdminEmails` returns an array, since it has a filter and a map. On a second look, one sees that it first filters the users, then transforms them. One can now investigate *just the filter* to understand which elements are going to be transformed. And then one can investigate what happens during the transformation itself.

## Composability

What I find very interesting in the functional version is that I could understand it piece by piece, in different layers. I'll try to make it even more clear now, and produce some reusable functions along the way!

Let's start by trying to write the code as close as possible to what the function does. We want to transform a filtered list, so let's start by composing those two pieces:

```js
var getAdminEmails = compose(
  getTheEmailsOf,
  onlyTheAdminRoleUsers);
```

`compose` is a function that take two functions as parameters, and run one after the other:

```js
var compose = (f, g) => x => f(g(x));
```

Now let's go to the two functions that are going to be composed. `getEmailsOf` is a function that transforms a list by returning the `email` property. "Transforming a list" is what map does. And getting a property from an object sounds like a very common task, so let's implement `map` from a different angle and `prop`:

```js
var prop = p => x => x[p];

var map = f => list =>
  list.map(f);

// which lead to:
var getTheEmailsOf = map(prop('email'));
```

`onlyTheAdminRoleUsers` is a filter. The test to decide which elements will be returned involves testing if a property is equal to some value:

```js
var propEq = v => p => obj =>
  prop(p)(obj) === v;

var filter = f => list =>
  list.filter(f);

var onlyTheAdminRoleUsers =
  filter(propEq('admin')('role'));
```

And the function's final version:

```js
var getAdminEmails = compose(
  map(
    prop('email')),
  filter(
    propEq('admin')('role')));
```

That is what is called *point-free programming*, or *tacit programming*. What is most amazing about this version is that it is *entirely composed of other smaller, generic and reusable functions*! These functions will not only will help you with your next functions, but they will help you understanding quicker *any* function. After you know what `prop` does, it becomes faster to understand `prop('something')` than `obj => obj.something`, and we don't need to go into the "stress" of having to choose a name for the temporary `obj` variable! :)

Note: most of these smaller functions are generic and useful enough so that we could use them in almost every project. [Ramda](http://ramdajs.com/) is a library that has exactly that: a bunch of really small and generic functions.

## Another Example

I'll finish with another common situation:

```js
var calculateTotalPromotions = cart =>
  getPromotions(cart.products[0])
    .then(calculateTotal);
```

We can understand it quickly because of familiarity, but the code flow is all over the place. Here's what it does: *it calculates the total of the promotions of the first product of the cart*. Look at the order of this last sentence, and compare the order of the code above with the following function:

```js
// composeP is a compose that accepts Promises
var calculateTotalPromotions = composeP(
  calculateTotal,
  getPromotions,
  head, // head returns first element
  prop('products'));
```

Read the code, understand what is going to happen. Much simpler! :)

## Conclusions

Pointfree programming is all about modularizing functions through composition. You use smaller, generic, well defined and well tested functions to build the functions you need. Inside a `compose` or `composeP`, one function is called, then the other, and that's how it goes, no matter if the function has 17 lines or 3. It works the same way, and *code complexity does not increase*.

We also don't have to worry about temporary variables, which makes it easier to understand code and harder to introduce bugs. Also, it's easier to understand and test smaller parts of the code, which makes it more reliable.

Of course it's not a silver bullet, and a lot of times I end up with a function that is not fully pointfree. I find its main weakness occurs when the function has more than one parameter; very often it leads to having some non pointfree code. But, that said, my personal experience is that the pointfree part of the code is much more robust and errors are identified earlier in the development phase. Bugs are almost never found in the pointfree code! :)

## Further Reading

The first place I heard about this programming style was in Frontend Masters [Hardcore Functional Javascript](https://frontendmasters.com/courses/functional-javascript/). It's definitely worth the price.

[jsanchesleao](https://jsleao.wordpress.com/) also wrote an interesting post about [why you should be using something like ramda in your code](https://jsleao.wordpress.com/2015/02/22/curry-and-compose-why-you-should-be-using-something-like-ramda-in-your-code/).



