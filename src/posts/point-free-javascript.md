---
title: Pointfree Javascript
lead: Modularity in the function level
template: post.hbt
date: 2015-03-20
tags: javascript, functional, pointfree, compose, modularity
---

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

So, I just described the functions code, but it's still not very clear what it *does*. A much clearer way would be saying: *it returns all the emails of the users with admin role*.

Let's rewrite the function in a functional style, using javascript's own `filter` and `map` functions:

```js
  var getAdminEmails = users =>
    users
      .filter(u => u.role === 'admin')
      .map(u => u.email);
```

Analyzing this function is easier: we get the users, separate only the admins, and then get the emails. The first strong point of this style is that *the code of the function is closer to the description of what the function does*. This makes it easier to understand and reason about code, and to look into a new piece of code and understanding quickly what is supposed to happen.

Filters and maps go through an array's elements, just like the for loop. The difference is that they have specific purposes: returning subsets and transforming elements, respectively. Anything can happen inside a for loop. That means that every time you bump into a for loop code, you have to investigate more to understand if you return a subset or not, if you transform any element, if you aggregate values, or any combination of those.

When you use filters and maps, you have a quicker understanding of the function, and deepen that understanding little by little. In `getAdminEmails`, since I have a filter and a map, I know I return an array. On a second look, I see that first I filter the users, than I transform them. I can now investigate *just the filter* to understand which elements are going to go through transformation. And then I can investigate what happens in the transformation itself.

## Composability

What I find very interesting in the functional version is that I could understand it piece by piece, in different layers. I'll try to make it even more clear now, and produce some reusable functions on the way!

Let's start by trying to be even closer to what the function does. We transform a filtered list, so let's start by composing these two pieces:

```js
var getAdminEmails = compose(
  getTheEmailsOf,
  onlyTheAdminRoleUsers);
```

`compose` is a function that take two functions as parameters:

```js
var compose = (f, g) => x => f(g(x));
```

Now, `getEmailsOf` is a function that transforms a list by returning the `email` property. "Transforming a list" is what map does. And getting a property from a object sounds like a very common task, so let's implement `prop` and `map` from a different angle:

```js
var prop = p => x => x[p];

var map = f => list =>
  list.map(f);

// which lead to:
var getTheEmailsOf = map(prop('email'));
```

`onlyTheAdminRoleUsers` is a filter. The test to decide which elements will be returned involves testing if a property is equal to some value.

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

That is what is called *point-free programming*, or *tacit programming*. What is most amazing about this version is that it is *entirely composed of other smaller, generic and reusable functions*! These functions not only will help you with your next functions, but they will help you understanding quicker *any* function. After you know what `prop` does, it's faster to understand `prop('something')` than `obj => obj.something`, and we didn't go into the "stress" of having to choose a name for the temporary `obj` variable! :)

Note: most of these smaller functions are generic and useful enough so that we could use them in almost every project. [Ramda](http://ramdajs.com/) is a library that has exactly that: a bunch of really small and generic functions.

## Another Example

I'll finish with another common situation:

```js
var calculateTotalPromotions = cart =>
  getPromotions(cart.products[0])
    .then(calculateTotal);
```

We can understand it quickly because of familiarity, but the code flow is all over. What it does is: *calculate the total of the promotions of the first product of the cart*. Look at the order of this last sentence, and compare the order of the code above with the following function:

```js
// composeP is a compose that accepts Promises
var calculateTotalPromotions = composeP(
  calculateTotal,
  getPromotions,
  head, // head returns first element
  prop('products'));
```

Much simpler! :)

## Conclusions

Pointfree programming is all about modularizing functions through composition. You use smaller more generic functions

Inside a `compose` or `composeP`, one function is called, then the other, and that's how it goes, no matter if the function has 17 lines or 3. It works the same way, and code complexity does not goes up.

We don't have to worry about temporary variables, which makes it easier to understand code and harder to introduce bugs. Also, it's easier to understand and test smaller parts of the code, which makes it more reliable.

