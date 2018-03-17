---
title: Learning ReasonML, part 3
lead: Implementing Side Effects
template: post.hbt
date: 2018-03-17
tags: functional, types, reason, reasonml
---

<<< INTRO >>>

## Modelling User Actions

This is the [application's main module](https://github.com/lucasmreis/learning-reasonml/blob/master/part-2/src/App.js), which contains the side effects:

```js
class App extends Component {
  componentDidMount() {
    // fetch API to create deck
  }

  render() {
    return (
      <div className="App">
        {this.renderMainAction()}
        {this.renderCards()}
      </div>
    );
  }

  renderMainAction() {
    // render button
    // disable it depending on current state
  }

  renderCards() {
    // render list of cards
  }

  draw = async () => {
    // fetch API do draw cards
    // pass as a callback to the main action button
}
```

We can see that there are two main actions that trigger side effects: creating a deck on mounting, and drawing new cards on button click. Remember that side effects of this nature - fetching something from a network - have to take into account that things can get _slow_ and they can _fail_. Having said that, we usually model each of those actions as _three different_ actions:

```js
type action =
  | CreateDeck
  | DeckCreated(deck)
  | CreateDeckFailed
  | DrawCards(deck)
  | CardsDrawn(deck)
  | DrawCardsFailed
  | DeckFinished(list(card));
```

I added a `DeckFinished` action so our application can transition to a finished state that only shows the cards, and do not show the action button anymore.

Some actions have data related to them: `deck` and `list(cards)`. These types are related to the action state, and are inspired by the API response:

```js
type card = {
  image: string,
  code: string
};

type deck = {
  deckId: string,
  remaining: int,
  cards: list(card)
};
```

The `deckId` info is used to draw cards from the same deck that was created in the beginning of the application lifecycle. `remaining` is the information we use to decide if we already drew all the cards. For instance, we check `remaining` to decide if we issue a `CardsDrawn` action or `DeckFinished`.

**Note:** I like to follow this `CQRS` convention of [writing events in the past tense, and commands in the imperative](http://cqrs.nu/Faq). In summary, it means that an action that's written in the imperative will _trigger_ a side effect, and its results are unknown. And actions that are written in the past tense are actions that will trigger a deterministic state change when they happen - there are no unknowns regarding events.

**Note 2:** The `*Failed` actions are not carrying and data with them - that's because this simple app is just showing a generic message when an error happens. That's not what we would do in a large scale app!

## Modelling The Application State
