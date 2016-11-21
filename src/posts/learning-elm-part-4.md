---
title: Learning Elm, part 4
lead: Property Based Testing And Better Modelling
template: post.hbt
date: 2016-11-02
tags: functional, types, elm, testing
draft: false
---

As I said in the conclusion of that post, the function I wrote in [part 1 of this series](http://lucasmreis.github.io/blog/learning-elm-part-1/) felt very *reliable*, in a way that's difficult to feel with any javascript code.

As a reminder, here's the card type used in the code:

```elm
type Value = Jack | Queen | King | Ace | Num Int
type Suit = Club | Diamond | Spade | Heart
```

Looking at these types, a question arises: *how can I guarantee that I never end up with an invalid card?* By invalid card, I mean something like a thirteen of Clubs, or a minus five of Hearts.

## Unit Testing

The "unsafe" part of the type is the type `Value`. It's created by the function `parseNumValue`, which has the type:

```elm
parseNumValue : String -> Maybe Value
```

By testing the `parseNumValue` function, we'll be able to raise the reliability of the code as a whole.

Unit testing pure functions is very simple: we define some example cases of the function, and then define the expected return values. Let's use the library `elm-test` for that.

Installing Elm Test is easy, [as described here](https://github.com/elm-community/elm-test#running-tests-locally):

1. Run `npm install -g elm-test` if you haven't already.
2. `cd` into the project's root directory that has your `elm-package.json`.
3. Run `elm-test init`. It will create a `tests` directory inside this one,
   with some files in it.
4. Copy all the dependencies from `elm-package.json` into
   `tests/elm-package.json`. These dependencies need to stay in sync, so make
   sure whenever you change your dependencies in your current
   `elm-package.json`, you make the same change to `tests/elm-package.json`.
5. Run `elm-test`.
6. Edit `tests/Tests.elm` to introduce new tests.

After writing the unit tests, this is how my `Tests.elm` file looks like:

```elm
module Tests exposing (..)

import Test exposing (..)
import Expect
import Cards exposing (..)


all : Test
all =
    describe "parseNumValue"
        [ test "cannot be less than 2"
            <| \() -> Expect.equal (parseNumValue "1") Nothing
        , test "minimum of 2"
            <| \() -> Expect.equal (parseNumValue "2") (Just (Num 2))
        , test "maximum of 10"
            <| \() -> Expect.equal (parseNumValue "10") (Just (Num 10))
        , test "cannot be more than 10"
            <| \() -> Expect.equal (parseNumValue "11") Nothing
        ]
```

The syntax is direct: you describe a test suite, and define the tests inside a list. I tested the "corner cases" of the function, to make sure that any value less than 2 or more than 10 is not going to be parsed to a Card. I also like how tests in general also work as documentation to how the function is supposed to behave.

Ok, the unit tests raise reliability, but they could do better. What will happen if we call the `parseNumValue` function with the string "100"? Or the string "-22"? Is it possible to write more general tests, that answer the more powerful question *can I guarantee that only integers between 2 and 10 get converted to a Value, and no others*?

## Property Based Testing

Property Based Testing are very interesting because they allow you to test a whole set of values. For instance, let's pretend that we have at our disposal the set of all integers. If we transform them to strings, we have the perfect inputs for testing `parseNumValue`.

Elm Test has an easy way of doing property based tests. You use the `fuzz` function instead of the `test` function, specify a "fuzzer" and write your test using the generated value as a parameter:

```elm
(...)

import Fuzz exposing (..)

(...)

, fuzz int "parseNumValue"
    <| \number ->
        let
            parsed =
                number
                    |> toString
                    |> parseNumValue
        in
            case parsed of
                Just (Num v) ->
                    Expect.true "Number should be >= 2 and <= 10 when Just Num v"
                        (v >= 2 && v <= 10)

                _ ->
                    Expect.false "Number should not be >= 2 and <= 10 when Nothing"
                        (number >= 2 && number <= 10)
```

This test is direct: it generates an `int` and passes it as a parameter to the testing function - that's why we're using `\number -> ...`. Then we convert the number to a string and parse it with our `parseNumValue` function.

We are trying to test that, if the result of the parse is a `Just (Num v)`, then the number was something between two and ten. And, if the result is `Nothing`, the number was either smaller than 2 or greater than 10.  That's what we are asserting in the pattern matching section of the test.

How does it work? It's simple: `fuzz int` generates a bunch of random integers, and run the test for each integer generated. That way, it's almost the same as writing a lot of `test` functions for a lot of integer values.

*Observation*: during these tests, I found a little problem: the key values of 1, 2, 10 and 11 were *not* tested every time. That means I could have a false positive! The fuzz test would say everything is ok, but maybe my function had an error and I ended up with a `Just (Num 11)`. Maybe the solution to this would be raising the number of random integers tested, but I could not find a way to do it. If you have an idea of how to do with this situation, please say it in the comments section!

In the end, I maintained the four unit tests that I knew were important cases, and added the fuzz test. [Here's how the final test file looks like](https://github.com/lucasmreis/learning-elm/blob/master/part-4/tests/Tests.elm).

I believe the solution feels much more reliable with the addition of the property based tests. But one thing still bothers me: the fact that, if I do not use the parsers to build a card, I can still have an invalid card like `Just (Num 11)`.

## Can We Do Better?

Our cards have a small finite domain. Instead of having a `Num Int` case for the `Value` type, we could be explict about every value possible:

```elm
type Value
    = Jack
    | Queen
    | King
    | Ace
    | Two
    | Three
    | Four
    | Five
    | Six
    | Seven
    | Eight
    | Nine
    | Ten


type Suit
    = Club
    | Diamond
    | Spade
    | Heart


type Card
    = OrdinaryCard Value Suit
    | Joker
```

This modelling is very simple and direct, but it's also *powerful*. It is literally impossible to represent an invalid card. This is what [Yaron Minsky](https://vimeo.com/14313378), [Mark Seemann](https://vimeo.com/162036084), [Scott Wlaschin](http://fsharpforfunandprofit.com/posts/designing-with-types-making-illegal-states-unrepresentable/) and [Richard Feldman](https://www.youtube.com/watch?v=IcgmSRJHu_8) mean when they say "make illegal states unrepresentable". All these talks are amazing, and illustrate very well the benefits of having types that simply do not allow invalid models to be represented, and also techniques to achieve that.

And now we have a much more robust set of functions to parse and "pretty print" cards. ([The whole final code with the new types is here](https://github.com/lucasmreis/learning-elm/blob/master/part-4/src/SafeCards.elm)).

## Is It Always A Possibility?

I tend to think that we were kind of "lucky" here, in the sense that a normal deck of cards has about nine numbered cards only. It's easier to enumerate every case in that sense, but I do not know if it would be practical to do that if the numbered cards were in the 2 - 100 range, for example.

I think that the simple way of dealing with it is: always try first to have all your modelling constraints through types. As an example, imagine that the only way to have a user name is through logging in. That means that instead of:

```elm
type alias User =
    { isLogged : Bool
    , name : String
    }
```

You should have:

```elm
type User
    = NotLogged
    | Logged String
```

With the second modelling, you never have the risk of having a NotLogged user with a name. That means you *don't need any test that assure that a constructed user is invalid*. This is what I meant by powerful! :)

And what do I do if I can't model my domain that way? For example, what do I do if I have a deck of cards with numbered cards ranging from 2 to 1000? Then I think that testing your constructors with property based tests is the way to go.

*Observation*: even when your typings make illegal states unrepresentable, unit and property based tests are still useful when testing *state transitions*. In our User example, it's useful to test if "logging out function results in a NotLogged User". So, even though good type modelling lower the need for tests, *tests are still useful for making your code reliable*.

One last remark: we could represent our 1000 cards deck using only types if we could have a "bounded integer" type, something like "this is an integer larger than X and smaller than Y". This would be a type that is *dependent on values*, and it's not possible to do in Elm. Actually, it seems it's not possible to do in any mainstream language. :(

[This stack overflow question](http://stackoverflow.com/questions/9338709/what-is-dependent-typing) explains dependent typing very directly, and [here's a list of languages with dependent typing](https://en.wikipedia.org/wiki/Dependent_type) so we can research more about it. [Idris](http://www.idris-lang.org/example/) looks particularly nice!
