---
title: A more functional approach to Angular, part 2
lead: An implementation of the centralized state
template: post.hbt
date: 2015-03-05
tags: javascript, angular, functional, state
---

Talk about part 1. In this post, I present the implementation of  `AppStateService`.

Let me show you `AppStateService`:

```javascript
angular.module('simpleStateApp').factory('AppStateService', function(StateService) {
  var state = {
    foos: [1, 2, 3], // initial values
    bars: ['a', 'b', 'c']
  };

  var listeners = [];

  var get    = StateService.get(state);
  var change = StateService.change(state, listeners);
  var listen = StateService.listen(state, listeners);

  return {
    get: get,
    change: change,
    listen: listen
  };
});
```

We can see that all the magic is in `StateService`. But let's first understand the components of `AppStateService`.
