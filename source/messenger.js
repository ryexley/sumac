import {
  assign as extend,
  each,
  isEmpty,
  isObject,
  isArray,
  identity,
  bind
}
from "lodash";
import postal from "postal";
import DiagnosticsWireTap from "postal.diagnostics";
import Events from "./events";

const Messenger = {

  channel: null,

  _setupChannel(target) {
    target.channel = postal.channel(target.namespace || target.channelName);
  },

  _ensureChannel() {
    if (!this.channel) {
      this._setupChannel(this);
    }
  },

  publish(topic, data) {
    this._ensureChannel();
    return this.channel.publish.call(this.channel, {
      topic: topic,
      data: data || {}
    });
  },

  subscribe() {
    this._ensureChannel();

    let key, subscription = {};

    if (!isObject(arguments[0])) {
      key = this.channelName + " " + arguments[0] || "";
      subscription = this.channel.subscribe.apply(this.channel, arguments).context(this);
    } else {
      let args = arguments[0];
      if (args.channel && args.topic) {
        key = args.channel + " " + args.topic;
        subscription = postal.subscribe.apply(this, arguments).context(this);
      }
    }

    if (!this.messaging.subscriptions) {
      this.messaging.subscriptions = {};
    }

    this.messaging.subscriptions[key] = subscription;

    return subscription.context(this);
  },

  configureMessaging(options) {
    options = options || {};
    this.messaging = this.messaging || {};
    this.setupSubscriptions();
    this.setupMessages();
    // this.startWiretap(options.wiretap || {});
  },

  clearMessages() {
    if (this.messaging.messages) {
      each(this.messaging.messages, (message) => {
        each(message, (m) => {
          while (m.length) {
            m.pop();
          }
        });
      });
    }

    this.messaging.messages = {};
  },

  setupMessages() {
    this.clearMessages();

    if (!isEmpty(this.messages)) {
      each(this.messages, (message, evnt) => {
        let _message = message;

        if (!this.messaging.messages[evnt]) {
          this.messaging.messages[evnt] = {};
        }

        if (!isObject(message)) {
          _message = {};
          _message[message] = identity;
        }

        each(_message, (accessor, m) => {
          let meta = m.split(" "),
              channel = meta[0],
              topic = meta[1],
              listener = function() {
                let args = Array.prototype.slice.call(arguments, 0),
                    data = accessor.apply(this, args);

                postal.publish({
                  channel: channel,
                  topic: topic,
                  data: data || {}
                });
              };

          this.on(evnt, listener, this);
          this.messaging.messages[evnt][m] = bind(function() {
            this.off(evnt, listener);
          }, this);
        });
      });
    }
  },

  clearSubscriptions() {
    if (this.messaging.subscriptions) {
      each(this.messaging.subscriptions, (subscription) => {
        subscription.unsubscribe();
      });
    }

    this.messaging.subscriptions = {};
  },

  setupSubscriptions() {
    this.clearSubscriptions();
    if (!isEmpty(this.subscriptions)) {
      each(this.subscriptions, (subscription, handler) => {
        subscription = isArray(subscription) ? subscription : [subscription];
        each(subscription, (s) => {
          let meta = s.split(" "),
              channel = meta[1] ? meta[0] : this.channelName,
              topic = meta[1] || meta[0];

          if (this[handler]) {
            this.messaging.subscriptions[subscription] = postal.subscribe({
              channel: channel,
              topic: topic,
              callback: this[handler]
            }).context(this);
          }
        });
      });
    }
  },

  startWiretap(options) {
    options = options || {};

    if (options.enable && !!!postal.wireTaps.length) {
      this.wiretap = new DiagnosticsWireTap({
        name: "console",
        active: options.active || true,
        writer: function(output) {
          console.log("%cPostal message:", "color: #390", JSON.parse(output));
        }
      });
    }
  },

  stopWiretap(options) {
    options = options || {};

    if (options.kill && options.kill === true) {
      this.wiretap.removeWiretap();
    } else {
      this.wiretap.active = false;
    }
  }

};

const mixin = extend(Messenger, Events);

export default mixin;
