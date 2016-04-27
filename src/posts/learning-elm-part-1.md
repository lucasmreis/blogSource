---
title: Learning Elm, part 1
lead: Understanding The Benefits Of A Strong Type System
template: post.hbt
date: 2016-04-22
tags: functional, types, elm
draft: false
---

A big concern when working with Javascript is *safety*. Safety in the sense of being completely sure about what a piece of code does, and knowing that changing one part won't break another part. A key concept is *error feedback cycle*: how soon can you catch errors in your code?

There are a lot of ways to deal with that. "Linters" and comprehensive tests are a good start, and they are already a reality for most serious projects today. Using functional programming concepts like pure functions can also help a lot by simplifying your tests, and making it easier to reason about your project.

Another trend I see is *type safety*, mostly through TypeScript and Facebook Flow. They claim that, by programming with types, you can have a compiler that helps you get the code right. Not only that, the compiler will catch a lot of errors early in the process, so the error feedback cycle gets much shorter.

So I decided to experiment with a typed language that compiles to Javascript. In a continuum of less type safety to more type safety, I compiled these players:

1. Plain Javascript (almost zero type safety)
2. Facebook Flow
3. TypeScript
4. PureScript
5. Elm

Elm is the most "hardcore typed language" of the list, meaning that you can't even call Javascript code from Elm and vice-versa - you have to communicate through message passing. On the other hand, Elm would be the language that would provide the most type safety benefits of the list.

That's why I decided to start my investigations on safety with Elm. Let's start by implementing a relatively simple algorithm, and then we'll move on to more real-life situations.

## The Spec

I will write an algorithm that spells out a playing card abbreviation. Some examples:

```
"3S" -> "Three of Spade"
"10H" -> "Ten of Heart"
"QC" -> "Queen of Club"
"AD" -> "Ace of Diamonds"
"3T" -> "-- unknown card --"
```

I will write the algorithm using the [Try Elm website](http://elm-lang.org/examples/hello-html). Now let's start!

## Modelling With Types

I've read a lot about types in Haskell, OCaml and F#, but never had the chance to program anything using that kind of strong type system. I've been using dynamic languages (Javascript and Clojure) for the last few years, so it feel a little weird to think of types first.

Disclaimer: I'll try to be as practical as I can. I'll try not to say "Monad" like everybody knows what it means, for instance :) An intermediate developer should be ok. If you have any questions, please feel free to ask in the comments.

Back to the problem, I've come with the following initial representation of the cards:

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

I'm testing it by replacing the following values in the last line:

```elm-lang
import Html exposing (text)

-- code (...)

main =
  Spade
    |> printSuit
    |> text
```

The `|>` operator chains function calls. In the above line I get Spade, call `printSuit` with it as a parameter, then get the result of that computation and call the function `text` with it. It shows "Spade" in the output screen, so it works! :)

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

A little boring, but I went through every case possible - unless someone enters a number less than 2 or more than 10. I'll deal with that in the function that actually creates the card.

To print the whole card, I'll make a function that concatenates a list that consists of: the value string, `" of "` and the suit string. I'll represent a card as a tuple `(Value, Suit)`:

```elm-lang
printCard (value, suit) =
  [printValue value, " of ", printSuit suit] |> String.concat

main =
  (Num 10, Spade)
    |> printCard
    |> text

-- Ten of Spade
```

The code above works, and I can be sure that all the combinations of Value and Suit will print well. That's really good.

I'll add another layer of safety and documentation by writing the type signatures of the functions. I catch myself writing "type signatures" as comments even to my Javascript code from time to time, and it helps when dealing with a piece of code months later. I'm starting to believe that having a compiler that ensures that your type signatures are in sync with the implementations can help a lot with maintainability.

`printCard` signature is: `printCard : (Value, Suit) -> String`, but I think we can be more expressive if it is `printCard : Card -> String`. That is possible with Elm, by writing a *type alias*:

```elm-lang
type alias Card = (Value, Suit)

(...)

printCard : Card -> String
printCard (value, suit) =
  [printValue value, " of ", printSuit suit] |> String.concat

main =
  (Num 10, Spade)
    |> printCard
    |> text

-- Ten of Spade
```

So, if I have a valid card, I can print it. Nice. Now let's parse the original abbreviation string.

## Parsing A Suit And A Value From A String

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

When I compile it - even before calling this function anywhere - the compiler screams an error. This is the message I get:

```
MISSING PATTERNS
This `case` does not have branches for all possibilities.

11| case char of
12| 'C' -> Club
13| 'D' -> Diamond
14| 'S' -> Spade
15| 'H' -> Heart
You need to account for the following values:

 <values besides 'C', 'D', 'H', and 'S'>

Add a branch to cover this pattern!

If you are seeing this error for the first time, check out these hints:
<https://github.com/elm-lang/elm-compiler/blob/0.16.0/hints/missing-patterns.md>
The recommendations about wildcard patterns and `Debug.crash` are important!
```

Oh my god, now that's an error message! First of all, the subject of the error is already outstanding: I coded that the function receives a Char as a parameter, and I did not handle all the Char cases. That means the compiler is preventing me from having code that behaves unexpectedly. What would be the return value if an `'X'` was passed? That case needs to be handled.

But, better than that, I really like how *didatic* the message was. Not only does it give some tips, it gives a link to a page teaching the subject! I've read that [Evan Czaplicki](https://twitter.com/czaplic?lang=en), the language designer, is working hard on making the error messages better. Good job!

By reading that link, I learned that the best way to deal with this in this case is by using a Maybe type. Maybe is native to Elm, and represented by:

```elm-lang
type Maybe a
  = Just a
  | Nothing
```

Maybe represents a value that may or may not exist. So I'll make the assumption that if the Char inputted by the user is not one of the four, the Suit will not exist and will be represented by a Nothing:

```elm-lang
parseSuit : Char -> Maybe Suit
parseSuit s =
  case s of
    'C' -> Just Club
    'D' -> Just Diamond
    'S' -> Just Spade
    'H' -> Just Heart
    _ -> Nothing

main =
  'C'
    |> parseSuit
    |> toString
    |> text

-- Just Club
```

The best part of using *a maybe* is that the functions that deal with the value returned by the parsers *will have to deal with the fact that they may not exist*. This will be enforced by the compiler, and is one way of making sure we have to explicitly deal with errors or unexpected behaviors in the code. I'll talk more about that later. Let's now write the Value parser.

A simple implementation would be:

```elm-lang
parseValue : String -> Maybe Value
parseValue v =
  case v of
    "J" ->
      Just Jack

    "Q" ->
      Just Queen

    "K" ->
      Just King

    "A" ->
      Just Ace

    _ ->
      String.toInt v
```

But the compiler screams that `String.toInt` does not return a Maybe Value. It returns a Result String Int which is described by `type Result error value = Ok value | Err error`. Let's extract this case to a different function so we can manage better `toInt`:

```elm-lang
parseNumValue : String -> Maybe Value
parseNumValue v =
  case String.toInt v of
    Ok num ->
      if (num >= 2 && num <= 10) then
        Just (Num num)
      else
        Nothing

    Err _ ->
      Nothing


parseValue : String -> Maybe Value
parseValue v =
  case v of
    "J" ->
      Just Jack

    "Q" ->
      Just Queen

    "K" ->
      Just King

    "A" ->
      Just Ace

    _ ->
      parseNumValue v

main =
  "10"
    |> parseValue
    |> toString
    |> text

-- Just (Num 10)
```

This is one of the most interesting parts of the code we are writing. `parseNumValue` is the function that *guarantees* that a card will have a minimum value of 2 and a maximum of 10. This together with wrapping it in a Maybe, and using the Card type, is a guarantee that, whenever I have a Card variable, it's going to be a valid Card. There's no way to represent an invalid card, or to process an invalid card at some point of the code.

Now we can parse a Value and a Suit. The next step is parsing the whole abbreviation, like `"10H"` or `"KS"`.

## Parsing An Abbreviation String

We need to separate the abbreviation string into a value string and a suit character. Now this is a fun function:

```elm-lang
divideCardString : String -> (Maybe String, Maybe Char)
divideCardString str =
  let
    chars = String.toList str

    suit = chars
      |> List.reverse
      |> List.head

    value = chars
      |> List.reverse
      |> List.tail
      |> Maybe.map List.reverse
      |> Maybe.map String.fromList

  in
    (value, suit)

main =
  "AH"
    |> divideCardString
    |> toString
    |> text

-- (Just "A", Just 'H')
```

Let's break it into parts. First, there's the `let` keyword. It is used to compute temporary variables that will be returned after the `in` keyword.

The first variable is `chars`. It's the List representation of the input string. It's inferred as a List of Char.

To compute the next variables, I did not choose the most efficient way, and that can be "homework" for the reader :) `suit` is the head of the reverse of the list; in other words, it's the last Char. Note that `List.head` returns a Maybe, because the list may be empty!

`value` is the rest of the string. It's the tail of the reverse of the list, reversed again, and transformed in a String again. That's definitely not performant, but fun :) `List.tail` returns a Maybe List, so, to apply `List.reverse` and `String.formList`, I had to use `Maybe.map`. Maybe.map is the way to apply a function to the value inside a Maybe.

Now the function that takes this tuple and returns a Maybe Card:

```elm-lang
parseCardTuple : (Maybe String, Maybe Char) -> Maybe Card
parseCardTuple (value, suit) =
  case (value `Maybe.andThen` parseValue, suit `Maybe.andThen` parseSuit) of
    (Just v, Just s) ->
      Just (v, s)

    _ ->
      Nothing

main =
  (Just "7", Just 'D')
    |> parseCardTuple
    |> toString
    |> text

-- Just ((Num 7,Diamond))
```

`Maybe.andThen` is used when using `Maybe.map` returns a Maybe of a Maybe. `andThen` is for Maybes what `flatten` is for Arrays :)

The nice part of this function is that we called functions inside the `case of` syntax. So, if both parses are successful, I'll return a Just Card. If anything goes wrong, be it that there was no String to begin with, or one of the parses returned Nothing, our function itself will return Nothing.

Now our algorithm is ready! Let's glue all the parts together.

## The Final function

The final function is just a composition of the ones we just built:

```elm-lang
spellCard : String -> String
spellCard str =
  str
    |> divideCardString
    |> parseCardTuple
    |> printCard
```

It does not compile. The compiler tells us that `parseCardTuple` returns a Maybe Card, and `printCard` was expecting a Card. We already know how to solve it, we just change it to `Maybe.map printCard`. The problem is that the function would still return a Maybe String, and we want to extract a String from it.

The `Maybe` module has a function for that: `Maybe.withDefault`. It accepts a default value and a Maybe. If the Maybe is a Just, it returns the value inside the Just. If it's a Nothing, it returns the default value. Here is the official implementation of [`Maybe.withDefault`](https://github.com/elm-lang/core/blob/master/src/Maybe.elm#L51):

```elm-lang
withDefault : a -> Maybe a -> a
withDefault default maybe =
  case maybe of
    Just value -> value
    Nothing -> default
```

Using it, our final function is described as:

```elm-lang
spellCard : String -> String
spellCard str =
  str
    |> divideCardString
    |> parseCardTuple
    |> Maybe.map printCard
    |> Maybe.withDefault "-- unknown card --"


main =
  "AH"
    |> spellCard
    |> text

-- Ace of Heart
```

It's done!

## But Specs Change...

And we have to deal with it. One of the promises of strong type systems is that they make the code much easier and safer to change / refactor. I work daily with a big Javascript application, and I think that's one of the most painful points now. Changing any part of the code requires a lot of attention, and a lot of faith in the tests. Just changing a function is never the answer, and we have to be extra careful not to insert "hidden bugs" by creating new unexpected cases.

Let's suppose we want to include the Joker card:

```
"J" -> "Joker"
```

The first thing I notice is that our model is not sufficient anymore. A card is not a tuple of value and suit; now we also have a joker. I'm gonna change the `Card` type, and run the compiler to see what it says:

```elm-lang
type Card = OrdinaryCard Value Suit | Joker
```

The compiler complains that `printCard` does not print a Card, it prints a tuple. Let's change it:

```elm-lang
printCard : Card -> String
printCard card =
  case card of
    OrdinaryCard value suit ->
      [printValue value, " of ", printSuit suit] |> String.concat

  Joker ->
    "Joker"
```

The other error the compiler caught was that `parseCardTuple` does not return a Card. Now it's time to pause a little and think about the parsers.

The Joker abbreviation is only a `"J"`, so it does not make sense to call `divideCardString` with it! If I have a `"J"`, I should return a Just Joker. To do that, I'm gonna implement a new function:

```elm-lang
parseCardString : String -> Maybe Card
parseCardString str =
  case str of
    "J" ->
      Just Joker
    
    _ ->
      str
        |> divideCardString
        |> parseCardTuple
```

It handles the case `"J"` separately, and calls our previous function if it's not a Joker. Now we only have to change `parseCardTuple` to return an OrdinaryCard instead of the tuple in case of success:

```elm-lang
parseCardTuple : (Maybe String, Maybe Char) -> Maybe Card
parseCardTuple (value, suit) =
  case (value `Maybe.andThen` parseValue, suit `Maybe.andThen` parseSuit) of
    (Just v, Just s) ->
      Just (OrdinaryCard v s) -- not a tuple

  _ ->
    Nothing
```

And change `spellCard`:

```elm-lang
spellCard : String -> String
spellCard str =
  str
    |> parseCardString
    |> Maybe.map printCard
    |> Maybe.withDefault "-- unknown card --"

main =
  "J"
    |> spellCard
    |> text

-- Joker
```

That was very easy, and I really liked the compiler's help.

## First Impressions Of Elm

It's a simple algorithm, and it's just a pure function. I still can't tell if a big web application Elm codebase will feel the same way, so let's all take these conclusions with a grain of salt - it's just a first impression.

First: the code really feels *safe*. Even though I do not have any unit tests, I'm sure it works as expected, with no errors or difficult-to-spot runtime exceptions. In a more serious setting, I would write three or four unit tests and that's it. Safety is probably the number one factor that's making me research other front end languages, and Elm's strong type system seems to be a clean path towards safety.

Second: the code feels *maintainable*. I may have spent a little more time implementing the first version of the function than I would with Javascript. But I found that implementing the new spec was very easy and direct, maintaining the safety feeling I had when I started coding the function.

Third: it was *fun*. Fun is sometimes overlooked when talking about technologies, but it should not be. Not only does it help keep the engineers engaged, it's usually a good signal that we are dealing with a smart and productive tool. No one finds using a dumb and clumsy tool fun, am I right? :)

## Next Steps

I really liked this first contact with Elm, and I'm going to continue investigating it.

As a next step, I will implement a web app that uses our function. I'll have to deal with Elm's tooling outside the online REPL, and I'll have to deal with asynchronous events from user interaction.

Then I'll implement a web app that communicates with a server. I', curious to see how easy it'll be to write "impure" code in Elm.

If you have had any experiences with Elm, good or bad, feel free to post it in the comments section!

## The Final Code

You can copy and paste the following code to the online REPL and play a little bit with Elm:

```elm-lang
import Html exposing (text)
import String

type Value = Jack | Queen | King | Ace | Num Int
type Suit = Club | Diamond | Spade | Heart
type Card = OrdinaryCard Value Suit | Joker


parseSuit : Char -> Maybe Suit
parseSuit s =
  case s of
    'C' -> Just Club
    'D' -> Just Diamond
    'S' -> Just Spade
    'H' -> Just Heart
    _ -> Nothing


parseNumValue : String -> Maybe Value
parseNumValue v =
  case String.toInt v of
    Ok num ->
      if (num >= 2 && num <= 10) then
        Just (Num num)
      else
        Nothing

    Err _ ->
      Nothing


parseValue : String -> Maybe Value
parseValue v =
  case v of
    "J" ->
      Just Jack

    "Q" ->
      Just Queen

    "K" ->
      Just King

    "A" ->
      Just Ace

    _ ->
      parseNumValue v


divideCardString : String -> (Maybe String, Maybe Char)
divideCardString str =
  let
    chars = String.toList str

    suit = chars
      |> List.reverse
      |> List.head

    value = chars
      |> List.reverse
      |> List.tail
      |> Maybe.map List.reverse
      |> Maybe.map String.fromList

  in
    (value, suit)


parseCardTuple : (Maybe String, Maybe Char) -> Maybe Card
parseCardTuple (value, suit) =
  case (value `Maybe.andThen` parseValue, suit `Maybe.andThen` parseSuit) of
    (Just v, Just s) ->
      Just (OrdinaryCard v s) -- not a tuple

    _ ->
      Nothing


parseCardString : String -> Maybe Card
parseCardString str =
  case str of
    "J" ->
      Just Joker

    _ ->
      str
        |> divideCardString
        |> parseCardTuple


printSuit : Suit -> String
printSuit suit = toString suit


printValue : Value -> String
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


printCard : Card -> String
printCard card =
  case card of
    OrdinaryCard value suit ->
      [printValue value, " of ", printSuit suit] |> String.concat

  Joker ->
    "Joker"


spellCard : String -> String
spellCard str =
  str
    |> parseCardString
    |> Maybe.map printCard
    |> Maybe.withDefault "-- unknown card --"


main =
  "J"
    |> spellCard
    |> text
```
