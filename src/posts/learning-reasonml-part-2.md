---
title: Learning ReasonML, part 2
lead: Integating ReasonML Into a React Application
template: post.hbt
date: 2018-01-18
tags: functional, types, reason, reasonml
---

When learning a new language, it's great to have the opportunity to write a small module and be able to integrate it with a real world application. Fortunately, one of the main objectives of the ReasonML team is smooth JS integration, so let's see if it delivers!

## The Project

Let's start with an existing React application. [Here's the code](https://github.com/lucasmreis/learning-reasonml/tree/master/part-2), and [here's the working app](https://simple-deck-example.netlify.com/). The app "creates" a deck of cards using [this great open API](http://deckofcardsapi.com/), and then, the user can draw three cards at a time using a button. The cards are drawn face down, and turn face up when clicked.

This project is interesting because it has some key real world features: global and local state handling, and remote data fetching both on startup and user interaction. In this post I'll integrate ReasonML code in three different ways: first with a function (the one we [wrote in the first part of this series](http://lucasmreis.github.io/blog/learning-reasonml-part-1/)), then with a stateless React component, and finally with a stateful React component.

## Having ReasonML Files In A JS Project

We want our workflow to be as simple as possible. I like the idea of creating `.re` files throughout the project where I need them, and automatically compiling them to `.bs.js` files in the same location. To achieve that, let's first install `bs-platform` to [our react application](https://github.com/lucasmreis/learning-reasonml/tree/master/part-2) with npm:


```
$ npm install --save-dev bs-platform
```

Then we create `bsconfig.json` in the root folder:

```json
{
  "name": "simple-deck",
  "version": "0.1.0",
  "sources": [
    {
      "dir": "src",
      "subdirs": true
    }
  ],
  "package-specs": {
    "module": "es6",
    "in-source": true
  },
  "suffix": ".bs.js",
  "bs-dependencies": [],
  "namespace": true,
  "refmt": 3
}
```

In this file we're saying that we should compile every file in the `src` folder and subfolders. Also, since our project is a [Create React App](https://github.com/facebook/create-react-app) project that uses webpack for bundling, we're compiling to ES6 modules. I found that the official documentation [has a good section on the config file](https://bucklescript.github.io/docs/en/build-configuration.html).

Now we only need to update the npm scripts to take ReasonML into account:

```js
(...)

"scripts": {
    "start:reason": "bsb -make-world -w",
    "build": "bsb -make-world && react-scripts build",

(...)
```

Open two terminals, run `npm start` in one of them and `npm run start:reason` in the other one, and we're ready to start writing ReasonML in our React project!

## Integrating A Function

First, let's look at the structure of the application:

* The app follows CRA initial structure: all application code is inside the `src` folder, and the React setup is in the `index.js` file.
* `App.js` is the main container; it fetches data from the deck API, stores it, and exposes a `draw` action that fetches three new cards:

```js
// State shape:
// { status: 'CREATING_DECK' }
// { status: 'WAITING_FOR_USER', deckId, cards: [{ image, code }], remaining }
// { status: 'DRAWING_CARDS', deckId, cards, remaining }
// { status: 'FINISHED', cards }
// { status: 'ERROR' }

class App extends Component {
  state = { status: "CREATING_DECK" };

  componentDidMount() {
    // fetch a new deck of cards
    // if success, set state to WAITING_FOR_USER
    // else set state to ERROR
  }

  draw = async () => {
    // set state to DRAWING_CARDS
    // fetch three new cards
    // if success, set state to:
    // - WAITING_FOR_USER if there are still remaining cards in the deck
    // - FINISHED if there are not
    // else set state to ERROR
  };

  render() {
    // render action button that triggers the draw action on click
    // render collection of Card components
  }
}
```

* The Card component is defined in the `components/Card/index.js` file:

```js
import React from "react";
import "./Card.css";

class Card extends React.Component {
  state = {
    flipped: true
  };

  flip = () => {
    this.setState({ flipped: !this.state.flipped });
  };

  render() {
    const { code, imageSource } = this.props;
    const flippedClass = this.state.flipped ? "Card flipped" : "Card";
    return (
      <div className={flippedClass} onClick={this.flip}>
        <div className="Card front">
          <img alt={code} src={imageSource} />
        </div>
        <div className="Card back" />
      </div>
    );
  }
}

export { Card };
```

Each card has a `flipped` boolean state that is initialized as true. The card is rendered either in a flipped state or normal state using CSS classes. `flipped` changes when the user clicks the card. Simple, direct React code.

An initial, super low risk place to integrate ReasonML could be the image's alt attribute. `code` is a value returned from the Deck API, that looks like "6C", "QH" or "AD". In [part 1 of our series](http://lucasmreis.github.io/blog/learning-reasonml-part-1/) we implemented a function that transforms a string like this into a complete "Six of Clubs" or "Queen of Hearts", so let's use it!

Create a `ParseAndRenderCard.re` file in the same folder as the Card component, and copy and paste the code into it. If Bucklescript is setup correctly and running, you should already be seeing a `ParseAndRenderCard.bs.js` file in the same folder (I'm a little bit scared with how fast this compiler is, hehe). I added this to the end of the file to be able to export the function:

```js
(...)

let parseAndRender = cardStr =>
  cardStr
  |> Parser.parseCard
  |> Option.map(RenderToString.renderCard)
  |> Option.withDefault(RenderToString.defaultErrorCard);
```

And we can see that the end of the compiled file looks something like this:

```js
(...)

function parseAndRender(cardStr) {
  return withDefault(defaultErrorCard, map(renderCard, parseCard(cardStr)));
}

export {
  Parser         ,
  RenderToString ,
  Option         ,
  parseAndRender ,
}
```

`parseAndRender` was exactly what we needed. Now, on the `Card/index.js` file, import the function and use it:

```js
import { parseAndRender } from "./ParseAndRenderCard.bs";

(...)

render() {
  (...)

    <img alt={parseAndRender(code)} src={imageSource} />

  (...)
}
```

And we're done! That's it, we added a ReasonML function to our JS app, in three simple steps:

1. Install and setup the Bucklescript/ReasonML compiler
2. Write a ReasonML function in `.re` files alongside your js files, and let the compiler generate the `.js` files
3. Import the generated JS function into your code

ML languages like ReasonML are great for writing intricate logic, so I think that writing functions in them and importing to your React project can already bring benefits. But let's take it a step further and write a whole stateless component in ReasonML.

The final code for the project with a ReasonML function integration [can be found here](https://github.com/lucasmreis/learning-reasonml/tree/integrating_function/part-2).

## Integrating A Stateless Component

Now let's create a React component using ReasonML. As always, let's start simple - I think a stateless component is a good opportunity for that. First of all, we need to refactor our Card component - let's use the Container / View pattern [described in this blog post](http://lucasmreis.github.io/blog/simple-react-patterns/). Remember the card component:

```js
class Card extends React.Component {
  state = {
    flipped: true
  };

  flip = () => {
    this.setState({ flipped: !this.state.flipped });
  };

  render() {
    const { code, imageSource } = this.props;
    const flippedClass = this.state.flipped ? "Card flipped" : "Card";
    return (
      <div className={flippedClass} onClick={this.flip}>
        <div className="Card front">
          <img alt={parseAndRender(code)} src={imageSource} />
        </div>
        <div className="Card back" />
      </div>
    );
  }
}
``` 

The refactor is straightforward:

```js
const CardView = ({ code, imageSource, flipped, onClick }) => (
  <div className={flipped ? "Card flipped" : "Card"} onClick={onClick}>
    <div className="Card front">
      <img alt={parseAndRender(code)} src={imageSource} />
    </div>
    <div className="Card back" />
  </div>
);

class Card extends React.Component {
  state = {
    flipped: true
  };

  flip = () => {
    this.setState({ flipped: !this.state.flipped });
  };

  render() {
    const { code, imageSource } = this.props;
    return (
      <CardView
        code={code}
        imageSource={imageSource}
        flipped={this.state.flipped}
        onClick={this.flip}
      />
    );
  }
}
```

We're going to rewrite the CardView component. We're going to use the [ReasonReact](https://reasonml.github.io/reason-react/) wrapper from React, which is the current standard way of writing React in ReasonML. After `npm install --save reason-react`, change the `bsconfig.json` file to include these two properties:

```js
{
  (...) 

  "reason": { "react-jsx": 2 },
  "bs-dependencies": ["reason-react"],

  (...)
}
```

Now we're ready to start coding. Create a `CardView.re` file in the Card folder, and copy this code into it:

```js
let component = ReasonReact.statelessComponent("CardView");

let make = (~code, ~imageSource, ~flipped, ~onClick, _children) => {
  ...component,
  render: _self =>
    <div className=(flipped ? "Card flipped" : "Card") onClick>
      <div className="Card front">
        <img alt=(ParseAndRenderCard.parseAndRender(code)) src=imageSource />
      </div>
      <div className="Card back" />
    </div>
};
```

Let me explain what's going on here. Every component in ReasonReact is defined by a `make` function. This function receives props and children as input, and returns a record. In our case, we created a "base" stateless record with the `statelessComponent` function, and our `make` function returns it with the `render` field being overriden.

It feels a little bit like a regular javascript React component, with some interesting differences:

* The components props are defined as [labeled parameters](https://reasonml.github.io/docs/en/function.html)
* The `_` prefix was used as a convention for unused parameters
* We don't need to enclose the passed props in `{` and `}`. Example: `src=imageSource`
* We can use shorthand names for props. Example: `onClick` in the first `div`

The rest feels pretty similar to Javascript, with the benefits of Ocaml's strong type. Sweet!

This is all we would need if we were using this component inside ReasonML. But since we're going to call it inside a regular javascript React component, we need to have an extra step. ReasonReact has a `wrapReasonForJs` function that serves this purpose:

```js
let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~code=jsProps##code,
      ~imageSource=jsProps##imageSource,
      ~flipped=Js.to_bool(jsProps##flipped),
      ~onClick=jsProps##onClick,
      [||]
    )
);
``` 

The `wrapReasonForJs` function receives a component as a parameter, and a function that maps those dynamic js props to ReasonML typed props. The component should be the base one we used in our make function. The function should call make itself, with the transformed props that were passed to the component in JS. Some comments on it:

* `~component` is a shorthand for `~component=component`
* `##` is the way to get the value of a property in a regular JS object. So `jsProps##code` is compiled to `jsProps.code`
* Boolean ReasonML types are _not_ represented as `true` or `false` in Javascript! That's why we need to use `Js.to_bool` to convert `jsProps##flipped`
* Arrays are represented by `[|` and `|]` in ReasonML. If we use `[` and `]`, we're actually creating a _list_. The [docs explain the difference well](https://reasonml.github.io/docs/en/list-and-array.html), and I suggest you play a little with both in [Try Reason](https://reasonml.github.io/en/try.html) to see the differences in the compiled code!

Now we can go to our `Card/index.html` file, erase the previous CardView component, and use our brand new ReasonML one:

```js
import React from "react";
import "./Card.css";
import CardView from "./CardView.bs";

class Card extends React.Component {
  state = {
    flipped: true
  };

  flip = () => {
    this.setState({ flipped: !this.state.flipped });
  };

  render() {
    const { code, imageSource } = this.props;
    return (
      <CardView
        code={code}
        imageSource={imageSource}
        flipped={this.state.flipped}
        onClick={this.flip}
      />
    );
  }
}

export { Card };
```

And that's it - our application should be running flawlessly with the new code!

## Integrating A Stateful Component

Stateful components in ReasonReact are interesting - we define the way state is updated by defining actions and a reducer. Sounds familiar, right? Yes, there's a mini-redux in every component :) It's a great pattern, and feels even better with the compiler help from the strong types.

Our stateful component is simple: our cards start out face down, and if a user clicks one of them, they're flipped over. So let's start by creating a `CardContainer.re` file alongside `CardView.re`, and describe our action and our state:

```js
type action =
  | Flip;

type state = {flipped: bool};
```

Our action is usually defined as a [Variant](https://reasonml.github.io/docs/en/variant.html). In our case, the only action the user can take is flipping a card, so we only have the one case `Flip`. Our state is going to be a record with a single boolean field, that represents a card being flipped or not. 

Now we can define our component. Remember, first we create a base component record, and then a make function. For stateful components we use `ReasonReact.reducerComponent` base and we need to override not only `render`, but also `initialState` and `reducer`:

```js
let component = ReasonReact.reducerComponent("CardContainer");

let make = (~code, ~imageSource, _self) => {
  ...component,
  initialState: () => {flipped: true},
  reducer: (_action, state) => ReasonReact.Update({flipped: ! state.flipped}),
  render: self =>
    <CardView
      code
      imageSource
      flipped=self.state.flipped
      onClick=(_event => self.send(Flip))
    />
};
```

`initialState` is a simple function that returns a record of the type `state`. In our case, our cards start flipped. 

`reducer` is a function that takes an action and the current state, and returns a value of the `ReasonReact.update` variant type. We're returning the `ReasonReact.Update(state)` case, which results in a simple state update without side effects, which is what we want to happen when the user flips a card. We'll talk more about the `ReasonReact.update` type in the next part of this series!

The last part of this component is the callback defined for `onClick`. We're using `self.send`, which in fact "sends" the `Flip` action to the reducer. And our component is complete!

See that our render function is making reference to `CardView`. Since we're in ReasonML land, we do not need a wrapper for the card view anymore, so we can delete it from the `CardView` file. But since the card container will be imported in JS, we need to wrap it instead:

```js
let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~code=jsProps##code, ~imageSource=jsProps##imageSource, [||])
  );
```

That's all we need. The whole file should look like this now:

```js
type action =
  | Flip;

type state = {flipped: bool};

let component = ReasonReact.reducerComponent("CardContainer");

let make = (~code, ~imageSource, _self) => {
  ...component,
  initialState: () => {flipped: true},
  reducer: (_action, state) => ReasonReact.Update({flipped: ! state.flipped}),
  render: self =>
    <CardView
      code
      imageSource
      flipped=self.state.flipped
      onClick=(_event => self.send(Flip))
    />
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~code=jsProps##code, ~imageSource=jsProps##imageSource, [||])
  );
```

Now we can import this component directly into our `Card/index.js` file:

```js
// Card/index.js
import "./Card.css";
import CardContainer from "./CardContainer.bs";

export { CardContainer as Card };
```

If you prefer, instead of importing the CSS file here, you could add a `[%%raw "import './Card.css'"];` line at the beginning of the `CardView.re` file, with the same effect.

The final code for the integration with the stateful component [can be found here](https://github.com/lucasmreis/learning-reasonml/tree/integrating_stateful_2/part-2).

## Conclusions

That's the third strong typed language I've used for front end programming, after Elm and F#. First of all, it confirms my feeling that _this is the way to go_. Javascript's dynamic nature gives you a lot of power, but when we're writing larger and larger applications, these types give you a much saner environment. Refactoring does not feel so scary, tooling helps you much more, things are better documented, and so on.

Now, comparing ReasonML to the other two languages. Elm's architecture (shared by F# within the [Fable-Elmish framework](https://fable-elmish.github.io/elmish/)) is really simple and powerful. It has influenced the entire front end world, and ReasonReact's reducer components were definitely inspired by it. In Elm, state and action handling is done separately from the visual components, in kind of a "global" way. In contrast, ReasonReact embraces the React way of doing things, which is the "everything is a component" mentality. The interesting part is: the reducer components feel a lot like Elm, so in practice, a ReasonReact application feels like composing small Elm applications! By doing that, it's also pretty easy to not only integrate your ReasonML code into your React application, but it's also relatively easy to get all the benefits from modern tooling, like code splitting and dynamically importing components. This and the fact that the generated JS code is really well optimized are the great benefits of ReasonML over the other two.

Where do Elm and F# perform better than ReasonML? Elm is still the safer option out there, due to the stricter JS integration. It's much, much easier to avoid runtime errors with Elm. Also, it has great docs and well thought out standard libraries. F# has the benefit that it can be used both on the frontend and backend of your application, and you can have access to a lot of the .Net features with it. And, as a personal note, I understand the decision to make ReasonML's syntax more "javascript-like", but I feel both Elm's and F#'s syntax are way better and more pleasurable to work with.

## Next Steps

In the third part of this series I'll try to [rewrite `App.js` with ReasonReact](https://github.com/lucasmreis/learning-reasonml/blob/master/part-2/src/App.js)! Let's see how the language feels when we need to perform side effects, work with JSON data, and do some async work. See you there!
