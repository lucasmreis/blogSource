---
title: Quick Introduction To CSP In Javascript
lead: Communicating Sequential Processes In Seven Small Examples
template: post.hbt
date: 2015-09-25
tags: javascript, csp, process, architecture, state
draft: true
---

*What is CSP?* In practice, it's a way of writing concurrent code. The language Go uses it natively, Clojure has core.async which achieves it by using macros, and now we can use it in Javascript because of generators, which were included in ES6.

*Why should I bother?* Because it's very powerful, efficient and simple. What more do you want? :)

*Ok, let's do it. How do I start using it?* We are going to use [js-csp](https://github.com/ubolonton/js-csp). We are going to need generators, which are only included in ES6. That means you'll be able to do it by using Node 4 or superior, or by transpiling your browser code with [babel](https://babeljs.io/) (or any other transpiling tool that supports generators).

Enough talking, let's go to the examples!



