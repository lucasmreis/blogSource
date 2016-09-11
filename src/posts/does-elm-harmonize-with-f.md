---
title: Does Elm Harmonize With F#?
lead: lkjlkjlkjlkjlkjlkjlkjlkj
template: post.hbt
date: 2016-09-09
tags: elm, fsharp, functional, event-sourcing, real-time
---

After [experimenting with Elm](http://lucasmreis.github.io/blog/learning-elm-part-1/), I was hooked. I could feel that working with a smart type system brought both *reliability*, in the sense of "it does what I wanted it to do", and *safety*, in the sense of "it does not have bugs".

Elm's main focus is the front end ([even though](https://github.com/ElmCast/elm-node) [some work](https://github.com/Fresheyeball/elm-http-server) [is being made](https://github.com/eeue56/servelm)), so a natural next question would be *how would it be using an Elm-like language in the server*? And by "Elm-like" I mean a language with immutable data structures as default, encouraging expressions over statements, and of course, having those cool discriminated unions we all learned to love. :)

After a quick research, the finalists were Haskell, Ocaml and F#. A former coworker was always saying good things about F#, and after seeing things like [FSharp.Data](http://fsharp.github.io/FSharp.Data/), [Xamarin](https://developer.xamarin.com/guides/cross-platform/fsharp/fsharp_support_overview/) and [this amazing blog](https://fsharpforfunandprofit.com/), I decided to go with F#.

## Setting Up

The first week with F# was not easy. I did not have any clue where to start since I don't have a Windows machine. So I downloaded Xamarin Studio, and used it for a couple of days. It's a good IDE with a so so editor, so I started looking for some alternative.

Every F# project needs a `*.fsproj` config file, which is a big messy XML, that is not meant to be changed by "human beings" (as opposed to the simpler `package.json` from Node or `elm-package.json` from Elm). But it turns out that the F# open source community built some nice tools to deal with it. Summing up, install the [Ionide](http://ionide.io/) extension to VS Code or Atom, and everything will be easier.

My programming workflow then became: use [Paket](https://github.com/fsprojects/Paket) to deal with the dependencies, and [Fake](http://fsharp.github.io/FAKE/) to deal with building tasks. F# has a REPL, and it's usual to have a `.fsx` script file around to send code to the REPL. Every module I wrote started in a `.fsx` file, and when I was happy with the results I would copy the code to a regular `.fs` file. I do not know if it's the ideal workflow, but it worked well!

With F# up and running, I decided to implement a simple project to learn the language.

## The Project

My wife was a girl scout when she was a kid. She told me that there's a famous girl scout activity in the US which is selling cookies door to door to neighbours. I foud that extremely cute, and decided on implementing a girl scout cookie selling dashboard! :)

The requirements are: each scout somehow send commands like "Visit House" or "Sell 5 Cookies" to the server. The server validates the command, and broadcast events like "Maggie Just Visited A House" or "Lisa Just Sold 5 Cookies" to the dashboards, that are updated in realtime and consolidate all the information.

## The Domain Model

Each scout can be modelled as a "state machine". This is where these type systems really shine. F#, like Elm, has union types and pattern matching, so the code was pretty similar. For instance:

```fsharp
type ScoutState =
    | Walking
    | Visiting
    | HavingFun

type ScoutCommand =
    | StartDay
    | VisitHouse
    | Sell of int
    | HaveFun

type ScoutEvent =
    | DayStarted
    | HouseVisited
    | Sold of int
    | DayFinished

type ScoutError =
    | ShouldBeHavingFun
    | ShouldBeWalking
    | ShouldBeVisiting
```

A word about Commands and Events: when programming in Elm, "everything" that happened in the application was called a Message. The Update function understands the Messages, updates the state accordingly, and then emit or not new Messages.

When reading about F#, I came accross lots of reading materials on Domain Driven Design (DDD), Event Sourcing and Command Query Responsibility Segregation (CQRS). One of the nice ideas I've read is the separation between Commands and Events among the Messages.

Everytime a user wants to change the domain, it issues a Command. If the Command actually changes the domain, an Event is generated. And Event represents things that actually happened to the domain. For example, if a scout issues a Command `Sell 3`, the server checks if it's a valid Command for the actual State, and if it's ok it issues an Event `Sold 3`. If it's not valid, let's say the scout was not visiting any house, it returns a `ShouldBeVisiting` error, and the State is not updated.

The cool part is that we can store all the Events, and query it at will. The present State is a replay of all the past Events! That's what Event Sourcing is all about, and I really recommend watching [every video you can](https://www.youtube.com/watch?v=8JKjvY4etTY) [from Greg Young](https://www.youtube.com/watch?v=kZL41SMXWdM), [the "father" of the Event Sourcing pattern](https://www.youtube.com/watch?v=LDW0QWie21s).

With that in mind, this is the final state machine representation of the scouts:

-- PICTURE --

[The final code for the domain is here](https://github.com/lucasmreis/AmazingCookies/blob/master/src/Domain/Domain.fs).

## A Simple Event Store

The events produced by the server will need to be stored somewhere. To continue the learning experience, I decided to implement the simplest in-memory event store I could think of. It should be able to store every event, and also broadcast them to listeners, and that's it.

Since the store actually stores data, and this data is accessed through methods, I thought that modelling the store as an *object* would be ok. Yes, it's an object of the kind we try to escape with functional programming, but it still has it uses :)

It was also good to see that "object oriented programming" with F# is very simple, and has almost no boilerplate. You just declare a type with `()` near the name, and declare "members" of the type. For instance:

```fsharp
type EventStore() =
    let eventList =
        new ResizeArray<String * ScoutEvent>()

    member this.Save(name, events) =
        events |> List.iter (fun e -> eventList.Add(name, e))

    member this.Get() =
        eventList
```

When instanced with `let store = new EventStore()`, this object creates an array of `String * ScoutEvent` tuples. This will hold all the events produced by the application, together with the scout's name that produced the event.

F# has a very interesting feature called *computation expressions*. [The docs]() describe it as *a convenient syntax for writing computations that can be sequenced and combined using control flow constructs and bindings*. I do not know an easier way to describe it, so let me show two examples, `async` and `seq`:

```fsharp
// this works just like Javascript's async/await,
// or Clojure's core.async
let asyncFetchedDocument = async {
    let url = "http://some-url.com/api"

    // this line will wait for the response without blocking the thread
    let! res = someAsyncFetchFunction url

    return res.data }

let fetchedDocument =
    Async.RunSynchronously asyncFetchedDocument

// this produces a lazy sequence
let lazySeq = seq {
    for i in 1 .. 5 do
      if (i % 2 = 0) then
        yield i
        yield -i }

let list =
    Seq.toList lazySeq
// => [2; -2; 4; -4]

```

I used a `query` computation expression to get all the events from a given name in the EventStore:

```fsharp
...

member this.Get(name) =
    query {
        for (n, ev) in eventList do
        where (n = name)
        select ev
    } |> Seq.toList

...
```

That's really cool, right? Feels like strong typed SQL :) I feel that Elm would strongly benefit from something like it.

So, to finish the EventStore, I needed a pub/sub to the saved events:

```fsharp
...

  let saveEvent =
      new Event<'Key * 'Event>()

  member this.SaveEvent =
      saveEvent.Publish

  member this.Save(name, events) =
      events |> List.iter (fun e -> eventList.Add(name, e))
      events |> List.iter (fun e -> saveEvent.Trigger((name, e)))

...
```

The events will be published at `SaveEvent`, and saving an event will trigger the listeners. An example subscription would be:

```fsharp

let logger ev = printfn "-- EVENT: %A" ev

store.SaveEvent.Add(logger)

```

[The complete EventStore, with generic typing, is here](https://github.com/lucasmreis/AmazingCookies/blob/master/src/EventStore/EventStore.fs).
