define([
	"underscore",
	"chai",
	"postal",
	"source/events",
	"source/messenger"
], function (_, chai, postal, events, messenger) {

	var assert = chai.assert;
	var expect = chai.expect;
	var should = chai.should;

	describe("Messenger", function () {

		// Define a new object constructors for testing
		var Chef = function () {};
		var Waiter = function () {};
		var Waitress = function () {};

		// Extend each of them with the messenger mixin
		_.extend(Chef.prototype, events, messenger, {

			channelName: "Kitchen",
			messagesSent: [],
			messagesReceived: [],

			messages: {

			},

			subscriptions: {
				"handleOrderPlaced": "DiningRoom order.placed"
			},

			handleOrderPlaced: function (data, envelope) {
				this.messagesReceived.push(data.order);
			}

		});

		_.extend(Waiter.prototype, events, messenger, {

			channelName: "DiningRoom",
			messagesSent: [],
			messagesReceived: [],

			messages: {

			},

			subscriptions: {
				"handleOrderReady": "Kitchen order.ready"
			},

			handleOrderReady: function (data, envelope) {

			}

		});

		_.extend(Waitress.prototype, events, messenger, {

			channelName: "DiningRoom",
			messagesSent: [],
			messagesReceived: [],

			messages: {
				orderReady: "DiningRoom order.placed"
			},

			subscriptions: {
				"handleOrderReady": "Kitchen order.ready"
			},

			submitOrder: function (order) {
				this.trigger("orderReady", order);
			},

			handleOrderReady: function (data, envelope) {

			}

		});

		var _chef;
		var _waiter;
		var _waitress;

		beforeEach(function () {
			_chef = new Chef();
			_chef.configureMessaging();

			_waiter = new Waiter();
			_waiter.configureMessaging();

			_waitress = new Waitress();
			_waitress.configureMessaging();
		});

		afterEach(function () {
			if (_chef.messaging) {
				_chef.clearMessages();
				_chef.clearSubscriptions();
			}

			_chef = {};

			if (_waiter.messaging) {
				_waiter.clearMessages();
				_waiter.clearSubscriptions();
			}

			_waiter = {};

			if (_waitress.messaging) {
				_waitress.clearMessages();
				_waitress.clearSubscriptions();
			}

			_waitress = {};

			// this fixes a problem with the "should handle message subscriptions" test
			// where the Chef's handler was getting executed twice, as if it had two
			// subscriptions...running this causes it only to have one subscription, as
			// expected...would like to understand why. Probably just an issue with the
			// test fixture setup, but I would still like to understand it better.
			postal.utils.reset();
		});

		describe("mixin", function () {

			it("should provide a means of initializing messaging", function () {
				expect(_chef.configureMessaging).to.exist;
			});

			it("should support messaging initialization", function () {
				_chef = new Chef();
				expect(_chef.messaging).to.not.exist;

				_chef.configureMessaging();
				expect(_chef.messaging).to.exist;
			});

			it("should expose a method for publishing messages", function () {
				expect(_chef.publish).to.exist;
			});

			it("should expose a method for subscribing to messages", function () {
				expect(_chef.subscribe).to.exist;
			});

			it("should support event triggering", function () {
				expect(_chef.trigger).to.exist;
			});

		});

		describe("messages", function () {

			it("should initialize configured messages", function () {
				expect(_waitress.messaging.messages.orderReady).to.exist;
			});

		});

		describe("subscriptions", function () {

			it("should initialize configured subscriptions", function () {
				expect(_chef.messaging.subscriptions["DiningRoom order.placed"]).to.exist;
				expect(_waiter.messaging.subscriptions["Kitchen order.ready"]).to.exist;
				expect(_waitress.messaging.subscriptions["Kitchen order.ready"]).to.exist;
			});

			it("should handle message subscriptions", function () {
				_waitress.submitOrder({ order: "Cheeseburger, fries and a Coke" });
				expect(_chef.messagesReceived.length === 1).to.be.true;
			});

		});

	});

});
