---
title: The Single Most Important Driver Of Software Quality
lead: A True Story
template: post.hbt
date: 2017-05-31
tags: quality, software, skin, opinion
---

And there I was, ready to press the button. Three hundred people looking at me, thinking "is this guy going to ruin my work?". I had no where to hide; and the button needed to be pushed.

My claim: **developers having skin in the game is the *main* driver of software quality**. If your life depends on the software you build, it will be of a much higher quality than if it didn't. Second best scenarios would be being near *people whose lives* depend on it. I cannot imagine anything other than skin in the game being a better factor to drive quality.

But let me start from the beginning.

I work at a large online retail company, with millions and millions of users. A modified version of the website is used by a telemarketing sector of the same company, the three hundred people that were not very comfortable with my presence.

The telemarketing people earn a share of what they sell. They don't use the website as a normal user, to buy something; they use it *as a selling tool*. If the checkout does not work, they don't sell, and they don't make money. No need to say that some of them think "I would kill the person who broke this thing!" when the site is down.

I wanted to refactor/rewrite a part of our checkout, in an attempt to raise code quality and achieve better performance. Upper management was a little unsure of the project, and then I said "I'm going to deploy it to production in the middle of the telemarketing people". That moment they realized I was serious about it, and they agreed to do it.

As soon as I got back to my work station, I felt something different. I know, we're very serious about our metrics and processes, and we take every action necessary to be sure the website will not have any problems for the millions of users. But just thinking that I would be near three hundred people that make a living out of it was a different feeling, and early on the whole team was taking measures to deal with it smoothly.

Not only we were super careful with our code, we also got very engaged with UX and UI, and with the infrastructure of the project. The team was since the beggining coming up with strategies to deploy the application and cause the least impact. We had a "panic" link for the telemarketer to go to the previous application. We even developed a new telemarketing-only feature to help them sell additional services and insurance, as an incentive not to press that panic link.

Our website is really large, with lots of different microservices and different clients interacting, and in this level of complexity, it's almost inevitable that problems happen in production, no matter how much testing you do, or how careful you are in your process. And, on the deploy day, in about ten minutes, we had a small problem affecting the selling of gift wraps.

Everybody was nice to us since the beginning, but I could feel the tension in the air on those ten minutes. And then, after rolling back and fixing the issue, I still could see that the telemarketers were not very confident. What other errors would affect the sales?

But by the end of the day, everything went well. We had anticipated almost every scenario, and we were ready to fix the problem that was raised. The application was running smoothly, no one was using the panic link anymore, success! By the end of a couple of weeks we learned that services and insurance selling raised 20% at telemarketing, and we raised overall conversion for the whole website in about 2%.

So, when I see that [Basecamp uses Basecamp](https://zapier.com/blog/how-basecamp-uses-basecamp3/), and [the VS Code team uses VS Code to build VS Code itself](https://www.youtube.com/watch?v=uLrnQtAq5Ec&t=4m10s), I understand why those products have really high quality. They have *skin in the game*.

*Final notes*: of course this is not a scientific claim :) It was a hypothesis raised from our own experience, and we continue to observe this property in different projects. The effects of skin in the game are usually very well described by some economists and philosophers, with a great prominence of [Nassim Taleb](https://www.amazon.com/Nassim-Nicholas-Taleb/e/B000APVZ7W). He's actually writing a book called *Skin In The Game*, and [a lot]() [of really]() [interesting chapters]() [are online]().