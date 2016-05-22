---
title: Learning Elm, part 2
lead: Understanding The Benefits Of A Simple Architecture
template: post.hbt
date: 2016-05-21
tags: functional, types, elm
draft: false
---

*This is part 2 of a series. You can read [part 1 here](http://lucasmreis.github.io/blog/learning-elm-part-1/).*

As I stated in part 1 of this series, I started learning Elm in a quest for more reliability in web front end programming. I implemented an algorithm, a parser, and things went very well.

Now let's build a simple application with user interaction. I want to see if I can still feel the same "reliability" I felt when I was only implementing a function.

It turns out Elm has a standard way of structuring apps baked into the language, the Elm Architecture. It's very simple, and has *already* influenced front end programming as a whole, mainly through the Redux library. We'll explore a simple version of the architecture in this post.

## The Spec
The specifications for our web app are:

1. The user will input an abbreviation of a card
2. The application will spell out the card and render it

We'll use the parser built in part 1 for that. Let's start.

## The Initial Boilerplate
First of all, of course, we need to install Elm. For a Mac, the cleanest path seems to be `brew cask install elm-platform`.

Next, running `elm package install` in the desired directory installs the language core, and creates an `elm-package.json` file. That file is the equivalent of `package.json` for the Elm world.

The easiest way to start developing is by editing the code in an editor (I've been using [VS Code](https://github.com/sbrink/vscode-elm) for Elm and it feels great), and running `elm-reactor` in the project directory.

Elm Reactor starts a server locally. Opening it in the browser shows a navigation page for the project. By clicking in any file, it compiles and runs the Elm code - super simple!

Now we have everything setup to start building our first Elm app.

## The Layout
Let's start by coding the layout. We will use a "standard" library called `elm-html`. It uses a virtual-dom technique to render the view, and we declare it as code:
```elm-lang
module Main exposing (..)

import Html exposing (div, input, p, text)


main =
    div
        []
        [ input [] []
        , p [] [ text "Seven of Club" ]
        ]
```
Every Html node is a function of two parameters: attributes and the children nodes. So, the above code produces the following html:
```html
<div>
  <input />
  <p>Seven of Club</p>
</div>
```
It takes a little time to get used to it, but it's actually very simple. We could style it with CSS, but for the sake of learning, let's do it inside Elm:

```elm-lang
module Main exposing (..)

import Html exposing (div, input, p, text)
import Html.Attributes exposing (style, placeholder)


main =
    div [ mainStyle ]
        [ input
            [ inputStyle
            , placeholder "Type your card..."
            ]
            []
        , p [ cardStyle ] [ text "Seven of Club" ]
        ]


mainStyle =
    style
        [ ( "font-family", "-apple-system, system, sans-serif" )
        , ( "margin", "10px" )
        , ( "padding", "40px" )
        , ( "display", "flex" )
        , ( "flex-direction", "column" )
        , ( "align-items", "stretch" )
        , ( "background-color", "#fafafa" )
        , ( "border", "lightgray solid 1px" )
        ]


inputStyle =
    style
        [ ( "border", "#fafafa solid" )
        , ( "border-bottom", "lightgray solid 1px" )
        , ( "font-size", "2em" )
        , ( "color", "rgba(0,0,0,0.75)" )
        , ( "background-color", "#fafafa" )
        ]


cardStyle =
    style
        [ ( "font-size", "2em" )
        , ( "color", "rgba(0,0,0,0.75)" )
        ]
```
 That's our layout. :)

## The Elm Architecture
Now let's get into how an Elm application is supposed to be structured.

Elm apps use a centralized state pattern, which I've [written about in this blog](http://lucasmreis.github.io/blog/centralized-state-design-patterns/). It's a simple "loop" described as such:
```
Model > View > Update > Model > View > ...
```

First you describe a model of your app. It is the skeleton, the data you need to render the application.

The view is then a function of the model. It takes the data and renders it.

After rendering, the application "waits" for user interaction or any other event. When that happens, it triggers the update function. The update function is a function that receives the old model and data of the event, and returns a new model. This model is then rendered, and the loop continues.

Elm gives us a function that does all the "plumbing" for us, and it's called `Html.App.program`. We'll use a simpler version of it, because that's everything we need for our small app, and it's called `beginnerProgram`. With it, you only need to define your model, update and view and the program does the heavy work for you:
```elm-lang
import Html.App exposing (beginnerProgram)


main =
    Html.App.beginnerProgram
        { model = init ""
        , view = view
        , update = update
        }
```

Now let's define `init`,  `view` and `update`.

## The Model
The user interacts through an input. That means we need a String in our model to hold it. We do not need anything else, since the other changing part of our view is simply a function of that String.

```elm-lang
type alias Model =
    String


init : String -> Model
init str =
    str
```
That's all the model we need for our spec, and a function to initialize it.

## The View
The view will be a function of our model. Let's use our layout as a starting point:

```elm-lang
view model =
    div [ mainStyle ]
        [ input
            [ inputStyle
            , placeholder "Type your card..."
            ]
            []
        , p [ cardStyle ] [ text "Seven of Club" ]
        ]
```

So, our view still does not use the model. Remember that we need to render the model string after parsing it, so let's do it:

```elm-lang
import CardParser

(...)

view address model =
  let
    card =
      CardParser.spellCard model
  in
    div
      [ mainStyle ]
      [ input
          [ inputStyle
          , placeholder "Type your card..."
          ]
          []
      , p [ cardStyle ] [ text card ]
      ]
```

Add a generic update function to the code to see the page rendered:
```elm-lang
update msg model =
    model
```
And we can see our app working! Change the initial value of the model in the beginnerProgram function and see the difference in the parsed string. Good work! Now let's make the app respond to some user interaction.

## The Update
The update function is also simple: as the user types something in the input field, it changes the model. Html.App will make sure our new model is then rendered through the view function.

The update mechanism works through message passing. The view sends messages that are processed by the update function, and then it produces a new model:
```elm-lang
type Msg
    = ChangeText String


update : Msg -> Model -> Model
update msg model =
    case msg of
        ChangeText newText ->
            newText
```
Now we need to send those messages on user input:
```elm-lang
import Html.Events exposing (onInput)

(...)

view model =
    let
        card =
            CardParser.spellCard model
    in
        div [ mainStyle ]
            [ input
                [ inputStyle
                , placeholder "Type your card..."
                , onInput ChangeText -- HERE!!!
                ]
                []
            , p [ cardStyle ] [ text card ]
            ]
```
Refresh your Elm Reactor page and play with the input now. That's it, our work is done!

## But Specs Change...
Don't they always? :)

Our app now needs *two inputs* that work the same way. The first thing that pops into our head is making a component of our current app, and then showing two of them. Let's do it.

Let's first create a new file called `ParserComponent.elm`, and move all the model, view and update code there. Our Main module will look like:
```elm-lang
module Main exposing (..)

import Html.App exposing (beginnerProgram)
import ParserComponent exposing (Model, Msg, init, view, update)


main =
    Html.App.beginnerProgram
        { model = ParserComponent.init ""
        , view = ParserComponent.view
        , update = ParserComponent.update
        }

```
And our app will work the same way. Now, to have two of the same components, let's define a new model, view and update for our app:
```elm-lang
type alias Model =
    { firstParser : ParserComponent.Model
    , secondParser : ParserComponent.Model
    }


init first second =
    Model first second
```
First of all, our new model is comprised of two ParserComponents models. Ok. Now how will we update them? We will *tag* every message that is sent from each component, and then treat each of them in a new update function:
```elm-lang
type Msg
    = First ParserComponent.Msg
    | Second ParserComponent.Msg

update msg model =
 case msg of
   First m ->
     { model | firstParser = ParserComponent.update m model.firstParser}

   Second m ->
     { model | secondParser = ParserComponent.update m model.secondParser}
```
So, now our messages can be sent by the first or second component, and we'll tag each with `First` and `Second`. Then, a `First` message will update the `firstParser` portion of our model, and a `Second` message will update the `secondParser` portion of our model.

Now let's see how to actually tag those messages in the new view:

```elm-lang

view model =
    div []
        [ Html.App.map First
            (ParserComponent.view model.firstParser)
        , Html.App.map Second
            (ParserComponent.view model.secondParser)
        ]

```
By using the `Html.App.map` we tag, with the first parameter, every message that is sent by the view rendered in the second parameter.

We are rendering a ParserComponent view with the `firstParser` portion of the model, and another with the `secondParser`, and we are tagging all the messages sent by the first with `First`, and all the messages sent by the second with `Second`.

Refresh again the Reactor page and there you have it - two independently working parser components.

##But The Specs Can Change Again...

To test even more how easy and safe it is to change our Elm code, let's change our spec once more. Let's say each component has now to parse a *list of cards*, separated by comma.

We can achieve that by *only changing the view function of the component*:
```elm-lang
sentence card =
    p [ cardStyle ] [ text card ]

view model =
    let
        cards =
            model
                |> String.split ","
                |> List.map String.trim
                |> List.map CardParser.spellCard
    in
        div [ mainStyle ]
            [ input
                [ inputStyle
                , placeholder "Type your card..."
                , onInput ChangeText
                ]
                []
            , div [] (List.map sentence cards)
            ]
```
And it just works.

##A Comment On Difficulties

Up until now, I can think of two main difficulties people would find in Elm: the application architecture that it enforces and the syntax itself.

The architecture is simple, but it's very different from the classic MVC from Angular and Backbone. Lately the trend in Javascript has been React + Flux, so, if you are using Redux or any other similar framework, you should have no problem understanding Elm. If you are used to the classic MVC pattern, things are going to take a little more time to sink in.

The syntax is very restrictive, and this can be frustrating to some developers who are used to imperative programming. But as soon as I started changing code, refactoring, extracting components, and changing specs, I could feel that the "restrictiveness" pays off. I feel that the language forces you to think a little bit more before writing code, and then makes refactoring easier and simpler.

##Conclusions

My initial objective when I started learning Elm was investigate ways to have more reliable front end code. Up until now everything is going smoothly, I had no runtime error after the code got compiled, and I have a lot of trust that the code is doing what it's supposed to do. It's also still fun!

In part 3 I plan to make a simple application that makes http requests, and check if code is still as simple as it's now.

By the way, here's the [final code](https://github.com/lucasmreis/learning-elm).