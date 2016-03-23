---
title: "Should We Leave Javascript In Front End Programming?"
lead: "Or: Javascript Is Not One Language Anymore"
template: post.hbt
date: 2016-03-22
tags: javascript, languages, opinion
draft: false
---

I "inherited" a javascript project at work. It was "just a medium-sized React app", so we all thought it was going to be easy to get it up and running, and start getting productive with it - even though the application's only author was not there to help.

But no, it was not easy. A couple of hours until the build works, a couple of days until I can make any production-ready change. The difficulties I encountered in the process made me think a little bit about technology choice in programming.

The main question that I *thought* I knew the answer is: *should we implement the next front end project in javascript?*

## The Previous Answer

**Yes.** I believed a hundred percent that, even though there were some really interesting language choices in the radar, we should choose javascript. Simply because *that's what every developer in the market knows*, and *there's already a lot of libraries / frameworks that I can choose from*. Summing up, the main reason is *familiarity*, both with the syntax and the tools.

And that's what seems to have changed in web front end programming.

## Javascript Is Not One Language Anymore

First of all, let me explain what I mean by "Javascript is not one language anymore". I work at a really big front end project that still uses ES5 for most of the code, and Angular 1.x as the framework. It uses Ramda as the main util library. A common piece of code would be like that:

```js
var onSubmit = composeP(
  catchP(EventService.dispatch('cart:load-error')),
  EventService.dispatch('cart:load'),
  BasketStateService.change('cart'),
  prop('data'),
  $http,
  CartApiService.requestObj);
```

That's a good ES5 / Ramda / Angular piece of code.

But that piece of code written today could look like:

```js
const onSubmit = async id => {
  const cartReq = CartApiService.requestObj(id)
  try {
    const { data } = await axios(cartReq)
    BasketStateService.change('cart', data)
    EventService.dispatch('cart:load', data)
  } catch (err) {
    EventService.dispatch('cart:load-error', err)
  }
}
```

Which is also a good ES7 piece of code. And it's completely different, in a lot of aspects.

Some examples of differences in Javascript code: ES5 callbacks are very different from ES6 promises that are very different from ES7 async functions. "For" loops are very different from Lodash code, that is different from Ramda or Trine code too. Mutable objects, ImmutableJS, ES7 object spread operator... The list goes on.

So, no two projects I've ever encountered were like any other in those terms. It's always a combination of them, and this impose a cost on learning how to 

## New Technologies Are Better

<< Choose ES7 but not Elm? >>

One more time: should we implement the next front end project in javascript?

## Opportunity Cost

<< Not a yes/no, but a way of thinking: opportunity cost and the right tool for the job >>

<< ES7 is awesome, with a smaller learning curve, so maybe stick to it because of the tools >>

<< ClojureScript and Elm are better, and the tools are getting better everyday >>

<< Not so sure: small changes can lead to local maxima, but can completely miss global maximas >>

## The New Answer

**A not very sure yes.** And I think with little time it will be a "no".

<< React Native, WebAssembly, Elixir + Elm, Clojure + ClojureScript >>
