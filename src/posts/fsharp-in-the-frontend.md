---
title: F# In The Frontend
lead: Trying Fable From An Elm And Javascript Perspective
template: post.hbt
date: 2016-04-22
tags: functional, types, elm
draft: false
---

Some months ago I started a [quest to gain reliability in frontend development](http://lucasmreis.github.io/blog/learning-elm-part-1/). I chose Elm as the starting point, from this list:

1. Plain Javascript
2. Facebook Flow
3. TypeScript
4. PureScript
5. Elm

This was a ranking from "not reliable" to "reliable" frontend languages, mainly taking *types* into consideration. After programming with Elm a bit (and fidindg it awesome :) ), I started looking for [other languages with similar characteristics](http://lucasmreis.github.io/blog/does-elm-harmonize-with-f/#/). That was the time I found F#, and I'm really impressed by it.

It turns out that there's a F# to JS compiler called [Fable](http://fable.io/). In the ranking, it would be together with Purescript in number 4, or between Typescript and Purescript. It trades a bit of the "safety" for an easier Javascript interop.

In this post I'll "convert" the [star wars app I wrote in Elm](http://lucasmreis.github.io/blog/learning-elm-part-3/) to Fable, then I'll refactor it. Along the way, I'll compare the experience to both Elm and regular Javascript workflow.

## Starting A New Fable Project

Elm is very "beginner friendly", and it is the focus of that project since the beginning. This makes it very easy to just start playing with the language, be it with [Try Elm online](http://elm-lang.org/try) or using [Elm Reactor](https://github.com/elm-lang/elm-reactor) locally. Fable works more like a regular Javascript transpiler; so we need to do the initial pumbling, and then run our project through a local server.

Fortunately, it's simple. This is what I did: first I wrote a simple index.html file, that imports a `build/bundle.js` script:

```html
<!doctype html>
<html>
<head>
  <meta http-equiv='Content-Type' content='text/html; charset=utf-8'>
  <title>Star Wars - Fable</title>
</head>
<body>
  <div id="app"></div>
  <script src="build/bundle.js"></script>
</body>
</html>
```

Then I globally installed the Fable compiler, and installed the `fable-core` package locally in the project:

```bash
$ npm install -g fable-compiler
$ npm init
$ npm install --save fable-core
```

Now we can write a fsharp file, let's say in `src/Main.fsx`:

```fsharp
#r "../node_modules/fable-core/Fable.Core.dll"

open Fable.Import.Browser

console.log("It's working!")
```

I'll explain the syntax soon. Now we can build the project by using the `fable` command with some arguments:

```bash
$ fable src/Main.fsx --outDir ./build --rollup
```

I'm saying "build the `src/Main.fsx` file, and save the output in the `./build` directory. And please, bundle it using the [Rollup bundler!](http://rollupjs.org/)".

Now, as a last step, to run the built project, choose your favorite simple local server to serve the index.html. I've been using `http-server` and had no problems:

```bash
$ npm install -g http-server
$ http-server
```

Just head to `http://localhost:8080` and we're running! :)

## The .fsx File

The `Main.fsx` file is a F# script. That's the format we're going to use in this example. Let me explain our initial script:

* Usually in the beginning of the file, every external dependency is listed. This is how regular F# dll's are imported:

```fsharp
#r "../node_modules/fable-core/Fable.Core.dll"
```

(If we want to import another .fsx file or a regular .fs F# file we will use the `#load` command)

* Import the modules that'll be used:

```fsharp
open Fable.Import.Browser
```

This module imports the browser API, like `window` or `console`.

* Write the application code:

```fsharp
console.log("It's working!")
```

That's everything that's on a fsx file. Now let's implement the Star Wars app using Fable.

## The Spec

As a reminder, let me rewrite here the application spec:

> The spec is simple: a Star Wars character "card" appears on the left, and corresponding film "cards", representing the films of the character, are shown on the right.

> Clicking on a film "card" displays it on the left, and a list of the characters that appear in the film are shown on the right. And it goes on.

![Characters And Films](../assets/swspec.jpg)

*Characters cards will be yellow, and film cards will be blue. By clicking on a card, it changes from one screen to the other.*

## The Chosen Framework

[Fable's github page](https://github.com/fable-compiler) also houses two frameworks: [Fable Elmish](https://github.com/fable-compiler/fable-elmish) and [Fable Arch](http://fable.io/fable-arch/). Even though Elmish sounded like the one I would be more familiar with because of the previous Elm experience, I chose Arch because it has better documentation - or at least a clear list of sample apps :)

To use it, just install like any npm library:

```bash
$ npm install --save fable-arch
```

An observation: Fable documentation in general is still not great. In fact, it's close to none if we compare to Elm or to a lot of Javascript libraries and frameworks. But the samples provided are really good and helpful, and I found them the best source for learning it in the first moments.

Another thing worth mentioning: there's a [Gitter channel](https://gitter.im/fable-compiler/Fable) dedicated to Fable. I asked a couple of questions there, and were promptly answered. The people who actually make Fable and the frameworks are there, and they are really trying to help everyone!

## The Character And Film Modules

First let's write the Character and Film modules. They only contain Model and View code. Let's start with the Character model:

```fsharp
#r "../node_modules/fable-core/Fable.Core.dll"

module Character =
    type Model =
        { name: string
          films: string list }
```

That is straightforward. Only small syntax differences from Elm, like not needing a comma or writing `string list` instead of `List String`.

Now the Character view:

```fsharp
#load "../node_modules/fable-arch/Fable.Arch.Html.fs"

open Fable.Arch.Html

(...)

    let mainStyle =
        Style
            [ "background-color", "rgba(230, 126, 34,1.0)"
              "width", "200px"
              "height", "200px"
              "color", "white"
              "font-family", "-apple-system, system, sans-serif"
              "margin", "20px 0px 0px 20px"
              "cursor", "pointer" ]

    let nameStyle =
        Style
            [ "padding", "20px"
              "font-size", "18px" ]

    let view model =
        div
            [ mainStyle ; onMouseClick (fun _ -> model) ]
            [ div [ nameStyle ] [ text model.name ] ]
```

The model code is very similar to the Elm version, but there's something important to be said here: *in F#, all code should be written in compile order*. That means that if you use a function or variable in another function, that should be declared before in the file. This is different from Elm, and from Javascript (if you declare a function with the `function` keyword). It seems this is a source of some debate in the F# community, since in regular F# projects you even need to specify the order that the files should be compiled! I have no problem with it. I tend to prefer that the `view` function comes first than the style variables, but I also see that forcing things to be in order can be beneficial to the understanding of the code.

The Film module is then very similar:

 ```fsharp
 module Film =
    type Model =
        { title: string
          episodeId: int
          characters: string list }

    let mainStyle =
        Style
            [ "background-color", "rgba(52, 152, 219,1.0)"
              "width", "200px"
              "height", "200px"
              "color", "white"
              "font-family", "-apple-system, system, sans-serif"
              "margin", "20px 0px 0px 20px"
              "cursor", "pointer" ]

    let nameStyle =
        Style
            [ "padding", "20px"
              "font-size", "18px" ]

    let numberStyle =
        Style
            [ "padding", "20px 20px 0px 20px"
              "font-size", "60px" ]

    let view model =
        div
            [ mainStyle ; onMouseClick (fun _ -> model) ]
            [ div [ numberStyle ] [ text (model.episodeId.ToString()) ]
              div [ nameStyle ] [ text model.title ] ]
 ```

## The Application Model


. Json Encoders / Decoders

. Talk about type inference

. Side effects: list of callbacks

. fetch: just a JS function

. Refactoring: one Entity model (could be done in Elm)

. Simple, relatively easy, still reliable, performant
