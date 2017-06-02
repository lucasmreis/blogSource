---
title: The Single Most Important Driver Of Software Quality
lead: A True Story
template: post.hbt
date: 2017-05-31
tags: quality, software, skin, opinion
---

So, there I was, ready to press the button. All the while three hundred people were looking at me, thinking "is this guy going to make my work more difficult?". I had nowhere to hide, and the button needed to be pushed.

My claim: **developers having skin in the game is the *main* driver of software quality**. If your life depends on the software you are building, you can bet that the software will be of a much higher quality than any software that your life does not depend on.  That being said, there is also the second best scenario of being near *people whose lives* depend on the quality of your code. I cannot imagine any better factor than skin in the game to drive quality.

But let me start from the beginning.

I work at a large online retail company, with millions and millions of  users. In addition to the millions of users using from home, a modified version of the website is leveraged by a telemarketing sector within my company.  As you may have guessed, these are the three hundred people who were not very comfortable with my presence.

I can't say that I blame them for being uncomfortable, because they do earn a share of what they sell for the company.  In other words, they have a lot of skin in the game. They don't use the website as a normal user, to buy something; they use it *as a selling tool*. If the checkout doesn't work, they don't sell, and they don't make money. Needless to say some of them are thinking, "I'd kill the person who broke this thing!" when the site goes down.

When I pitched my idea to refactor/rewrite a part of our checkout to upper management, they were a little unsure of the project.  First, I tried to sell them on it with a promise of an increase in code quality and better performance, and when they still seemed hesitant, I said, "I'll deploy the changes to production in the middle of the telemarketers". At that moment they realized I was serious about idea, and they agreed to sign off on the project.

As soon as I got back to my work station, I felt something different. As always we were very serious about our metrics and processes, and we took every action necessary to be sure the website would not have any problems for our millions of users. But just the thought of deploying the changes to production while at the telemarketing headquarters, next to people who depend on the site to make a living, gave us a different feeling. From early on, everyone on the team worked hard to avert potential disasters down the road.

Not only were we super careful with our code, we also got very engaged with UX, UI, and with the infrastructure of the project. From the very beginning, our team came up with strategies to deploy the application while causing the least impact possible. We created a "panic" link for the telemarketers to go to the previous application. We even developed a new telemarketing-only feature to help them sell additional services and insurance, as an incentive not to press that panic link.

Our website is really large, with lots of different micro-services and different clients interacting, and at this level of complexity, it's almost inevitable that problems will occur in production, no matter how much testing you do, or how careful you are in your process.  With that in mind, it wasn't a huge surprise that on deploy day, in the first ten minutes, we had a small problem affecting the sale of gift wrap.

Everybody had been cordial to us from the beginning, but I could feel the tension in the air during those ten minutes. And then, after rolling back and fixing the issue, I could still see that the telemarketers were not very confident. What other errors would affect the sales?

But by the end of the day, everything had gone well. We had anticipated almost every scenario, and we were ready to fix all the problems that were raised. The application started to run smoothly, and no one was using the panic link anymore, success! By the end of a couple of weeks, we learned that services and insurance sales had risen by 20% for telemarketing, and we raised the overall conversion of the website by about 2%.

So, when I see that [Basecamp uses Basecamp](https://zapier.com/blog/how-basecamp-uses-basecamp3/), and [the VS Code team uses VS Code to build VS Code itself](https://www.youtube.com/watch?v=uLrnQtAq5Ec&t=4m10s), I understand why those products have really high quality. They have *skin in the game*.

*Final notes*: of course this is not a scientific claim :) It is a hypothesis raised from our own experience, and we continue to observe this property in different projects. The effects of skin in the game are usually very well described by some economists and philosophers, and especially by [Nassim Taleb](https://www.amazon.com/Nassim-Nicholas-Taleb/e/B000APVZ7W). He's actually writing a book called *Skin In The Game*, and [a lot](https://medium.com/incerto/why-each-one-should-eat-his-own-turtles-equality-in-uncertainty-e2b2ee3bcddf) [of really](https://medium.com/incerto/the-skin-of-others-in-your-game-3f51d8ccc3fb) [interesting chapters](https://medium.com/incerto/no-worship-without-skin-in-the-game-70b4aa341092) [are online](https://medium.com/incerto/an-expert-called-lindy-fdb30f146eaf).