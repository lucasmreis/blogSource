---
title: Solve All Bugs Or Implement New Features?
lead: A business argument in favor of quality versus scope
template: post.hbt
date: 2015-05-27
tags: quality, scope, agile, business, estimating
---

Most projects have moments in which they have new features to implement and, at the same time, bugs to solve. A choice has to be made on whether to focus more time on solving those bugs and making sure they don't appear again - let's call this option *quality* - or implementing new features - *scope*.

A lot of arguments have been made in favor of quality. One of my favorites is an argument presented by [Joel Spolsky in this already classic text](http://www.joelonsoftware.com/articles/fog0000000043.html).

In this post I'll make the argument that, *even from business and financial* points of view, *focus on raising quality should always come a before focus on implementing new features*.

## The concepts

First of all, let me explain better what I mean when I talk about quality and scope. Let's say there's a demand for X new features to be implemented in a given period and we know there are currently Y open bugs. One could say:

*"We are going to implement all X features and solve as many bugs as we can."*

Or you could say:

*"We are going to solve all Y bugs in their root causes, and we'll implement as many features as we can."*

See the difference? It's a matter of explicitly stating what your priorities are. In the first example, we'll make sure everything we implement is well tested and well designed, but some bugs will not be considered due to time constraints.  In most cases, bugs will be listed in a spreadsheet or on a board with a "priority" property, and the business will choose which bugs should be solved  per sprint, based on a "financial" analysis (which I'll talk about in the next section).

In the second case, a team will focus all of its energy on, at least, investigating every bug that appears. Whenever there's a decision not to solve a bug right away, it's because the developers diagnosed that the bug is not a manifestation of something that would stop the business, or incur a big loss.

Those are what I'm calling in this post "a focus on scope" and "a focus on quality", respectively.

## Losses due to lack of quality and scope

One of the main criteria needed in order to choose between focusing on solving a bug or implementing a new feature is an analysis of the financial loss that the business will incur by *not* doing these things.

It's impossible to know for sure the loss a business could have in the future, so we'll need to estimate it. And to do the estimation we'll need to deal with uncertainty. My point is that the uncertainty of a loss due to not solving a bug is *qualitatively different* from the uncertainty of a loss due to not implementing a new feature.

To explain this difference, I'll briefly present two concepts introduced by author Nassim Taleb in his book [Black Swan](http://www.amazon.com/Black-Swan-Improbable-Robustness-Fragility/dp/081297381X/). I suggest this book to anyone interested in having their mind turned inside out. :)

## Mediocristan and Extremistan

Taleb argues that uncertainties can "come from two places". The first place is Mediocristan: observations do not vary very much, or vary in a somewhat predictable way. An example of an Mediocristan uncertainty is "the average height of a random group of a hundred people". After you measure five or six groups, you would have a very nice idea of what other averages will be. Even if one person in the group is the tallest man on Earth!

Then there is Extremistan, a place where one observation can be very, very different from the others, which makes predictions very difficult, sometimes even impossible. An example is "the average net worth of a random group of a hundred people". Every group will have a very different average.  We could have a run of thirty, or even fifty groups with a very similar average, and then suddenly Bill Gates is in a group and "BAM".

So, here's my first claim:

*Losses due to not implementing a new feature belong in Mediocristan.*

A new feature is something that in the past did not exist in your business (duh). That means that not having a new feature, in the majority of cases, will not cause a big loss. Or at least it will not make the losses you already have any bigger.

Let's consider for example an e-commerce business that wants their users to be able to pay with a new payment option, let's say Bitcoins. It could be difficult to estimate how much the company would *make*, but it's relatively easy to see that there won't be a big loss if the Bitcoin feature is not implemented. Current users are buying with current payment options and will continue doing so even without a Bitcoin option.

And that leads to my second claim:

*Losses due to not solving a bug belong in Extremistan.*

Every bug, no matter how small, can be the tip of the iceberg to a much deeper problem. That's why it's so difficult to estimate the effort needed to solve a bug. And deep problems can *stop a business in it's tracks*.

A bug in the error feedback of a credit card form could explain the drop in conversion rates. Also, that bug could be a manifestation of a much deeper problem with server side validation, which, in turn, could start to appear in other forms.

Some errors can be solved quickly by "patching" them. But that means that errors could reoccur if someone touches the code, or uses those same modules elsewhere. A lot of times, a more complex refactoring has to be done carefully, and must be fully backed by unit, integration and end to end tests. With these tests, we can diminish the chance of a bug creeping back up on you.

## But is the whole team always going to be working on bugs?

What about all the new features that we need to implement??? When will that happen?

By solving every bug at its root cause, we diminish the chances of new bugs appearing. That means that in the not-so-long-term, almost everybody in the team will be focusing on implementing new features. The project gains traction, and will deliver a *larger scope* with a *higher quality*. And that's what everyone wants, isn't it?

I'm not saying that all bugs have to be solved right away. I'm saying that all bugs should be *investigated*, and the developers should diagnose whether or not the root cause could give rise to other new, more dangerous problems.

## A script for dealing with a bug

Every time a new bug is reported, and comes to the developers to be solved, ideally we should follow the following steps:

1. Investigate the root cause of the problem. Ideally this should be done in pairs, with at least one of the developers having already worked on that part of the code. That would make things quicker.

2. Choose whether or not to solve the bug right away. The answer to this question should be "yes" in most cases.

3. Write tests to reproduce the bug. Unit tests preferably, but don't be afraid to write new integration and/or end to end tests, if needed. By creating new tests, we try to guarantee that if anything brings the bug back, it will be caught by tests before going to production.

4. Solve the root cause as well as you can.

This approach is not new. It's actually one of the main components of Toyota's "Lean Manufacturing" revolution, called [Jidoka](https://en.wikipedia.org/wiki/Autonomation).

## Summing up

Losses due to not implementing a new feature are much more predictable than losses due to bugs not being solved. Every bug is a potential business-stopper. And that's why we should always give quality a higher priority than scope: to keep our businesses alive.
