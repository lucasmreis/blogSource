---
title: Learning ReasonML, part 1
lead: An Interesting Trade Off Between Reliability And Ease Of Adoption
template: post.hbt
date: 2016-04-22
tags: functional, types, reason
draft: true
---

* Talk about the quest for reliability / safety
* ClojureScript is great because immutability is the default, but it is still dynamic
* Elm is great because it's the safest you can get, but the trade off is small number of features and costly interaction with JS
* Fable is great because it is as pragmatic as ClojureScript, with strong typing from ML. But it feels like it's built for current F# / .Net users
* Reason seems to be in the same pragmetic / safety position as Fable, but built for current JS users. Let's try it!

## The Spec

I like to start learning a language with a very simple and well defined spec, usually a function. Trying to implement UI, or anything involving a lot of side effects is usually counter productive for me. And by writing a simple function, we already can learn a lot about the development workflow, the tooling and the ecosystem, which are very important and deserve special attention.

I'll implement the same algorithm I implemented in [Learning Elm, part 1](https://lucasmreis.github.io/blog/learning-elm-part-1/). Recapping:

```
"3S" -> "Three of Spades"
"10H" -> "Ten of Hearts"
"QC" -> "Queen of Clubs"
"AD" -> "Ace of Diamonds"
"3T" -> "-- unknown card --"
```

## The Strategy

When learning Elm, I immediately jumped to a "type driven" solution. Even though I think type driven development lead to more reliable / elegant code, I believe starting from a more JS-style approach is more compatible to the Reason philosophy.

## Setting Up

Let's start by installing Reason's CLI `bsb` and create a new project (as described [in the official website](https://reasonml.github.io/)):

# CHECK THIS COMMANDS MAYBE IT'S BETTER https://reasonml.github.io/guide/editor-tools/global-installation

```
$ npm install -g bs-platform
$ bsb -init my-first-app -theme basic-reason
```

I'm using VS Code with the Reason extension installed. It's a great dev environment, with auto complete, auto formatting, and other niceties. A note on auto formatting: we want to focus on actually solving a problem, and it's a good thing that problems like indentation are not getting in our way. That is something Reason has in common with Elm, and projects like Prettier are trying to do with javascript. I strongly recommend it!
