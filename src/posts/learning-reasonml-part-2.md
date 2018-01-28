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
