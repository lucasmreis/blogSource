---
title: Learning Elm, part 1
lead: Understanding The Benefits Of A Strong Type System
template: post.hbt
date: 2016-04-22
tags: functional, types, elm
draft: true
---

INTRODUCTION

## The Spec

I will write an algorithm that spells out a playing card abbreviation. Some examples:

```
"3S"  -> "Three of Spade"
"10H" -> "Ten of Heart"
"QC"  -> "Queen of Club"
"AD"  -> "Ace of Diamonds"
"3T"  -> "-- unknown card --"
```

I will write the algorithm using the [Try Elm website](http://elm-lang.org/examples/hello-html). Now let's start!

## Modelling With Types

I've read a lot about types in Haskell, OCaml and F#, but never had the chance to program anything using that kind of strong type system. I've been using dynamic languages (Javascript and Clojure) for the last years, so it feel a little weird to think of types first.

That said, I've come with the following initial representation of the cards:

```elm-lang
type Value = Jack | Queen | King | Ace | Num Int
type Suit = Club | Diamond | Spade | Heart
```
Both types are *union types*. That means that a Suit can either be a Club, Diamond, Spade or Heart. And a Value can be a Jack, a Queen, a King, an Ace or a Num with an integer. So, a Num 2 or Num 5 is a valid Value.

That seems like a nice model for our problem. Now let's implement the functions that print a card.

## Printing a Card

I'll first print a Suit. It's a no brainer:

```elm-lang
printSuit suit = toString suit
```

I'm testing that by replacing the following values in the last line:

```elm-lang
import Html exposing (text)

(...)

main =
  Spade
    |> printSuit
    |> text
```

The `|>` operator chains function calls. In the above line I get Spade, call `printSuit` with it as a parameter, then get the result of that computation and call `text` with it. It shows "Spade" in the output screen, so it works! :)

To print a Value, calling `toString` is not enough. I need to handle the `Num Int` case differently. I'll use *pattern matching* to do that:

```elm-lang
printValue value =
  case value of
    Num 2 ->
       "Two"

    Num 3 ->
       "Three"

    Num 4 ->
       "Four"

    Num 5 ->
       "Five"

    Num 6 ->
       "Six"

    Num 7 ->
       "Seven"

    Num 8 ->
       "Eight"

    Num 9 ->
       "Nine"

    Num 10 ->
       "Ten"

    _ ->
      toString value
```

A little boring, but I went through every case possible - unless someone enters a number less than 2 or more than 10, but I'll deal with that in the function that actually creates the card.

To print the whole card, I'll make a function that concatenates a list that consists of the value string, `" of "` and the suit string. I'll represent a card as a tuple `(Value, Suit)`:

```elm-lang
printCard (value, suit) =
  [printValue value, " of ", printSuit suit] |> String.concat

main =
  (Num 10, Spade)
    |> printCard
    |> text

-- Ten of Spade
```

The code above works, and I can be safe that all the combinations of Value and Suit will print well. That's really good.

I'll add another layer of safety and documentation by writing the type signatures of the functions. I get myself writing "type signatures" as comments to my Javascript code from time to time, and it helps when dealing with a piece of code months later. I'm starting to believe that having a compiler that ensures that your type signatures are in sync with the implementations can help a lot with maintainability.

`printCard` signature is: `printCard : (Value, Suit) -> String`, but I think we can be more expressive if it was `printCard : Card -> String`. That is possible with Elm, by writing a *type alias*:

```elm-lang
type alias Card = (Value, Suit)

(...)

printCard : Card -> String
printCard (value, suit) =
  [printValue value, " of ", printSuit suit] |> String.concat
```

So, if I have a valid card, I can print it. Nice. Now let's parse the original abbreviation string.

## Parsing a String

First I'll parse the suit. My first take is:

```elm-lang
parseSuit : Char -> Suit
parseSuit char =
  case char of
    'C' -> Club
    'D' -> Diamond
    'S' -> Spade
    'H' -> Heart
```

When I compile it - even before calling this function anywhere - the compiler shouted an error. This is the message I got:

```
MISSING PATTERNS
This `case` does not have branches for all possibilities.

11|   case char of
12|     'C' -> Club
13|     'D' -> Diamond
14|     'S' -> Spade
15|     'H' -> Heart
You need to account for the following values:

    <values besides 'C', 'D', 'H', and 'S'>

Add a branch to cover this pattern!

If you are seeing this error for the first time, check out these hints:
<https://github.com/elm-lang/elm-compiler/blob/0.16.0/hints/missing-patterns.md>
The recommendations about wildcard patterns and `Debug.crash` are important!
```

Oh my god, now that's an error message! First of all, the subject of the error is already amazing: I said the function receives a Char as a parameter, and I did not handle all the Char cases. That means the compiler is preventing me from having code that behaves unexpectedly. What would be the return value if an `'X'` was passed? That case needs to be handled.

But, better than that, I really like how *didatic* was the message. Not only it gives some tips, it gives a link to a page teaching about the subject! I've read that [Evan Czaplicki](https://twitter.com/czaplic?lang=en), the language designer, is working hard on making the error messages better. Good job!
