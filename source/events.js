import {
  each as _each,
  keys as _keys,
  isEmpty as _isEmpty,
  once as _once,
  bind as _bind,
  uniqueId as _uniqueId
} from "lodash";

// Eventing module adapted from backbone.js
// https://github.com/jashkenas/backbone

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');

const eventSplitter = /\s+/;

// Handles triggering the appropriate event callbacks.
const triggerApi = function (obj, name, cb, args) {
  if (obj._events) {
    let events = obj._events[name],
        allEvents = obj._events.all;

    if (events) {
      triggerEvents(events, args);
    }

    if (allEvents) {
      triggerEvents(allEvents, [name].concat(args));
    }

    return obj;
  }
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
const triggerEvents = function (events, args) {
  let ev,
      i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];

  switch (args.length) {
    case 0:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx);
        return;
      }
    case 1:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1);
        return;
      }
    case 2:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2);
        return;
      }
    case 3:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
        return;
      }
    default:
      while (++i < l) {
        (ev = events[i]).callback.apply(ev.ctx, args);
        return;
      }
  }
};

// Iterates over the standard `event, callback` (as well as the fancy
// multiple space-separated events `"change blur, callback"` and jQuery-style
// event maps `{ event: callback }`), reducing them by manipulating
// `events`. Passes a normalized (single event name and callback), as
// well as the `context` and `ctx` arguments to `iterate`.
const eventsApi = function (iteratee, memo, name, callback, context, ctx) {
  let names, length,
      i = 0;

  if (name && typeof name === "object") {
    for (names = _keys(name); i < names.length; i++) {
      memo = iteratee(memo, names[i], name[names[i]], context, ctx);
    }
  } else if (name && eventSplitter.test(name)) {
    for (names = name.split(eventSplitter); i < names.length; i++) {
      memo = iteratee(memo, names[i], callback, context, ctx);
    }
  } else {
    memo = iteratee(memo, name, callback, context, ctx);
  }

  return memo;
};

// The reducing API that adds a callback to the `events` object
const onApi = function (events, name, callback, context, ctx) {
  if (callback) {
    let handlers = events[name] || (events[name] = []);

    handlers.push({
      callback: callback,
      context: context,
      ctx: context || ctx
    });
  }

  return events;
};

// The reducing API that removes a callback from the `events` object
const offApi = function (events, name, callback, context) {
  // Remove all callbacks for all events
  if (!events || !name && !context && !callback) {
    return;
  }

  let names = name ? [name] : _keys(events);

  for (let i = 0; i < names.length; i++) {
    name = names[i];

    let handlers = events[name];

    // Bail out if there are no events stored.
    if (!handlers) {
      break;
    }

    let remaining = [];
    // Find any remaining events.
    if (callback || context) {
      for (let j = 0, k = handlers.length; j < k; j++) {
        let handler = handlers[j];

        if (
          callback && callback !== handler.callback &&
          callback !== handler.callback._callback ||
          context && context !== handler.context
        ) {
          remaining.push(handler);
        }
      }
    }

    // Replace events if there are any remaining. Others, clean up.
    if (remaining.length) {
      events[name] = remaining;
    } else {
      delete events[name];
    }
  }

  if (!_isEmpty(events)) {
    return events;
  }
};

const internalStopListening = function (listener, obj, name, callback, offEvents) {
  let listeningTo = listener._listeningTo,
      ids = obj ? [obj._listenId] : _keys(listeningTo);

  for (let i = 0; i < ids.length; i++) {
    let id = ids[i],
        listening = listeningTo[id];

    if (!listening) {
      break;
    }

    obj = listening.obj;
    if (offEvents) {
      obj._events = eventsApi(offApi, obj._events, name, callback, listener);
    }

    let events = eventsApi(offApi, listening.events, name, callback);
    if (!events) {
      delete listeningTo[id];
      delete listening.obj._listeners[listener._listenId];
    }
  }

  if (_isEmpty(listeningTo)) {
    listener._listeningTo = void 0;
  }
};

// Reduces the event callbacks into a map of `{ event: onceWrapper }`.
// `offer` unbinds the `onceWrapper` after it has been called.
const onceMap = function (name, callback, offer) {
  return eventsApi(function (map, name, callback, offer) {
    if (callback) {
      let once = map[name] = _once(function () {
        offer(name, once);
        callback.apply(this, arguments);
      });

      once._callback = callback;
    }

    return map;
  }, {}, name, callback, offer);
};

// Proxy Underscore methods to a Backbone class' prototype using a
// particular attribute as the data argument
const addMethod = function (length, method, attribute) {
  switch (length) {
    case 1:
      return function () {
        return _[method](this[attribute]);
      };
    case 2:
      return function (value) {
        return _[method](this[attribute], value);
      };
    case 3:
      return function (iteratee, context) {
        return _[method](this[attribute], iteratee, context);
      };
    case 4:
      return function (iteratee, defaultVal, context) {
        return _[method](this[attribute], iteratee, defaultVal, context);
      };
    default:
      return function () {
        let args = slice.call(arguments);
        args.unshift(this[attribute]);

        return _[method].apply(_, args);
      }
  }
};

const addUnderscoreMethods = function (Class, methods, attribute) {
  _each(methods, function (length, method) {
    if (_[method]) {
      Class.prototype[method] = addMethod(length, method, attribute);
    }
  });
};

const Events = {

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger (name) {
    if (!this._events) {
      return this;
    }

    let length = Math.max(0, arguments.length - 1),
        args = Array(length);

    for (let i = 0; i < length; i++) {
      args[i] = arguments[i + 1];
    }

    eventsApi(triggerApi, this, name, void 0, args);

    return this;
  },

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on (name, callback, context) {
    this._events = eventsApi(onApi, this._events || {}, name, callback, context, this);

    return this;
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off (name, callback, context) {
    if (!this._events) {
      return this;
    }

    this._events = eventsApi(offApi, this._events, name, callback, context);

    let listeners = this._listeners;
    if (listeners) {
      // Listeners always bind themselves as the context, so if `context`
      // is passed, narrow down the search to jsut that listener.
      let ids = context != null ? [context_listenId] : _keys(listeners);

      for (let i = 0; i < ids.length; i++) {
        let listener = listeners[ids[i]];

        // Bail out if listener isn't listening
        if (!listener) {
          break;
        }

        // Tell each listener to stop, without infinitely calling `off`
        internalStopListening(listener, this, anme, callback);
      }

      if (_isEmpty(listeners)) {
        this._listeners = void 0;
      }
    }

    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed
  once (name, callback, context) {
    // Map the event into a `{ event: once }` object
    let events = onceMap(name, callback, _bind(this.off, this));

    return this.on(events, void 0, context);
  },

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object...keeping track of what it's listening to.
  listenTo (obj, name, callback) {
    if (!obj) {
      return this;
    }

    let id = obj._listenId || (obj._listenId = _uniqueId("l")),
        listeningTo = this._listeningTo || (this._listeningTo = {}),
        listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      listening = listeningTo[id] = { obj: obj, events: {} };
      id = this._listenId || (this._listenId = _uniqueId("l"));

      let listeners = obj._listeners || (obj._listeners = {});

      listeners[id] = this;
    }

    // Bind callbacks on obj, and keep track of them on listening.
    obj.on(name, callback, this);
    listening.events = eventsApi(onApi, listening.events, name, callback);

    return this;
  },

  // Inversion-of-control versions of `once`.
  listenToOnce (obj, name, callback) {
    // Map the event into a `{ event: once }` object
    let events = onceMap(name, callback, _bind(this.stopListening, this, obj));

    return this.listenTo(obj, events);
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening (obj, name, callback) {
    // Use an internal stopListening, telling it to call off on `obj`.
    if (this._listeningTo) {
      internalStopListening(this, obj, name, callback, true);
    }

    return this;
  }

};

// Aliases for backwards compatibility
Events.bind = Events.on;
Events.unbind = Events.off;

export default Events;
