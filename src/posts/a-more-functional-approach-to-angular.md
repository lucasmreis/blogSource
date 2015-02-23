---
title: A more functional approach to Angular
lead: Keeping sanity while managing state
template: post.hbt
date: 2015-02-22
tags: javascript, angular, functional, state
---

Problem: changing values stored everywhere. The question: *what is happening to my application right now?*. Better question: *what was happening when that crazy error ocurred?*

Research: Out Of The Tar Pit, Simple Made Easy. The concept of *state*. Functional programming: avoid mutation, mutate only on a few, controlled places.

Solutions found: Om and Morearty. One global state object; application can listen to parts of it. View code is either direct or processed data from state. 

Working with Angular: implement a factory with the State. Other factories have mainly pure functions to process state data. Controller listen to state. View read from state/processed state. 

View with form: our solution was having temporary state to take advantage of two-way binding ("formState"). *Validate* functions are pure functions on state and formState. *Update* functions take the same parameters, and can change state. Called on ng-change or ng-blur.

*diagram*

**DOUBT:** Maybe there should be a better example than Todo. One with two small controllers - Name + tags - and a third controller just showing state. Use the ".run" with localStorage, that was a good one.

Talk about get() function, and Jeff's Debug idea. (Maybe another post?)

Conclusion: after a couple of months we could see the results:
* it's easy to reason about the application architecture.
* it's easier to debug application by tracking the state variable in the console.
* it's super, super easy to write tests.

```javascript
Random code on some places
```