---
title: Simple React Patterns
lead: Dealing With Side-Effects In React
template: post.hbt
date: 2017-10-09
tags: javascript, react, design-patterns
draft: true
---

I've been writing React application for some years now, and have noticed some patterns tend to appear. I'll summarize here about 99% of the React code I write everyday :)

As a sample spec, let's build an app that fetches information about the Dagobah planet from Star Wars API, and shows it to the user.

## Simple everyday patterns

This is going to be around 95% of the code you write: either simple view components or components with some logic in it. So, the first pattern is the easiest one:

### The Vanilla or Mixed Pattern

```js
export default class Dagobah extends React.Component {
  state = { loading: true };

  componentDidMount() {
    fetch("https://swapi.co/api/planets/5")
      .then(res => res.json())
      .then(
        planet => this.setState({ loading: false, planet }),
        error => this.setState({ loading: false, error })
      );
  }

  renderLoading() {
    return <div>Loading...</div>;
  }

  renderError() {
    return <div>I'm sorry! Please try again.</div>;
  }

  renderPlanet() {
    const { name, climate, terrain } = this.state.planet;
    return (
      <div>
        <h2>{name}</h2>
        <div>Climate: {climate}</div>
        <div>Terrain: {terrain}</div>
      </div>
    );
  }

  render() {
    if (this.state.loading) {
      return this.renderLoading();
    } else if (this.state.planet) {
      return this.renderPlanet();
    } else {
      return this.renderError();
    }
  }
}
```

This is a *vanilla* React component, something you will write after reading the docs. Writing a component like this one has its benefits: the main one is that it's easy, and it's self contained. Plug a `<Dagobah />` anywhere in your application and it will fetch the data and render it.

**Side note**: whenever we deal with fetching data from somewhere in a way that may take time or fail, *we need to define views for those states*. We always need to define a view for the loading state and a view for the error state. No network is perfect, and we need to prepare our app for that!

You can even define some more intricated logic, like waiting dome miliseconds before showing the loading view so you avoid blinking states, and so on. This is a great subject, but I won't go further in this blog post. I'll stick to the simple Loading / Error / Success pattern on all the examples.

Ok, now what problems does this component have? Let's say we want to use a styleguide tool like [Storybook]() to render the component in all three states, so we can polish well each version, or even showcase it to other teams. Is it possible? What if I want to unit test the view without fetching the data everytime, or without mocking the requests? It's not gonna happen.

Both the logic and the view are intertwined in only one indivisible component, and that's why I also call this pattern the *Mixed Component* pattern. For a better workflow, and simpler, more testable, and more maintainable code, we need to separate the logic and the view. And that's why this second pattern is probably the most useful of them all, and the one I try to use in all of this 95% of the code:

### The Container / View Pattern

```js
class PlanetView extends React.Component {
  renderLoading() {
    return <div>Loading...</div>;
  }

  renderError() {
    return <div>I'm sorry! Please try again.</div>;
  }

  renderPlanet() {
    const { name, climate, terrain } = this.props.planet;
    return (
      <div>
        <h2>{name}</h2>
        <div>Climate: {climate}</div>
        <div>Terrain: {terrain}</div>
      </div>
    );
  }

  render() {
    if (this.props.loading) {
      return this.renderLoading();
    } else if (this.props.planet) {
      return this.renderPlanet();
    } else {
      return this.renderError();
    }
  }
}

// State:
// { loading: true }
// { loading: false, planet: { name, climate, terrain } }
// { loading: false, error: any }

class DagobahContainer extends React.Component {
  state = { loading: true };

  componentDidMount() {
    fetch("https://swapi.co/api/planets/5")
      .then(res => res.json())
      .then(
        planet => this.setState({ loading: false, planet }),
        error => this.setState({ loading: false, error })
      );
  }

  render() {
    return <PlanetView {...this.state} />;
  }
}

export default DagobahContainer;
```

That's it, you just saw the great majority of the code I write today. A simple view only generic planet view, and a logic only component, that simply call the view in its render function.

With the separated view component, we can very easily use it in a styleguide, and fine tune each of the variants, just by providing different props. Also, we can easily test the view using [Enzyme]() for instance.

Also, my experience shows that this pattern scales better: maybe one of the view states gets big, and it's straightforward to extract it through a new component. On the logic side, it's also much easier to understand and change code not polluted with view related stuff.

Notice that the view component has some if logic to define what to render. We can extract it into it's own component, in what could be considered a variant of the Container / View ppattern:

### The Container / Branch / View Pattern

```js
const LoadingView = () => <div>Loading...</div>;

const ErrorView = () => <div>I'm sorry! Please try again.</div>;

const PlanetView = ({ name, climate, terrain }) => (
  <div>
    <h2>{name}</h2>
    <div>Climate: {climate}</div>
    <div>Terrain: {terrain}</div>
  </div>
);

class PlanetBranch extends React.Component {
  render() {
    if (this.props.loading) {
      return <LoadingView />;
    } else if (this.props.planet) {
      return <PlanetView {...this.props.planet} />;
    } else {
      return <ErrorView />;
    }
  }
}

// State:
// { loading: true }
// { loading: false, planet: { name, climate, terrain } }
// { loading: false, error: any }

class DagobahContainer extends React.Component {
  state = { loading: true };

  componentDidMount() {
    fetch("https://swapi.co/api/planets/5")
      .then(res => res.json())
      .then(
        planet => this.setState({ loading: false, planet }),
        error => this.setState({ loading: false, error })
      );
  }

  render() {
    return <PlanetBranch {...this.state} />;
  }
}

export default DagobahContainer;
```

Now the individual views are even more isolated, which can help more testing, showcasing and the development workflow. Deciding how much to break the view is best done in a case by case analysis, and the rule of thumb is: keep it simple to understand. This can vary a lot, so use your best judgement!

The only situation that these initial patterns are not useful is when we need to *reuse the logic with different views*. Those can be interesting cases, and there are two main ways of dealing with it. Let start with the "oldest" one:

## Higher Order Components

PROS: logic not dependent on views, reusable
CONS: views sort of dependent on hoc props schema, still need a branch/selector component to solve it

Example: https://github.com/ctrlplusb/react-sizeme

### Variation: Branching HOC
Example: https://github.com/thejameskyle/react-loadable

## Render Props

PROS: same as HOC, with views being less dependent on logic, and does not need as much code outside react lifecycle
CONS: same as hocs

Performance issue: not straightforward! :)

### Variation: Branching Render Props

What if side effects are costly, and you only want to run it once and make it available to different views?

## The Provider Pattern

Create a Provider component that fetches data and puts it in context.

Access the context and make the data available through HOCs or Render Props.

PROS: don't run side effect twice! performance!
CONS: context is not simple; may change in the future