---
title: Solve all bugs or implement new features?
lead: A business argument in favor of quality versus scope
template: post.hbt
date: 2015-05-27
tags: quality, scope, agile, business, estimating
---

Most projects have moments in which they have X new features to implement and Y bugs to solve. A choice has to be made whether to focus more time on solving those bugs and making sure they don't appear again - let's call it *quality* - or implementing new features - *scope*.

A lot of arguments have been made favoring quality. One of my favorites is the one [Joel Spolsky makes in this already classic text](http://www.joelonsoftware.com/articles/fog0000000043.html).

In this post I'll make the argument that, *even from business and financial* points of view, *focus on raising quality should always comes before focus on implementing new features*.

## The concepts

First of all, let me explain better what I mean when I talk about quality and scope. Let's say there's a demand for X new features to be implemented in a given period. We know there are currently Y open bugs. One could say:

*"We are going to implement all X features and solve as many bugs as we can."*

Or you could say:

*"We are going to solve all Y bugs in their root causes, and we'll implement as many features as we can."*

See the difference? It's a matter of letting explicit the priorities. In the first case we'll make sure everything we implement is well tested and well designed. But not every bug will be considered. Most probably there's gonna be a spreadsheet/board listing them, with a "priority" property, and business will choose which bugs should be solved in each sprint, based on a "financial" analysis (which I'll talk about in the next section).

In the second case, the team will focus all its energy on at least *investigating* every bug that appears. Whenever there's a decision *not* to solve a bug right away, it's because the developers diagnosed that the bug is not a manifestation of something that could stop the business, or incur a big loss.

Those are what I'm calling in this post "focus on scope" and "focus on quality", respectively.

## Losses due to lack of quality and scope

One of the main criteria to choose focusing on solving a bug or implementing a new feature is analyzing the financial loss that the business will have by *not* having that done.

It's impossible to know for certain the loss one would have in the future, so we'll need to estimate it. And to do the estimation we'll need to deal with uncertainty. My point is that the uncertainty of the loss due to not solving a bug is *qualitatively different* from the uncertainty of the loss due to not implementing a new feature.

To explain this difference, I'll briefly present two concepts introduced by author Nassim Taleb in his book [Black Swan](http://www.amazon.com/Black-Swan-Improbable-Robustness-Fragility/dp/081297381X/). I suggest this book to everyone wanting to have their mind turned inside out. :)

## Mediocristan and Extremistan

Taleb argues that uncertainties can "come from two places". The first place is Mediocristan: the observations do not vary too much, or vary in a somewhat predictable way. An example of an uncertainty that belongs Mediocristan is "the average height of a random group of a hundred people in a room". After you measure five or six groups, you would have a very nice idea of what the other averages will be. Even if one of the people is the tallest man on Earth!

Then there's Extremistan, a place where one observation can be very, very different from the others, making predictions very difficult, sometimes even impossible. An example is "the average net worth of a random group of a hundred people in a room". Every group will have a very different average. Sometimes we could have a run of twenty, fifty groups with a very similar average, and then Bill Gates is in a group and BAM.

So, here's my first claim:

*Losses due to not implementing a new feature belong to Mediocristan.*

A new feature is something that in the past did not exist in your business (duh). That means that not having a new feature, in the absolute majority of cases, will not cause a big loss. Or at least will not make the loss you already have bigger.

Let's consider for example an e-commerce that wants their users to be able to pay with a new payment option, let's say bitcoins. It could be difficult to estimate how much the company would *make*, but it's relatively easy to see that there's not going to happen a big loss if the bitcoin feature is not implemented. Current users of current payment options are still buying.

And that leads to my second claim:

*Losses due to not solving a bug belong to Extremistan.*

Every bug, no matter how small, can be just the tip of the iceberg of a much deeper problem. That's why it's so difficult to estimate the effort needed to solve a bug. And deep problems can simply *stop business*.

A bug in the error feedback of a credit card form can be the reason behind the convertion drop. And that bug can be just a manifestation of a much deeper problem with the server side validation, which in turn could start to appear in other forms.

Some errors can be solved quickly by "patching" them. But that means that it can happen again if someone touches the code, or use those same modules elsewhere. A lot of times a more intricated refactoring has to be done, carefully, fully backed by unit, integration and end to end tests. That's how we can diminish the uncertainty that the bug is coming back to creep you.

## But is the whole team always going to be working on bugs?

What about all the new features that we *need* to implement??? When will that happen?

By solving every bug in its root causes, we diminish the chances of new bugs appearing. That means that in the not-so-long-term, almost everybody in the team will be focusing in implementing new features. The project gains traction, and will deliver a *larger scope* with a *higher quality*. And that's what evryone wants, isn't it?

I'm not saying that all bugs have to be solved right away. I'm saying that all bugs should be *investigated*, and the developers should diagnose if the root cause could give rise to other new, more dangerous problems.

## A script for dealing with a bug

Everytime a new bug is reported, and come to the developers to solve, ideally we should follow these steps:

1. Investigate the root cause of the problem. Ideally this should be done in pairs, with at least one of the developers having already worked on that part of the code. That would make things quicker.

2. Choose whether or not to solve the bug right away. This question should have "yes" as an answer most of the times.

3. Write tests to reproduce the bug. Unit tests preferably, but don't be afraid to write new integration and end to end tests too. This way we try to guarantee that if anything brings that bug back, it will be caught by the tests before going to production.

4. Solve the root cause as well as you can.

This approach is now new. Actually it's one of the main parts of Toyota "Lean Manufacturing" revolution, called [Jidoka](https://en.wikipedia.org/wiki/Autonomation).

## Summing up

Losses due to not implementing a new feature is much more predictable than losses due to bugs not being solved. Every bug is a potential business-stopper. And that's why we should always give quality a higher priority than scope: to keep our business alive.