---
title: Learning ReasonML, part 2
lead: Integating ReasonML Into a React Application
template: post.hbt
date: 2018-01-18
tags: functional, types, reason, reasonml
---

## The Project

Let's start with an existing React application. [Here's the code](https://github.com/lucasmreis/learning-reasonml/tree/master/part-2), and [here's the working app](https://simple-deck-example.netlify.com/). The app "creates" a deck of cards using [this great open API](http://deckofcardsapi.com/), and then the user can draw three cards at a time using a button. The cards are drawn flipped, and they flip when clicked.

I think this project is interesting because it has some key real world features: global and local state handling, and remote data fetching both on startup and user interaction. In this post I'll integrate ReasonML code in three different ways: first a function (the one we [wrote in the first part](http://lucasmreis.github.io/blog/learning-reasonml-part-1/)), then a stateless React component, and then a stateful React component.

## Having ReasonML Files In A JS Project

We want our workflow to be as simple as possible. I like the idea of creating `.re` files throughout the project where I need them, and automatically compile them to `.bs.js` files in the same location. To achieve that, let's first install `bs-platform` to [our react application](https://github.com/lucasmreis/learning-reasonml/tree/master/part-2) with npm:

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

I this file we're saying that we should compile every file in the `src` folder and subfolders. Also, since our project is a [Create React App](https://github.com/facebook/create-react-app) project that uses webpack for bundling, we're compiling to ES6 modules. I found that the official documentation [has a good section on the config file](https://bucklescript.github.io/docs/en/build-configuration.html).

Now we only need to update the npm scripts to take ReasonML into account:

```js
(...)

"scripts": {
    "start:reason": "bsb -make-world -w",
    "build": "bsb -make-world && react-scripts build",

(...)
```

Open two terminals, run `npm start` on one of them and `npm run start:reason` on the other one, and we're now ready to start writing ReasonML in our React project!

## Integrating A Function

First, let's look at the structure of the application:

* The app follows CRA initial structure: all application code is inside the `src` folder, and the React setup is in the `index.js` file.

* `App.js` is the main container: it fetches data from the deck API, stores it, and expose a `draw` action that fetches three new cards:

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

An initial, super low risk place to integrate ReasonML could be the image's alt attribute. `code` is a value returned from the Deck API, that looks like "6C", "QH" or "AD". On [part 1 of our series](http://lucasmreis.github.io/blog/learning-reasonml-part-1/) we implemented a function that transforms a string like that into a complete "Six of Clubs" or "Queen of Hearts", so let's use it!

Create a `ParseAndRenderCard.re` file in the same folder as the Card component, and copy and paste the code to it. If Bucklescript is setup correctly and running, you should already be seeing a `ParseAndRenderCard.bs.js` file in the same folder (I'm a little bit scaried with how fast this compiler is, hehe). I added this to the end of the file to be able to export the function:

```js
(...)

let parseAndRender = cardStr =>
  cardStr
  |> Parser.parseCard
  |> Option.map(RenderToString.renderCard)
  |> Option.withDefault(RenderToString.defaultErrorCard);
```

And we can see that the end of the compiled file look something like this:

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

`parseAndRender` is exactly what we need. Now, on the `Card/index.js` file, import the function and use it:

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
3. Import the generated JS function in your code

ML languages like ReasonML are great for writing intricate logic, so I think that writing functions in it and importing to your React project can already bring benefits. But let's take it a step further and write a whole stateless component in ReasonML.

The final code for the project with a ReasonML function integration [can be found here](https://github.com/lucasmreis/learning-reasonml/tree/integrating_function/part-2).

## Integrating A Stateless Component

Now let's create a React component using ReasonML. As always, let's start simple - and I think a stateless component is a good opportunity for that. First of all, we need to refactor our Card component - let's use the Container / View pattern [described in this blog post](http://lucasmreis.github.io/blog/simple-react-patterns/). Remember the card component:

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

We're going to rewrite the CardView component. We're going to use the [ReasonReact]() wrapper to React, which is the current standard way of writing React in ReasonML. After `npm install --save reason-react`, change the `bsconfig.json` file to include these two properties:

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

The `wrapReasonForJs` function receives a component as a parameter, and a function that maps that dynamic js props to ReasonML typed props. The component should be the base one we used in our make function. The function should call make itself, with the transformed props that were passed to the component in JS. Some comments on it:

* `~component` is a shorthand for `~component=component`
* `##` is the way to get the value of a property in a regular JS object. So `jsProps##code` is compiled to `jsProps.code`
* Boolean ReasonML types are _not_ represented as `true` or `false` in Javascript! That's why we need to use `Js.to_bool` to convert `jsProps##flipped`
* Arrays are represented by `[|` and `|]` in ReasonML. If we use `[` and `]`, we're actually creating a _list_. The [docs explain well the difference](https://reasonml.github.io/docs/en/list-and-array.html), and I suggest you play a little with both in [Try Reason](https://reasonml.github.io/en/try.html) to see the differences in the compiled code!

Now we can go to our `Card/index.html` file, erase the previous CardView component and use our brand new ReasonML one:

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




3. integrate stateless component

* extract view
* npm install, add to bsconfig:
  "reason": {"react-jsx" : 2},
  "bs-dependencies": ["reason-react"],
* make simple component, remember wrapToJs
* props, remember to convert

4. Stateful

* reducer component
* remove wrapper from view, put here
* initial state, com state sendo um boolean
* we're in reason world! better flip type, Flipped / NotFlipped on a different module
* action: Flip
* reducer, need to return a update type

Works, great!

Next steps: rewrite App.js.
