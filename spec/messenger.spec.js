var _extend = require("lodash/object/assign");
var chai = require("chai");
var postal = require("postal");
var messenger = require("../dist/messenger");

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should;

describe("Messenger", function () {

	// Define a new object constructors for testing
	var Chef = function () {};
	var Waiter = function () {};
	var Waitress = function () {};

	// Extend each of them with the messenger mixin
	_extend(Chef.prototype, messenger, {

		channelName: "Kitchen",
		messagesSent: [],
		messagesReceived: [],

		messages: {},

		subscriptions: {
			"handleOrderPlaced": "DiningRoom order.placed"
		},

		handleOrderPlaced: function (data, envelope) {
			this.messagesReceived.push(data.order);
		}

	});

	_extend(Waiter.prototype, messenger, {

		channelName: "DiningRoom",
		messagesSent: [],
		messagesReceived: [],

		messages: {},

		subscriptions: {
			"handleOrderReady": "Kitchen order.ready"
		},

		handleOrderReady: function (data, envelope) {}

	});

	_extend(Waitress.prototype, messenger, {

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

		handleOrderReady: function (data, envelope) {}

	});

	var _chef;
	var _waiter;
	var _waitress;

	beforeEach(function () {
		postal.reset();

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

		it("should handle message subscriptions", function (done) {
			_chef.handleOrderPlaced = function (data, env) {
				expect(data.order).to.equal("Cheeseburger, fries and a Coke");
				done();
			};

			_chef.configureMessaging();

			_waitress.submitOrder({ order: "Cheeseburger, fries and a Coke" });
		});

	});

});
