---
title: A more functional approach to Angular
lead: Keeping sanity while managing state
template: post.hbt
date: 2015-02-22
tags: javascript, angular, functional, state
---

We all know the story: a project starts with all the current best practices and an elegant architecture. Everything is beautiful - until it is not anymore. As a project grows, the complexity seems to grow in a higher rate, and it's becoming more and more difficult to answer the simple question *what is happening to my application right now?*, or the even more important *what was happening when that crazy error occurred?* In this post, I propose a solution to this problem.

One day I was googling ways to deal with that complexity, and came across the talk [Simple Made Easy](http://www.infoq.com/presentations/Simple-Made-Easy) by Rich Hickey and the paper [Out of the Tar Pit](https://github.com/papers-we-love/papers-we-love/tree/master/design/out-of-the-tar-pit.pdf), by Ben Moseley and Peter Marks. That material simply changed the way I think about programming now, and everytime I come back to them, I learn a little bit more.

Now I could see I most of that complexity was coming from the way I was storing and dealing with the *state* of my application. It was simply all over. I was getting information from the APIs and storing them in the services themselves. It wasn't clear who was reading that information, who was transforming it, and who was writing it. A lot of debugging was needed to understand what was happening at any point in time, and it was really difficult to write tests for everything.

I was decided to take a more *functional* approach: avoid mutation as much as I can, only changing variables in a few controlled places. I would go further and store *all the application state in a single place* (some React frameworks work that way, like [Om](https://github.com/omcljs/om) and [Morearty](https://github.com/moreartyjs/moreartyjs)).


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