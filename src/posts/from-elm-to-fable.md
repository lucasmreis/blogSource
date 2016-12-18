---
title: From Elm To Fable
lead: Trying F# In The Frontend
template: post.hbt
date: 2016-12-10
tags: functional, types, elm, fsharp
---

Some months ago I started a [quest to gain reliability in frontend development](http://lucasmreis.github.io/blog/learning-elm-part-1/). I chose Elm as the starting point, from this list:

1. Plain Javascript
2. Facebook Flow
3. TypeScript
4. PureScript
5. Elm

This was a ranking from "not reliable" to "reliable" frontend languages, mainly taking *types* into consideration. After programming with Elm a bit (and fidindg it awesome :) ), I started looking for [other languages with similar characteristics](http://lucasmreis.github.io/blog/does-elm-harmonize-with-f/#/). That was the time I found F#, and I'm really impressed by it.

It turns out that there's a F# to JS compiler called [Fable](http://fable.io/). In the ranking, it would be between Typescript and Purescript. It trades a bit of the "safety" for an easier Javascript interop.

In this post I'll "convert" the [star wars app I wrote in Elm](http://lucasmreis.github.io/blog/learning-elm-part-3/) to Fable, then I'll refactor it. Along the way, I'll compare the experience to both Elm and regular Javascript workflow.

For this post, I'll presume some familiarity with Elm or other ML languages, mainly that you understand how *discriminated unions* and *pattern matching* work. I wrote about the subject in [part one of the Learning Elm series](http://lucasmreis.github.io/blog/learning-elm-part-1/). Scott Wlaschin has probably the best blog on typed functional programming, and has written a [great article on F# discriminated unions](https://fsharpforfunandprofit.com/posts/discriminated-unions/).

Let's start!

## Starting A New Fable Project

Elm is very "beginner friendly" - it is the focus of that project since the beginning. This makes it very easy to just start playing with the language, be it with [Try Elm online](http://elm-lang.org/try) or using [Elm Reactor](https://github.com/elm-lang/elm-reactor) locally. Fable works more like a regular Javascript transpiler; so we need to do the initial pumbling, and then run our project through a local server.

Fortunately, it's simple. This is what I did: first I wrote an index.html file that imports a `build/bundle.js` script:

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

Then I globally installed the Fable compiler, and locally installed the `fable-core` and `fable-compiler` packages in the project:

```bash
$ npm install -g fable-compiler
$ npm init
$ npm install --save fable-core fable-compiler
```

Before writing the first F# file, please install the [Ionide extension](http://ionide.io/) to VS Code or Atom. It is very powerful, and makes the developing experience very pleasurable. The compiler realtime help is even *better* than Elm's! I'll talk more about this is the conclusion.

Now we can write a F# file, let's say in `src/Main.fsx`:

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

The `Main.fsx` file is a F# script. That's the format we're going to use in this project. Let me explain our initial script:

* Usually in the beginning of the file, the external dependencies are listed. This is how regular F# dll's are imported:

```fsharp
#r "../node_modules/fable-core/Fable.Core.dll"
```

(If we want to import another .fsx file or a regular .fs F# file we will use the `#load` command)

* Then import the modules that'll be used:

```fsharp
open Fable.Import.Browser
```

This module imports the browser API, like `window` or `console`.

* Now you can write the application code:

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

To use it, just install it like any npm library:

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

## The Application Model And View 

Let's now define the application model:

```fsharp
type Model =
    | InitialScreen
    | LoadingFilms of Character.Model
    | LoadingCharacters of Film.Model
    | FilmsFromCharacter of Character.Model * Film.Model list
    | CharactersFromFilm of Film.Model * Character.Model list
    | ErrorScreen
```

The application model is a discriminated union, and I just adapted the syntax from the original Elm version. 

Let's convert the views one by one. First `InitialScreen`:

```fsharp
let messageStyle =
    Style
        [ "margin", "20px 0px 0px 20px"
          "width", "200px"
          "height", "200px"
          "font-family", "-apple-system, system, sans-serif"
          "color", "rgba(149, 165, 166,1.0)"
          "font-size", "18px" ]

let messageView t =
    div [ messageStyle ] [ text t ]

let view model =
    match model with
    | InitialScreen ->
        messageView "Loading amazing characters and films..."

    | _ -> 
        div [] []
```

To render the view, we need to call the run `createApp`. That's a little different from Elm's `Program`:

```fsharp
#load "../node_modules/fable-arch/Fable.Arch.App.fs"
#load "../node_modules/fable-arch/Fable.Arch.Virtualdom.fs"

(...)

open Fable.Arch
open Fable.Arch.App.AppApi

(...)

let update model msg = model , []

let initialModel = InitialScreen

createApp initialModel view update Virtualdom.createRender
|> withStartNodeSelector "#app"
|> start
```

`createApp` is direct: it needs an initial model, a view function, an update function, and a *renderer*. The renderer is the engine which will render your application view to the browser dom. Currently we can only use `virtual-dom`, which is a very fast and mature library, but it seems that [they are planning on having a React renderer too](https://github.com/fable-compiler/fable-arch/issues/33).

We need to install `virtual-dom` in our project:

```bash
$ npm install --save virtual-dom
```

Everything is looking good, right? But try compiling it. It doesn't, and outputs the error:

```bash
▶ fable src/Main.fsx --outDir build --rollup
fable-compiler 0.7.17: Start compilation...
Compiled fable-arch/Fable.Arch.Html.js at 11:35:51 PM
Compiled fable-arch/Fable.Arch.App.js at 11:35:51 PM
Compiled fable-arch/Fable.Arch.Virtualdom.js at 11:35:51 PM
Compiled src/Main.js at 11:35:51 PM
Bundling...
[BUNDLE ERROR] 'h' is not exported by node_modules/virtual-dom/index.js (imported by build/fable-arch/Fable.Arch.Virtualdom.js). For help fixing this error see https://github.com/rollup/rollup/wiki/Troubleshooting#name-is-not-exported-by-module
(...)
```

We're using Rollup to bundle the files. It turns out that Rollup works well with ES6 modules, but may break when using regular CommonJS modules. Since some libraries are written using CommonJS, we need to deal with these cases properly.

We need to configure Rollup to see the `virtual-dom` module and it's exported functions, so let me introduce you to the `fableconfig.json` file.

Instead of calling `fable src/Main.fsx --outDir ./build --rollup` every time, we can put the compiling configuration inside `fableconfig.json`. For example, if we have this config:

```json
{
  "outDir": "build",
  "projFile": "./src/Main.fsx",
  "sourceMaps": true
}
```

We can just run `fable`  or `fable --watch` in the terminal and get the same output plus a sourcemap.

Now we can add the Rollup CommonJS configuration:

```json
{
  "outDir": "build",
  "projFile": "./src/Main.fsx",
  "sourceMaps": true,
  "rollup": {
    "plugins": [
      ["commonjs", {
        "namedExports": {
          "virtual-dom": [ "h", "create", "diff", "patch" ]
        }
      }]
    ]
  }
}
```

This step is a small complication in our build system. It's definitely more complex than anything related to an Elm project build, but, on the other hand, it's the effect of using a very good and used *Javascript* tool. Efficient bundles are a central an important issue in frontend projects, and since we cannot escape from it, I actually like that we are using a good tool for that.

## Messages And The Rest Of The Views

Before building the other views, let's define the application Messages. As a reminder: a message is a description of a user action or an event that happens in the application. It is a model of the state *transitions*. Converting the original messages we have:

```fsharp
type Msg =
    | LoadCharacters of Film.Model
    | ToCharactersFromFilm of Film.Model * Character.Model list
    | LoadFilms of Character.Model
    | ToFilmsFromCharacter of Character.Model * Film.Model list
    | FetchFail
```

Now let's write one more case for the main view function: 

```fsharp
let view model =
    match model with
    | InitialScreen ->
        messageView "Loading amazing characters and films..."

    | LoadingFilms ch ->
        div [ Style [ "display", "flex" ] ]
            [ Character.view ch
              messageView ("Loading " + ch.name + " films...") ]
```

`LoadingFilms` shows one character and is waiting for the related films to load. If you hover on the `view` function declaration - or if you are using Ionide it's already showing - you'll see that the function type signature is:

```fsharp
Model -> DomNode<Character.Model>
```

That means that `view` is a function that receives a Model and sends messages of type `Character.Model`. This occurs because of the attribute `onMouseClick (fun _ -> model)` we wrote in the `Character.view` that we are calling in this function.

The thing is, we want to send messages of the type `Msg` we just defined. An error occurs if we add the `FilmsFromCharacter` case, that calls `Film.view`:

```fsharp
(...)

    | FilmsFromCharacter (ch, fs) ->
        let filmsView = List.map Film.view fs
        div [ Style [ "display", "flex" ] ]
            [ Character.view ch
              div [] filmsView ]
```

```bash
$ fable
[ERROR] F# project contains errors:
Type mismatch. Expecting a
    'DomNode<Character.Model> list'    
but given a
    'DomNode<Film.Model> list'    
The type 'Character.Model' does not match the type 'Film.Model'
```

So, `Film.view` send messages of type `Film.Model` and that is not compatible with `Character.Model` which was the message being sent by the function before we wrote the case. This is a great example of the power of F#'s type inference. I don't know if you noticed, but we did not write any type signature so far :) It's rarely needed in F#, and I still feel the same type power and safety that I felt in Elm. 

To make sure that our main `view` only produces messages of type `Msg`, we need to *map* both the Character's and Film's `view` functions to produce it:

```fsharp
let mappedCharacterView model =
    let characterView = Character.view model
    Html.map LoadFilms characterView

let mappedFilmView model =
    let filmView = Film.view model
    Html.map LoadCharacters filmView
```

Now, just for fun, let's refactor `mappedCharacterView`. First of all, we can identify a *pipeline* there: we transform our model with the `view` function and then we map it to `LoadFilms` message. That translates directly to code:

```fsharp
let mappedCharacterView model =
    model
    |> Character.view
    |> Html.map LoadFilms
```

Which is already simple and clear. There's another F# operator, the `>>`. It composes two functions into another one, in the same order as `|>`. The next rewrite has the same behavior:

```fsharp
let mappedCharacterView model =
    let transform = Character.view >> Html.map LoadFilms
    transform model
```

When I see a function like that, I immediately think that `model` and `transform` are temporary variables that do not add a lot to readability. So I think this is a nice case where a [point free function]() is simple:

```fsharp
let mappedCharacterView =
    Character.view >> Html.map LoadFilms

let mappedFilmView =
    Film.view >> Html.map LoadCharacters
```

And now we can convert all the views of the application:

```fsharp
let view model =
    match model with
    | InitialScreen ->
        messageView "Loading amazing characters and films..."

    | LoadingFilms ch ->
        div [ Style [ "display", "flex" ] ]
            [ mappedCharacterView ch
              messageView ("Loading " + ch.name + " films...") ]

    | FilmsFromCharacter (ch, fs) ->
        let filmsView = List.map mappedFilmView fs
        div [ Style [ "display", "flex" ] ]
            [ mappedCharacterView ch
              div [] filmsView ]

    | LoadingCharacters f ->
        div [ Style [ "display", "flex" ] ]
            [ mappedFilmView f
              messageView ("Loading " + f.title + " characters...") ]

    | CharactersFromFilm (f, chs) ->
        let chsView = List.map mappedCharacterView chs
        div [ Style [ "display", "flex" ] ]
            [ mappedFilmView f
              div [] chsView ]

    | ErrorScreen ->
        messageView "An error ocurred. Please refresh the page and try again - and may the Force be with you!"
```

The syntax is very clean. I like not having to use commas when changing lines, and don't mind the occasional parenthesis. I love Elm Format and how it formats your code automatically - F# doesn't have it, but I don't feel a loose a lot of time with code formatting to get a good look and feel.

Now we can try the views with "mock" application states, for instance:

```fsharp
let char:Character.Model =
    { name = "Luke Skywalker" ; films = [] }

let film:Film.Model =
    { title = "A New Hope" ; episodeId = 4 ; characters = [] }

let initialModel =
    FilmsFromCharacter ( char , [ film ; film ; film ] )
```

Run `fable && http-server` and reload the browser, and there you see it!

## The Update Function And Async Work

Fable Arch resembles Elm in the sense that the `update` function returns a new model and a list of "actions". Actions are functions that receive a `handler` callback parameter; `handler` is a function that receives a `Msg` and feeds it back to the update function.

Let's start with the initial work of the application: getting a character from the API, and transitioning from `Initial Screen` to `LoadingFilms of Character.Model`. 

We'll get the entities from the [Star Wars API](https://swapi.co/), so we need to use the browser fetch function. There's a library called [fable-powerpack](https://github.com/fable-compiler/fable-powerpack) that makes it easier to use both fetch and promises with fable:

```bash
$ npm install --save fable-powerpack
```

And then we can use in our project:

```fsharp
#r "../node_modules/fable-powerpack/Fable.PowerPack.dll"

(...)

open Fable.PowerPack
open Fable.PowerPack.Fetch

(...)

let fetchEntity url =
    promise {
        let! fetched = fetch url []
        let! response = fetched.text()
        return response }

```

`promise { ... }` is a F# *computation expression*. There's nothing like it in Elm - it's kind of a ES6 generator, or ES7 async/await. Inside the promise block, code is written sequentially, but runs asynchronously. If you define a promise variable using `let!`, it will wait for the promise to resolve *without blocking the thread*, and then continue running the code. The code above could be loosely translated to Javascript as:

```js
// using promises:
const fetchEntity = url => fetch(url, {}).then(r => r.text())

// using async/await:
const fetchEntity = url => {
  const fetched = await fetch(url, {})
  const response = await fetched.text()
  return response
}
```

The only difference is that promises runs as soon as they are defined, and computation expression run only when they are actually used. I find it to be better behaviour, and more compatible with the more "famous" F#'s `async { ... }`.

The inferred type is `string -> Promise<string>`, but we want the function to return either a Character or a Film model. So we need a `string -> Character.Model` and a `string -> Film.Model` parse functions. So, inside the Film module:

```fsharp
open Fable.Core.JsInterop

(...)

module Film =
    type Model =
        { title: string
          episodeId: int
          characters: string list }

    type ModelJSON =
        { title: string
          episode_id: int
          characters: string list }

    let parse str =
        let obj = ofJson<ModelJSON> str
        { title = obj.title
          episodeId = obj.episode_id
          characters = obj.characters }

    (...)
```

I created a record type for the json, so I could use the function `ofJson<'a>` to convert a string by finding the json keys that are equivalent to `'a` keys. Then it just builds a regular `Film.Model` with the result.

This function has the signature `string -> Film.Model`, but, if there's any error in the process, it *raises an exception*. I'm not an exception fan (it's not explicit in the type signature!), but it'll work here because we'll put it inside a promise computation expression, and it will behave just like in Javascript: it will *reject*, and we'll treat it in a `Promise.catch` expression.

The Character module ended up being much simpler:

```fsharp
module Character =

    (...)
    
    let parse = ofJson<Model>
```

Since `Model` already mirrors the json schema of the API :)

We can now change our `fetchEntity` function to receive a parser:

```fsharp
let fetchEntity url parser =
    promise {
        let! fetched = fetch url []
        let! response = fetched.text()
        return response |> parser }
```

And we can write the `getFirstCharacter` function that fetches the first character of the application:

```fsharp
let getFirstCharacter handler =
    fetchEntity "http://swapi.co/api/people/1/" Character.parse
    |> Promise.map LoadFilms
    |> Promise.catch ( fun _ -> FetchFail )
    |> Promise.map handler
    |> ignore
```

It receives `handler` as a parameter, which is a function that will receive a `Msg` and feed it back to the appication. `ignore` is just a function that returns `unit`, which is F#'s "void". 

The handler is receiving both `LoadFilms` and `FetchFail` messages, so let's implement an initial update function that changes the application state properly, and also call `getCharacter` in `createApp`:

```fsharp
let update model msg =
    match msg with
    | LoadFilms ch -> LoadingFilms ch , []
    | FetchFail -> ErrorScreen , []
    | _ -> model , []

(...)

createApp InitialScreen view update Virtualdom.createRender
|> withStartNodeSelector "#app"
|> withInitMessage getFirstCharacter
|> start
```

If we run the application, we'll be able to see the initial screen transitioning to the next screen with real info from the API!

Now the last two functions: `getCharacters` and `getFilms`, that get all the related entities of a character or a film:

```fsharp
let getCharacters (film: Film.Model) handler =
    film.characters
    |> List.map ( fun url -> fetchEntity url Character.parse )
    |> Promise.Parallel
    |> Promise.map ( fun chs -> ToCharactersFromFilm (film, List.ofArray chs) )
    |> Promise.catch ( fun _ -> FetchFail )
    |> Promise.map handler
    |> ignore
```

This function fetchs all the entities in parallel, wait for all the promises to resolve, build a `ToCharactersFromFilm` message and calls `handler`.

`getFilms` is almost mirrored:

```fsharp
let getFilms (character: Character.Model) handler =
    character.films
    |> List.map ( fun url -> fetchEntity url Film.parse )
    |> Promise.Parallel
    |> Promise.map ( fun fs -> ToFilmsFromCharacter (character, List.ofArray fs) )
    |> Promise.catch ( fun _ -> FetchFail )
    |> Promise.map handler
    |> ignore
```

Now we finish our update (notice the side effects listed!):

```fsharp
let update model msg =
    match msg with
    | LoadCharacters f ->
        LoadingCharacters f , [ getCharacters f ]

    | ToCharactersFromFilm ( f , chs ) ->
        CharactersFromFilm ( f , chs ), []

    | LoadFilms ch ->
        LoadingFilms ch , [ getFilms ch ]

    | ToFilmsFromCharacter ( ch , fs ) ->
        FilmsFromCharacter ( ch , fs ), []

    | FetchFail ->
        ErrorScreen , []
```

And that's it - the application is done, and running without any error. That's the sensation you have only with a good compiled language: code running and working at the same time, from the beginning.

The complete application [can be found here](https://github.com/lucasmreis/star-wars-fable/blob/master/src/MainFirst.fsx).

## Bonus: Refactoring! 

There's one thing that I really don't like in this solution: the amount of "almost duplicate" code related to Characters and Films. I feel I'm writing everything twice. I think it came from thinking that Character and Film should be separate modules, and I could not figure out at the time a way to have "generic" modules or something of the sort. So I'll try now to make it better, and find a better abstraction for Character and Film that does not result in "almost duplicate" code.

I'll start by defining the models of the entities:

```fsharp
type Url = string

type Details =
    | Character of name: string
    | Film of title: string * episode: string

type Entity =
    { related : Url list
      details : Details }
```

An entity have a generic list of related entities, and a `Details` property that holds the actual characteristics of a film or a character. Now that we have a generic entity type, we can simplify the application model:

```fsharp
type Model =
    | InitialScreen
    | Loading of Entity
    | List of Entity * Entity list
    | ErrorScreen
```

And we can parse the json using the function:

```fsharp
type CharacterResponseJson =
    { name : string
      films : string list }

type FilmResponseJson =
    { title : string
      episode_id : int
      characters : string list }

let [<PassGenericsAttribute>] betterOfJson<'a> text =
    try
        let json = ofJson<'a> text
        Some json
    with _ ->
        None

let parse text =
    let chRecord = betterOfJson<CharacterResponseJson> text
    let filmRecord = betterOfJson<FilmResponseJson> text
    match chRecord , filmRecord with
    | Some ch , _ ->
        { related = ch.films
          details = Character ch.name }
    | _ , Some film ->
        { related = film.characters
          details = Film ( film.title , film.episode_id.ToString() ) }
    | _ ->
        failwith "could not parse entity"
```

Let's pause a little to understand this function. First I created the record types that reflect the information I'm looking for in the API's json schema. Then I created a function called `betterOfJson` which is just `ofJson` returning an `option`. We have to use the `[<PassGenericsAttribute>]` so this function works properly when transpiled to Javascript. No need to worry how it works - the compiler tells you where you need to use it! :)

After that, the parse function is defined. It raises an exception if there's an error; what, again, I really do not like since it works as a "hidden output". But we're going to use it inside a Promise, so it's not that bad.

Trying to make this function better, I learned another really amazing F# feature: *Partial Active Patterns*. I wanted to to have this function written somewhat like this:

```fsharp
let parse text =
    match text with
    | IsCharacter ch -> ...
    | IsFilm film -> ...
    | _ -> failwith "could not parse entity"
```

It turns out that there's a simple way to achieve that:

```fsharp
let (|IsCharacter|_|) text =
    betterOfJson<CharacterResponseJson> text

let (|IsFilm|_|) text =
    betterOfJson<FilmResponseJson> text
```

To build a Partial Active Pattern, you have to write a function that returns an `option`, and has this `(|PatternMatchCase|_|)` definition. Now you can use both `IsCharacter` and `IsFilm` in a pattern match:

```fsharp
let parse text =
    match text with
    | IsCharacter ch ->
        { related = ch.films
          details = Character ch.name }
    | IsFilm film ->
        { related = film.characters
          details = Film ( film.title , film.episode_id.ToString() ) }
    | _ ->
        failwith "could not parse entity"
```

Much simpler. This is another feature of F# that makes it stand out.

Ok, but I'm still not happy with an "exception-throwing" function. If someone knows a better way to deal with JSON parsing, please say it in the comment section!

Next, let's deal with the application update part. The messages can be simplified too:

```fsharp
type Msg
    = Load of Entity
    | ToList of Entity * Entity list
    | FetchFail
```

`getFirstCharacter` is very similar:

```fsharp
let fetchEntity (url:Url) =
    promise {
        let! fetched = fetch url []
        let! response = fetched.text()
        return parse response }

let getFirstCharacter handler =
    fetchEntity "http://swapi.co/api/people/2/"
    |> Promise.map Load
    |> Promise.catch ( fun _ -> FetchFail )
    |> Promise.map handler
    |> ignore
```

And now we only need one `getRelatedEntities` instead of `getCharacters` and `getFilms`:

```fsharp
let getRelatedEntities (entity:Entity) handler =
    List.map fetchEntity entity.related
    |> Promise.Parallel
    |> Promise.map ( fun list -> ToList ( entity , List.ofArray list ) )
    |> Promise.catch ( fun _ -> FetchFail )
    |> Promise.map handler
    |> ignore
```

And our `update` function got much simpler:

```fsharp
let update model msg =
    match msg with
    | Load entity -> Loading entity , [ getRelatedEntities entity ]
    | ToList ( entity , list ) -> List ( entity , list ) , []
    | FetchFail -> ErrorScreen , []
```

From this point on, we only need to implement the view functions. This is the final `view` function (`messageView` and `entityView` were ommited for brevity, but [can be found here](https://github.com/lucasmreis/star-wars-fable/blob/master/src/Main.fsx#L94)):

```fsharp
let view model =
    match model with
    | InitialScreen ->
        messageView "Loading amazing characters and films..."

    | Loading entity ->
        div [ Style [ "display", "flex" ] ]
            [ mappedEntityView entity ; loadingMessageView entity ]

    | List ( entity , list ) ->
        let listView = List.map mappedEntityView list
        div [ Style [ "display", "flex" ] ]
            [ mappedEntityView entity ; div [] listView ]

    | ErrorScreen ->
        messageView "An error ocurred. Please refresh the page and try again - and may the Force be with you!"
```

Much simpler, right? It's always a pleasure to refactor code using an ML language :)

## Conclusions

This is it - we have a completely refactored working version of the Star Wars app. [The complete code is here](https://github.com/lucasmreis/star-wars-fable), and [the working app is here](https://lucasmreis.github.io/star-wars-fable/).

[I compared Elm and F# before](http://lucasmreis.github.io/blog/does-elm-harmonize-with-f/#final-conclusions), and this post is an experiment on comparing both *in the same domain*, which is frontend web programming. On these terms, these some random thoughts:

* Elm is much friendlier to beginners. It has one way to do almost everything, so there's not much decisions to do when implementing something - it has more of a "puzzle" feel to it. Also, tools like [Try Elm](http://elm-lang.org/try) and [Elm Reactor](https://github.com/elm-lang/elm-reactor) make it very simple and fast to just start coding and experimenting with the language.
* On the other hand, Fable does not hide from you the fact that it's going to compile to Javascript, and because of that, you have a lot of freedom. For instance, I could right away make the requests parallel, because promises work just like in JS. In Elm, there was [simply no default way of doing it](http://lucasmreis.github.io/blog/learning-elm-part-3/#almost-finishing-our-application-).
* F#'s *computation expressions* and *partial active patterns* are really powerful, and make code more readable and elegant. Actually, it also makes it *simpler*. There's nothing like it in Elm.
* F#, when used with the Ionide VS Code plugin, is probably the best coding experience I've had. Elm comes close (and `elm-format` is great), but hovering in any variable to understand what it is in realtime is an amazing experience. And the types code lenses are really useful too.

## Next Steps

I enjoyed the Fable experimentation. I'll continue to look at it, and probably try something with more JS interop to understand better how it would behave in a more real world scenario.

Elm still seems the sensible solution if you have a team of people that are *learning* functional programming. Elm has a lighter cognitive load, since there's almost only one way of doing it, and the defaults are very good, making it a great learning tool too. 

But I can see a team wanting to have more freedom, and Fable seems like a really good tool that offers it, while still maintaining most of the safety and power from an ML language. 










