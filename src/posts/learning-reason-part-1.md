---
title: Learning ReasonML, part 1
lead: An Interesting Trade Off Between Reliability And Ease Of Adoption
template: post.hbt
date: 2017-12-31
tags: functional, types, reason, reasonml
draft: true
---

Throughout my professional life I've worked in a lot of large applications that were in production for years. There was one thing in common with all of them: a lot of the code was overly complex, and it was really difficult to both fix bugs and add new features.

While searching solutions to these problems, I found out that different programming languages patterns and practices were amazing sources of inspiration. Learning Clojure helped me understand the benefits of immutability. Learning Elm helped me understand the benefits of strong typing. All of that knowledge helped me be a better developer in a lot of ways, and made my javascript code better. Not only that, a lot of the javascript ecossystem itself is [based on other languages patterns and practices](https://redux.js.org/docs/introduction/PriorArt.html).

And that's what brings me to ReasonML. The path to ReasonML was paved this way:

1. ClojureScript: immutability / pragmatic philosophy / simplicity as a core value. But I felt that some problems related to reliability and safety were still present, and I thought that strong typing could help.

2. Elm: yes, strong typing really helps, and working with such a powerful compiler feels great. But I missed the pragmatic nature of Clojure.

3. F# / Fable: feels like a sweet spot, a pragmatic Elm for the front end, and also a complete ecossystem with a mature runtime for everything else. But I felt that Fable is a tool made for people with F# / .Net background, not a javascript background.

And that's how I got to ReasonML. It's a new syntax for Ocaml, which F# is heavily based on. They are from a family of languages called "ML", which provide this nice developing experience due to the type system and compiler help. Also, the language creators are heavily targeting javascript developers, so they are working really hard to make the language easy to adopt on current javascript teams.

_Note:_ I'm a curious person, and an avid learner. I'm always looking for a new way to look at problems I face in my day to day life, and it does not mean at all that I did not find those listed languages useful! Clojure is great, Elm is great, F# is great, and - why not - javascript is great! :)

I like to start learning a language with a very simple and well defined spec, usually a function. Trying to implement a UI, or anything involving a lot of side effects is usually counter productive for me. And by writing a simple function, we already can learn a lot about the development workflow, the tooling, and the ecosystem, which are very important and deserve special attention.

## The Spec

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

Let's start by installing ReasonML's CLI `bsb` and create a new project (as described [in the official website](https://reasonml.github.io/)):

# CHECK THIS COMMANDS MAYBE IT'S BETTER https://reasonml.github.io/guide/editor-tools/global-installation

```
$ npm install -g bs-platform
$ bsb -init my-first-app -theme basic-reason
```

I'm using VS Code with the ReasonML extension installed. It's a great dev environment, with auto complete, auto formatting, and other niceties. A note on auto formatting: we want to focus on actually solving a problem, and it's a good thing that problems like indentation are not getting in our way. That is something ReasonML has in common with Elm, and projects like Prettier are trying to do with javascript. I strongly recommend it!

In a real world application that performance is a key requirement, we always need to be aware of bundle size, and be careful with the amount and complexity of the code generated. So I'm always keeping an eye in the compilation result: if we are writing a `demo.re` file, Bucklescript will generate a `demo.bs.js` file in the same folder. Also, for small functions, I recommend copy and pasting to the [Try Reason](https://reasonml.github.io/try/) website, and see both the generated JS and equivalent Ocaml code in real time!

**A tip**: when googling for help, it's usually the case that we find some Ocaml code that could help us. Use the Try ReasonML to convert it to ReasonML syntax!

## First Approach

Let's start by editing the `demo.re` and keep `npm start` running in the terminal:

```js
/* it still does not do anything! */
let parseAndRenderCard = cardStr => cardStr;
```

If we open the generated js file:

```js
// Generated by BUCKLESCRIPT VERSION 2.1.0, PLEASE EDIT WITH CARE
"use strict";

function parseAndRenderCard(cardStr) {
  return cardStr;
}

exports.parseAndRenderCard = parseAndRenderCard;
/* No side effect */
```

It is treating the file as a module! And every variable and function we define in the file will be exported. If we change the value of `package-specs.module` in the `bs-config.json` file from `commonjs` to `es6`, we'll have:

```js
// Generated by BUCKLESCRIPT VERSION 2.1.0, PLEASE EDIT WITH CARE
"use strict";

function parseAndRenderCard(cardStr) {
  return cardStr;
}

export { parseAndRenderCard };
/* No side effect */
```

Which is great to integrate your generated files into a webpack bundled project.

Have you noticed the "No side effect" comment? Bucklescript knows if your code is pure or not! I love this feature, and helps the practice of trying to have as much as your code pure as possible. If we add a log `Js.log(parseAndRenderCard("3C"));`, we can see that the comment changes:

```js
// Generated by BUCKLESCRIPT VERSION 2.1.0, PLEASE EDIT WITH CARE
"use strict";

function parseAndRenderCard(cardStr) {
  return cardStr;
}

console.log("3C");

export { parseAndRenderCard };
/*  Not a pure module */
```

But now that the side effect was added, we can see an unexpected (at least for me!) behavior: the compiler understood that `parseAndRenderCard` is the identity function, and generated `console.log("3C");`, and not `console.log(parseAndRenderCard("3C"));`! Even with such a simple piece of code we can already see some cool optimizations.

But, you may ask, why does it still generates the function, if it is not being used? It's only because it's being exported. We can make the function not being exported if we put it in a block inside the module, like this:

```js
{
  let parseAndRenderCard = cardStr => cardStr;
  Js.log(parseAndRenderCard("3C"));
}
```

It will generate:

```js
// Generated by BUCKLESCRIPT VERSION 2.1.0, PLEASE EDIT WITH CARE
"use strict";

console.log("3C");

export {};
/*  Not a pure module */
```

Which is amazing: less code to parse, quicker page load :)

I want to talk about one more cool feature also present in Elm and F# before going to our function: the pipe operator `|>`. It makes the code much cleaner most of the times, and saves lots of ugly parenthesis. As an example, these two lines of code are equivalent:

```js
Js.log(parseAndRenderCard("3C"));
```

```js
"3C" |> parseAndRenderCard |> Js.log;
```

Ok! Enough talk, let's implement our function. Let's break the problem in smaller ones, and let's start with a parser for a suit:

```js
let parseAndRenderSuit = suitStr =>
  switch suitStr {
  | "H" => "Hearts"
  | "D" => "Diamonds"
  | "C" => "Clubs"
  | "S" => "Spades"
  };

/* example */
"C" |> parseAndRenderSuit |> Js.log;
```

`switch` is the syntax for pattern matching in ReasonML. It works somewhat like a switch statement in JS, but more powerful: among other features, the compiler will tell you if you took care of all the possible values for the input. That's one of the key features of ML languages that makes our code more reliable. For the above function, we get the following compiler warning:

```
You forgot to handle a possible value here, for example: ""
```

The compiler is right! And we can see that the generated JS code will raise an exception if the input is not one of the four cases. Let's try to fix this by defining a "default" pattern:

```js
let parseAndRenderSuit = suitStr =>
  switch suitStr {
  | "H" => "Hearts"
  | "D" => "Diamonds"
  | "C" => "Clubs"
  | "S" => "Spades"
  | _ => "-- unknown suit --"
  };

/* example */
"C" |> parseAndRenderSuit |> Js.log;
```

```
▶ node src/demo.bs.js
Clubs
```

Great! That's a good start. We have a function that correctly spells the intended suit, and will have a valid output for _every possible string input_. Let's do the same for the card value:

```js
let parseAndRenderValue = valueStr =>
  switch valueStr {
  | "2" => "Two"
  | "3" => "Three"
  | "4" => "Four"
  | "5" => "Five"
  | "6" => "Six"
  | "7" => "Seven"
  | "8" => "Eight"
  | "9" => "Nine"
  | "10" => "Ten"
  | "J" => "Jack"
  | "Q" => "Queen"
  | "K" => "King"
  | "A" => "Ace"
  | _ => "-- unknown value --"
  };

/* example */
"7" |> parseAndRenderValue |> Js.log;
```

Boring but effective. Now we just need to implement the function that separates the input string and call these two functions to print the full card. The suit is represented by the last character of the string, and the rest represents the value:

```js
let parseAndRenderCard = cardStr => {
  /* Separating the input string: */
  let length = Js.String.length(cardStr);
  let suitStr = Js.String.sliceToEnd(~from=length - 1, cardStr);
  let valueStr = Js.String.slice(~from=0, ~to_=length - 1, cardStr);

  /* Parsing and rendering the strings with our functions: */
  let renderedSuit = parseAndRenderSuit(suitStr);
  let renderedValue = parseAndRenderValue(valueStr);

  /* If inputs were valid, print the card: */
  if (renderedSuit !== "-- unknown suit --"
      && renderedValue !== "-- unknown value --") {
    renderedValue ++ " of " ++ renderedSuit;
  } else {
    "-- unknown card --";
  };
};

/* example */
"AD" |> parseAndRenderCard |> Js.log;
/* "Ace of Diamonds" */
```

There's a lot happening here, let me go step by step:

```
let length = Js.String.length(cardStr);
```

`Js.String.length` is a function, that transforms a string into an integer that represents that string length. That's a part of the "functional" way of thinking: every data we need is gathered from data transformations. For instance, if we want an upper case version of a string, instead of calling `str.toUpperCase()` we would call `Js.String.toUpperCase(str)`.

Next we have:

```
let suitStr = Js.String.sliceToEnd(~from=length - 1, cardStr);
let valueStr = Js.String.slice(~from=0, ~to_=length - 1, cardStr);
```

The `~` character is used to denote "labeled parameters". They are simply parameters that need to be named, and it means we can call them in whatever order we prefer. Calling `Js.String.sliceToEnd(cardStr, ~from=length - 1);` would yield the same result.

`Js.String` is the name of the module where the functions are located. We could also open the module in the beginning of the file, and use the functions directly:

```js
open Js.String;

(...)

let length = length(cardStr);
let suitStr = sliceToEnd(~from=length - 1, cardStr);
let valueStr = slice(~from=0, ~to_=length - 1, cardStr);
```

Which can be cleaner, but keep in mind it also "pollutes" the global context, making all functions inside `Js.String` available.

A tip: make sure to take advantage of VS Code's auto complete to explore all the modules and functions available to us! I actually found those three functions without googling it, and it was a really nice workflow. It's good to learn things while staying in the same environment - that's another interesting side effect of working with a typed language.

Back to our function, we have:

```js
let renderedSuit = parseAndRenderSuit(suitStr);
let renderedValue = parseAndRenderValue(valueStr);
```

Which is strightforward. And to finish:

```js
if (renderedSuit !== "-- unknown suit --"
    && renderedValue !== "-- unknown value --") {
  renderedValue ++ " of " ++ renderedSuit;
} else {
  "-- unknown card --";
};
```

Notice how we don't need a `return` keyword: the last line of a function expresses the return value. So, we are simply check if the values generated were the ones that represent unknown values, and if it's not the case for both the value and the suit, we build the final string in `renderedValue ++ " of " ++ renderedSuit` (`++` is the operator for string concatenation).

That's it, a working implementation of the spec! This function is already more reliable than the average javascript function, and we can have full confidence all string inputs are going to generate a valid output, no exceptions will be raised, and all the invalid cases are covered.

But this implementation can improve.

## A Second Approach: Option

My main issue with the previous implementation are the two `"-- unknown something --"` possible values for the value and suit parsers. There's a very interesting way of dealing with cases like this in ReasonML: the Option type. It represents values that may or may not be present, and that's exactly what the output of the function should be: we may or may not have a valid suit:

```js
let parseAndRenderSuit = suitStr =>
  switch suitStr {
  | "H" => Some("Hearts")
  | "D" => Some("Diamonds")
  | "C" => Some("Clubs")
  | "S" => Some("Spades")
  | _ => None
  };
```

VS Code shows us that now the function is of type `(string) => option(string)`, which is much more descriptive of what it does. It makes the code more _expressive_.

Option is a safe way of dealing with data that may not be present. Instead of having the null and undefined checks in javascript, that's the way we can work with an option in ReasonML:

```js
/* Let's say we want to log a string from a string option: */
let printSuitExample = suitOption =>
  switch suitOption {
  | Some(suit) => Js.log("Suit:" ++ suit ++ ".")
  | None => Js.log("Input was not a valid suit.")
  };
```

Alright, so let's also rewrite `parseAndRenderValue` using option:

```js
let parseAndRenderValue = valueStr =>
  switch valueStr {
  | "2" => Some("Two")
  | "3" => Some("Three")
  | "4" => Some("Four")
  | "5" => Some("Five")
  | "6" => Some("Six")
  | "7" => Some("Seven")
  | "8" => Some("Eight")
  | "9" => Some("Nine")
  | "10" => Some("Ten")
  | "J" => Some("Jack")
  | "Q" => Some("Queen")
  | "K" => Some("King")
  | "A" => Some("Ace")
  | _ => None
  };
```

Now that we changed those two functions to be more expressive, we can check that the compiler is not generating a new JS file. Our `parseAndRenderCard` is no longer valid, so we need to change it. In my previous experience with strong typed languages, this is the strongest point: refactoring feel safe! The compiler tells you exactly what breaks, and you just need to go there and fix. In our case, let's exchange the last If to a pattern match:

```js
let parseAndRenderCard = cardStr => {
  /* Separating the input string: */
  let length = length(cardStr);
  let suitStr = sliceToEnd(~from=length - 1, cardStr);
  let valueStr = slice(~from=0, ~to_=length - 1, cardStr);
  /* Parsing and rendering the strings with our functions: */
  let renderedSuit = parseAndRenderSuit(suitStr);
  let renderedValue = parseAndRenderValue(valueStr);
  /* If inputs were valid, print the card: */
  switch (renderedValue, renderedSuit) {
  | (Some(value), Some(suit)) => value ++ " of " ++ suit
  | _ => "-- unknown card --"
  };
};
```

Yes, we can pattern match on more than one value, and yes, it's awesome :)

The complete file [can be found here](https://github.com/lucasmreis/reason-exp/blob/master/src/first.re).

I like this implementation a lot more than the previous one, mainly for how it expresses better the intention by using the option types. Now let's go further, and completely decouple the parsing and the rendering phases.

## A Third Approach: Decoupling Parsing And Rendering

To achieve decoupling, we need to parse the string to a card representation, and then build a function that transforms this representation into a string. First, why would we do that? The main reason would be if we want to render in different ways, let's say we want to render to the DOM instead of logging to the console, or maybe our domain is getting so complex that the "parseAndRender" function got too large and complex. In our case, let's do it for fun and learning.

In javascript world, all data is represented mainly by objects and arrays. A card representation would be something like:

```js
const card = {
  value: CardValueConstants.QUEEN,
  suit: CardSuitConstants.HEARTS
};
```

The suit is enum-like, and we usually represent it in javascript by having an object with strings or symbols as values:

```js
const CardSuitConstants = {
  HEARTS: "HEARTS",
  DIAMONDS: "DIAMONDS",
  CLUBS: "CLUBS",
  SPADES: "SPADES"
};
```

Now if we want to check against a value, or check if a given string is a valid suit, we import and use this object.

In ReasonML, we would represent the suits this way:

```js
type suit = Hearts | Diamonds | Clubs | Spades;
```

Which works like an enum of symbols. These are called _Discriminated Unions_. The best part of working with them is that when we pattern match on a variable of this type, the compiler will make sure we handle all the cases.

For the card value, we need a little more information for the numbered card cases. Back in JS world, we could add a `number` property:

```js
const card = {
  value: CardValueConstants.NUMBER,
  number: 7,
  suit: CardSuitConstants.CLUBS
};
```

The weakness of a representation like that is that "impossible" cards are really easy to be represented. So we need to make sure we are always testing not only for `value` being equal `CardValueConstants.NUMBER`, but also if there's a `number` property present and it's a valid number.

In ReasonML, we would represent the values as:

```js
type value =
  | Ace
  | King
  | Queen
  | Jack
  | Num(int);
```

The most interesting characteristic of this way of representing the value is that there's simply _no way_ of having a card of value Queen that also has a number, or to have a numbered card without a defined number. This is huge, and combined with pattern matching, will make our code very reliable without the need to test existence of properties everywhere.

_Note:_ there's still impossible states that can be represented this way, for instance `Num(333)`. There only exists numbered cards from 2 to 10. We could list all cases explicitly, and our function would be even more reliable, but let's continue with this representation since it'll lead to more interesting code and more opportunities to learn.

Our final card representation now can be:

```js
type card =
  | Card(value, suit);
```

Which is a single case discriminated union. There's no reason to use one, we could use a simple tuple of type `(value, suit)`, but I find this express better the intent.

### Renderer

Now let's write the renderer. It will be simple, since it's only a matter of matching all the available cases:

```js
let suitToString = suit =>
  switch suit {
  | Hearts => "Hearts"
  | Diamonds => "Diamonds"
  | Clubs => "Clubs"
  | Spades => "Spades"
  };

let numToString = num =>
  switch num {
  | 2 => "Two"
  | 3 => "Three"
  | 4 => "Four"
  | 5 => "Five"
  | 6 => "Six"
  | 7 => "Seven"
  | 8 => "Eight"
  | 9 => "Nine"
  | 10 => "Ten"
  | _ => failwith("this is an exception from numToString")
  };

let valueToString = value =>
  switch value {
  | Ace => "Ace"
  | King => "King"
  | Queen => "Queen"
  | Jack => "Jack"
  | Num(n) => numToString(n)
  };

let renderCard = card =>
  switch card {
  | Card(value, suit) =>
    valueToString(value) ++ " of " ++ suitToString(suit)
  };

/* example */
Card(Num(8), Hearts) |> renderCard |> Js.log;
```

The only different code here is the `failwith` case in `numToString`. It's there because we need to handle all the integers when pattern matching, but we'll make sure we'll never have an invalid number. Again, we could deal with it by being explicit with all the cases, but sometimes it's not possible - imagine if we had an imaginary deck with numbered cards from two to a thousand. The way to do it is making sure the functions that output cards never return invalid cards, and it's a good place for unit and generative tests. Once more: strong typed languages are much more reliable than dynamic languages, but it does not mean they are 100% reliable - we still have to be careful. But it's much, much easier to write correct code :)

_Note:_ there are some attempts of expressing some of those constraints in the types themselves, like saying a variable is a number between 2 and 10. Some languages already have this ability, like [Ada](<https://en.wikipedia.org/wiki/Ada_(programming_language)>), and other more recent are trying to deal with it in a more generic way through dependent types, like [Idris](<https://en.wikipedia.org/wiki/Idris_(programming_language)>) and [F\*](<https://en.wikipedia.org/wiki/F*_(programming_language)>).

### Parser

The parser will be a function that takes a string and returns a card option. Let's start with the simple suit parser:

```js
let parseSuit = suitStr =>
  switch suitStr {
  | "H" => Some(Hearts)
  | "D" => Some(Diamonds)
  | "C" => Some(Clubs)
  | "S" => Some(Spades)
  | _ => None
  };
```

The function type is inferred as `(string) => option(suit)` which is exactly our intention.

For the value, I'll separate the number parsing to the other card values. Supposing we have a `parseNumValue` function implemented, we could use it like this:

```js
let parseValue = valueStr =>
  switch valueStr {
  | "A" => Some(Ace)
  | "K" => Some(King)
  | "Q" => Some(Queen)
  | "J" => Some(Jack)
  | n => parseNumValue(n)
  };
```

We are defining outputs for the "A", "K", "Q" and "J" inputs, and calling the `parseNumValue` function with the value if it did not match any of the previous. The compiler will not let us continue if our `parseNumValue` does not return a suit option! Let's implement it, and learn some new ReasonML concepts:

```js
let parseNumValue = numStr => {
  let parsed =
    try (Some(int_of_string(numStr))) {
    | Failure(_) => None
    };
  switch parsed {
  | Some(n) when n >= 2 && n <= 10 => Some(Num(n))
  | _ => None
  };
};
```

Starting with the `parsed` variable: we want to transform a string that may be a number into an integer variable. There's a standar function for that, `int_of_string`. But it raises an exception if the string input is not a valid integer. That's not the behavior we want here, we want a function that return a value option, in this case a `Num(int)` option, so we need a try expression.

It works similarly to javascript's try / catch, with the difference that it returns the value of the provided expression if it does not raise, and then pattern match on the exceptions if it does raise. Looking at `int_of_string` [documentation](https://reasonml.github.io/api/Pervasives.html#6_Stringconversionfunctions) we can see that the exception is of type `Failure(string)` so we catch it and return `None` in that case.

_Note:_ be really careful when working with exceptions. They are not defined in the function types, so the compiler can't help you make sure you are handling all cases. Also, you need to look at documentations to understand what to match for. As a rule of thumb, never use or rely on exceptions. Only use them if it's needed for integrating wih existing code (our case here), or somehow it makes the code simpler.

_Another note:_ The Js.Option module provides a `some` function that simply returns a `Some` option variable. It's useful if we want to use the pipe operator to get rid of parenthesis:

```js
open Js.Option;

(...)

let parsed =
    try (numStr |> int_of_string |> some) {
    | Failure(_) => None
    };
```

It's a matter of taste, and I think the pipe operator can make the code more elegant. I'm excited that it's being [considered for javascript too!](https://github.com/tc39/proposal-pipeline-operator)

Continuing on our function, there's something different in the pattern match:

```js
switch parsed {
| Some(n) when n >= 2 && n <= 10 => Some(Num(n))
| _ => None
};
```

We can put constraints on the patterns we want to match with the `when` keyword. And since this is the _only_ function that generates a `Num(int)`, we are guaranteeing that there will be no invalid cards! Of course, as I said before, in real life we should write some tests, and I'll cover them later in this series.

And, to finish the parser:

```js
let parseCard = cardStr => {
  let length = Js.String.length(cardStr);
  let suitStr = Js.String.sliceToEnd(~from=length - 1, cardStr);
  let valueStr = Js.String.slice(~from=0, ~to_=length - 1, cardStr);
  switch (parseValue(valueStr), parseSuit(suitStr)) {
  | (Some(value), Some(suit)) => Card(value, suit) |> some
  | _ => None
  };
```

### Gluing The Pieces Together

It would be amazing if we could simply use our functions like this:

```js
"8H" |> parseCard |> renderCard |> Js.log;
```

But we get the (very good btw) compiler error message:

```
We've found a bug for you!

102 │
103 │ /* example */
104 │ "8H" |> parseCard |> renderCard |> Js.log;

This has type:
  (card) => string
But somewhere wanted:
  (option(card)) => 'a

The incompatible parts:
  card
  vs
  option(card)
```

_Note:_ Elm is known for having amazing error messages - and it really does have them. I'm really happy they were very vocal about it, and that this practice is now "leaking" to other languages! Congratulations to the ReasonML / Bucklescript team to borrow the right features form different projects.

Alright, so we can't pipe our functions because `parseCard` return a option(card), and `renderCard`'s input is a card. Let's use this opportunity to build a couple of helper functions!

First, wouldn't it be useful to have a function that receives an option of something and a function of something, and applies the function to the value if it's a Some, and does not do anything if it's a None? This function is called `map`, and it would help our pipeline:

```js
let optionMap = fn => opt =>
  switch opt {
  | Some(x) => fn(x) |> some
  | None => None
  };
```

This is a higher order function, so now we can use:

```js
"8H" |> parseCard |> optionMap(renderCard) |> Js.log;
```

And `renderCard` will only be called if `parseCard` returns a Some. But, after saving the file, we can see that the declaration of the function is changed by the code formatter to `let optionMap = (fn, opt) => (...)`! Does it mean that ReasonML does not like higher order functions? No, it's the opposite: in ReasonML and most other ML languages, _all the functions are curried by default_. That means that, differently from usual JS functions, if you call a function with less input parameters than the function was expecting, you will have another function as a result, that will expect the other parameters. A classic simple example:

```js
/* (int, int) => (int) */
let sum = (x, y) => x + y;

/* (int) => (int) */
let sum5 = sum(5);

/* int */
let eight = sum5(3);
```

Ok, now our file compiles, but the output is an _array_ of string instead of a string. That's because `optionMap(renderCard)` returns a string _option_, not a string! If we feed the pipeline with an invalid card, say "1X", We'll see that the logged output will be "0", which is how Bucklescript translates None to javascript.

So let's implement a function to transform a string option into a string. We can do it by returning the string itself if it's inside a Some, or returning a default value if it's a None:

```js
let optionWithDefault = (defaultValue, opt) =>
  switch opt {
  | Some(x) => x
  | None => defaultValue
  };

/* example */
"2D"
|> parseCard
|> optionMap(renderCard)
|> optionWithDefault("-- unknown card --")
|> Js.log;
```

And now we have everything we need! Working functions, great confidence that they do what we want them to do, elegant implementations.

_Note:_ have you noticed the inferred type for `optionWithDefault`? It's `('a, option('a)) => 'a`, which does not mention strings. `'a` is a generic type, so that means this function will work with options of _anything_. The only thing we have to be careful with is that the default value passed must be of the same type inside the option :) That means that `optionWithDefault(0, Some(5))` or `optionWithDefault(Card(Ace, Diamonds), None)` are both valid! (and the same thing happens to `optionMap`, check it out).

We can also divide our functions into modules. In ReasonML, every file is a module, but we can also define modules inside a file, so let's do it to organize better our functions:

```js
type suit = (...)
type value = (...)
type card = (...)

module Parser = {
  let parseNumValue = (...)
  let parseValue = (...)
  let parseSuit = (...)
  let parseCard = (...)
};

module RenderToString = {
  let numToString = (...)
  let valueToString = (...)
  let suitToString = (...)
  let renderCard = (...)
  /* let's store this value here */
  let defaultErrorCard = "-- unknown card --";
};

module Option = {
  let map = (...)
  let withDefault = (...)
};

/* We can call functions inside modules easily: */
"JH"
|> Parser.parseCard
|> Option.map(RenderToString.renderCard)
|> Option.withDefault(RenderToString.defaultErrorCard)
|> Js.log;
```

Good, and we can extract the modules as single files if they get too large. I like the fact that we can have exactly the same abstraction as code and as a file. That makes the extraction of files mostly an organization issue.

## Spec Change!

As I've done in the [Learning Elm series](https://lucasmreis.github.io/blog/learning-elm-part-1/), let's change the specs. Let's suppose we want also to parse "J" into a joker card, and render it as "Joker". How would we represent a joker card? It does not have a value or a suit. So probably the best place to represent it is by changing the card type itself:

```js
type card =
  | OrdinaryCard(value, suit)
  | Joker;
```

We can already see the compiler complaining, and that's another benefit of having this card representation defined. The compiler uses this information, and help us pointing the places that need tobe changed so our application works as intended.

The function that we need to change is, according to the compiler, `renderCard`. So let's change it to deal with the new card type:

```js
let renderCard = card =>
  switch card {
  | OrdinaryCard(value, suit) =>
    valueToString(value) ++ " of " ++ suitToString(suit)
  | Joker => "Joker"
  };
```

Simple and easy! The compiler also says `parseCard` needs some work, so use the opportunity to think about how to parse "J" into the Joker representation. The "J" string is structured differently, since it does not have a defined suit. So it may be better not to change `parseValue` or `parseSuit`. Let's try to pattern match "J" before, and then call our parse function to parse the string if we already did not identify it's a Joker.

Let's first rename `parseCard` to `parseOrdinaryCard`, and then make sure we handle "J" in a new `parseCard` function:

```js
let parseOrdinaryCard = cardStr => {
  let length = Js.String.length(cardStr);
  let suitStr = Js.String.sliceToEnd(~from=length - 1, cardStr);
  let valueStr = Js.String.slice(~from=0, ~to_=length - 1, cardStr);
  switch (parseValue(valueStr), parseSuit(suitStr)) {
  | (Some(value), Some(suit)) => OrdinaryCard(value, suit) |> some
  | _ => None
  };
};

let parseCard = cardStr =>
  switch cardStr {
  | "J" => Some(Joker)
  | str => parseOrdinaryCard(str)
  };

/* example */
"J"
|> Parser.parseCard
|> Option.map(RenderToString.renderCard)
|> Option.withDefault(RenderToString.defaultErrorCard)
|> Js.log;
```

And we're done. I'm happy ReasonML changes to the syntax did not affect the refactoring super powers of Ocaml :)

The final code for the function [can be found here](https://github.com/lucasmreis/reason-exp/blob/master/src/second.re).

## Conclusion

First of all, all the benefits present in Fable are present in ReasonML - and that's great. Just like Fable, it's a nice pragmatic Elm. And I thought that, from all the languages, it was the easier to just start a project - I did not have to install any different tools, and the main packages are in npm. So that's a win for ReasonML :)

In the next part of this series, I'll start writing an actual web app, and I'll use the React integration library called [ReasonReact](). I think that this is where all the mentioned languages will differ the most. In the javascript world, I'm finding myself using a "pure React" model more and more, and it seems ReasonReact will work well together with it. Let's find it out together!

A last comment: ReasonML's [Discord channel](https://discordapp.com/invite/reasonml) is a great place, and the language maintainers are very active and helpful. Thank you for helping and answering questions so quickly!
