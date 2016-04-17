---
title: "Should We Leave Javascript In Front End Programming?"
lead: "Also: Javascript Is Not One Language Anymore"
template: post.hbt
date: 2016-03-22
tags: Javascript, languages, opinion
draft: false
---

I recently "inherited" a Javascript project at work. It was only "a medium-sized React app", so we all thought it would be easy to get it up and running, and for us to start being productive - even though the application's only author was not there to help.

But unfortunately, it was not easy.  It took a couple of hours for the build to work, and a couple of days until I could make any production-ready changes. The difficulties I encountered in this process made me think about the technology choices we have to make in programming.

For instance, I always thought I knew the answer to this question: *Should we implement the next front end project in Javascript?*

## My Original Answer

**Yes.** I believed a hundred percent that, even though there were some really interesting language choices on the radar, we should choose Javascript. Simply because *that's what every developer in the market knows*, and *there's already a lot of libraries / frameworks that I can choose from*. Summing up, the main reason is *familiarity*, both with the syntax and the tools.

And that's what seems to have changed in front end web programming.

## Javascript Is Not One Language Anymore

First of all, let me explain what I mean by "Javascript is not one language anymore". I work on a really big front end project that still uses ES5 for most of the code, Angular 1.x as the framework, and Ramda as the main util library. Here is an example of a common piece of code:

```js
var onPress = pCompose(
  pCatch(MetricService.logEvent('payment:error')),
  MetricService.logEvent('payment:success'),
  StateService.change('payment'),
  prop('data'),
  $http,
  PaymentApiService.requestObj,
  MetricService.logEvent('payment:submit'));
```

This is a good ES5 / Ramda / Angular piece of code. (`pCompose` and `pCatch` are not from Ramda library, but they are pretty self explanatory :) ).

That piece of code written today could look like:

```js
const onPress = async id => {
  MetricService.logEvent('payment:submit', id)
  const cartReq = PaymentApiService.requestObj(id)
  try {
    const { data } = await axios(cartReq)
    StateService.change('payment', data)
    MetricService.logEvent('payment:success', data)
  } catch (err) {
    MetricService.logEvent('payment:error', err)
  }
}
```

Which is also a perfectly good ES7 piece of code. And it's completely different, in a lot of aspects.

Some examples of differences in Javascript code: ES5 callbacks are very different from ES6 promises that are very different from ES7 async functions. "For" loops are very different from Lodash code, that is different from Ramda or Trine code too. Mutable objects, ImmutableJS, ES7 object spread operator... The list goes on.

So, no two projects I've ever encountered were alike in those terms. They are always some chosen combination of practices and technologies, usually with very different styles mixed in because of external dependencies.

We can conclude that Javascript projects tend to be fundamentally different from each other, and tend to be messy as they grow.

## New Technologies Are Better

ES6 and ES7 are bringing some really good features to the language. But to use them in a production environment, we will have to rely on "transpiling" tools like Babel. This is bringing *Javascript development* itself closer to *other front end languages development*. And there are [a lot of those](https://github.com/jashkenas/coffeescript/wiki/list-of-languages-that-compile-to-js).

The thing is, these other languages do a lot of things better than Javascript. For example, TypeScript adds a thin layer of types that can save a lot of headaches when your code base gets larger. ClojureScript has some very simple and performant wrappers around React, that work well with channels and goroutines for async work. Elm's cleverly designed compiler almost guarantees no runtime error will happen.  

With this information in mind, we can ask *the question* one more time: should we implement the next front end project in Javascript?

## Opportunity Cost

The way this question should *always* be answered is with an opportunity cost analysis. In our case, it could be divided in three steps:

**1. Which problems in the code base would I like to solve?**

We need to understand our application's needs. Does it deal with a lot of async work? Is it heavy on user interaction? Does it need to run on very different platforms?

**2. Are there tools that will help me with those problems better than Javascript?**

The next step is trying to find solutions to these problems, and tools that implement those solutions. Powerful type systems, flexible async patterns, performant rendering, these are all important solutions that should be considered. Make a list of languages / tools that could help each problem.

**3. What are the costs of using these tools in relation to using the most up-to-date Javascript?**

What is the learning curve? How active is the community? Does it have a big ecosystem? How about native Javascript interop?

The answers to these questions define how costly the adoption of technology will be. An example: although ClojureScript has a decent sized community and ecosystem, these are nothing compared to Javascript, so there's an opportunity cost in choosing this tool.

And that's where the analysis enters: we have to weigh the benefits, and see if they outweigh the costs in relation to using Javascript, always basing your analysis on the most up-to-date Javascript version, which means you'll have to have a "transpiling" build phase, and learn some new concepts anyway.

Sometimes we would prefer small changes - like starting to use TypeScript. Changing from Babel to TypeScript compiler is a small cost, and that can bring a project to a higher level.

Sometimes small changes can only bring us so far, and a bigger learning curve cost of, let's say, refactoring to Elm, can lead to so much improvement to the final code that the time invested is worth it.

With this in mind, is it still the case that we should always use Javascript for a front end web project?

## My New Answer

**Probably yes.** And I think with a little time the answer will shift to a more certain "no".  :)

Today (even though this is changing) Javascript is still the "simple way to start doing something" tool. We all have browsers that can understand Javascript, and they have awesome debugging tools. Adding a build tool and using Babel is still simpler than most front end language development workflows.

An important observation: if we want to develop for mobile, React Native is the best "non-native" choice. So it makes sense that, if we want to reuse code or even knowledge in mobile projects, Javascript is the chosen tool.

But this is changing fast. I really believe that in about a year or two, Javascript's only strength will be the ecosystem. Tools like [figwheel](https://github.com/bhauman/lein-figwheel) for ClojureScript, and [elm-reactor](https://github.com/elm-lang/elm-reactor) for Elm are already considered superior to native Javascript dev tools.

Having worked with Clojure before, I've already felt the benefits of using a superior language to solve a problem. I plan to start doing small projects in different languages this year, and write about them on this blog. I would really like to here about other developers experiences with compile-to-js languages, so feel free to post it in the comments!
