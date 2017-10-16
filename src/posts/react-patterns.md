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

Notice that the view component has some "if" logic to define what to render. We can extract it into it's own component, in what could be considered a variant of the Container / View pattern:

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

const PlanetBranch = ({ loading, planet }) => {
  if (loading) {
    return <LoadingView />;
  } else if (planet) {
    return <PlanetView {...planet} />;
  } else {
    return <ErrorView />;
  }
};

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

Higher Order Components (HOCs) are simply functions that take at least one component as a parameter and return another component. Usually what it does is adding props to the passed component after doing some work. For instance, we could have a `withDagobah` HOC that fetches info about Dagobah and passes the result as a prop:

```js
const withDagobah = PlanetViewComponent =>
  class extends React.Component {
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
      return <PlanetViewComponent {...this.state} />;
    }
  };

export default withDagobah(PlanetBranch);
```

Now, all this planet fetching logic is inside this HOC, and is *not dependent on any view logic*. It does not have any dependency on any particular React views, it only adds some props to a passed component. That way, you can use it for instance in all your routes, with different components rendering planets differently.

**Note:** if you use this HOC in two components being rendered in the same screen, it will fetch the data twice. Fetching data is an expensive side effect, and usually we try to do it as little as we can. I'll talk how to deal with it in the last pattern of this post, so keep on reading! :)

A HOC can also accept different parameter to define it's behavior. We could have for instance a `withPlanet` HOC that fetches different planets:

```js
const hoc = withPlanet('tatooine');
const Tatooine = hoc(PlanetView);

// somewhere else inside a component:
render() {
  return (
    <div>
      <Tatooine />
    </div>
  );
}
```

An example of a HOC with this ability is [react-sizeme](https://github.com/ctrlplusb/react-sizeme). It receives an options object and a component, and returns another component with a `size` props, containing height, width and position information.

So, what are the cons of HOCSs? The first painful one is that every view that will be used with the HOC has to understand the shape of the props passed. In our example, we add the `loading`, `error` and `planet`, and our views need to be prepared for it. Sometimes we have to have a component that the only purpose is transforming the props into the intended ones, and that feels inefficient (interestingly, one of the most used HOCs does not have this problem: [react-redux](https://github.com/reactjs/react-redux)'s `connect`, since the user decides the shape of the props passed to the view component).

Some HOCs will always lead to branched views, like our `withDagobah` that almost always will be viewed with Loading, Error and Success views. That can give rise to a HOC variant:

### Branching Higher Order Components

We can put the branching logic inside the HOC:

```js
const withDagobah = ({
  LoadingViewComponent,
  ErrorViewComponent,
  PlanetViewComponent
}) =>
  class extends React.Component {
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
      if (this.state.loading) {
        return <LoadingViewComponent />;
      } else if (this.state.planet) {
        return <PlanetViewComponent {...this.state.planet} />;
      } else {
        return <ErrorViewComponent />;
      }
    }
  };

// and the HOC would be called like this:
export default withDagobah({
  LoadingViewComponent: LoadingView,
  ErrorViewComponent: ErrorView,
  PlanetViewComponent: PlanetView
});
```

There's a trade off here: even though the views are simpler, there's more logic inside the HOC. It's only worth it if you really know that more than one view is going to be used, and that the branching logic will be the same every time. An example of a branching HOC is [react-loadable](https://github.com/thejameskyle/react-loadable), that accepts both a dynamic loaded component and a Loading component that handles both loading and error state.

## Render Props

There is another widely used pattern that separates the logic from the view, the Render Props (also known as Children as Function). [Some people swear by it](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce),and some people even [consider it an anti-pattern](http://americanexpress.io/faccs-are-an-antipattern/). This is how our Dagobah logic would be implemented as a Render Prop:

```js
class DagobahRP extends React.Component {
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
    return this.props.render(this.state);
  }
}

// notice that a function is passed to the render prop:
export default () => (
  <DagobahRP
    render={({ loading, error, planet }) => {
      if (loading) {
        return <LoadingView />;
      } else if (planet) {
        return <PlanetView {...planet} />;
      } else {
        return <ErrorView />;
      }
    }}
  />
);
```

**Note:** in the Render Props debate, the performance issue was raised many times. This post shows well how [it's not a straightforward issue](https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578). Anytime we talk about performance, we should also be talking about measurements. If you have any doubts about performance in a specific issue, load your profilers and measure it! :)

I tend to feel that the benefits of HOCs versus Render Props vary from situation to situation. At my previous job we tended to write more Render Props, at my current job we tend to write more HOCs, and I don't feel that made any of the teams more productive, or the code more readable in general. I definitely feel one pattern is better than the other whenever I meet it in the code, but as I said, it's in a case by case basis. As always, use your better judgement.

The first time I saw the Render Props pattern was in the [React Motion library](https://github.com/chenglou/react-motion). [React Router v4](https://reacttraining.com/react-router/web/api/Route/render-func) is another large function implementing it. The two authors are probably the most influential render props enthusiasts, and they have a couple of other [small libraries](https://reacttraining.com/react-idle/) [using it](https://reacttraining.com/react-network/).

Render props can also lead to a lot of branching views code, so I feel I also should register here the Branching Render Props variant:

### Variation: Branching Render Props

```js
class DagobahRP extends React.Component {
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
    if (this.state.loading) {
      return this.props.renderLoading();
    } else if (this.state.planet) {
      return this.props.renderPlanet(this.state.planet);
    } else {
      return this.props.renderError(this.state.error);
    }
  }
}

// different callback for different branches:
export default () => (
  <DagobahRP
    renderLoading={() => <LoadingView />}
    renderError={error => <ErrorView />}
    renderPlanet={planet => <PlanetView {...planet} />}
  />
);
```

What if side effects are costly, and you only want to run it once and make it available to different views?

## The Provider Pattern

Create a Provider component that fetches data and puts it in context.

Access the context and make the data available through HOCs or Render Props.

PROS: don't run side effect twice! performance!
CONS: context is not simple; may change in the future