/*!
 * File: mcf.onepagecheckout.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true, unused: false */

(function($, window, document, undefined) {
	'use strict';

	var pluginName = 'mcfOnepageCheckout',
		defaults = {
			tagname: 'auto',
			dependencies: 'auto',
			returnSelf: 'auto',
			responseType: 'html',
			updateSelf: false,

			postStart: function(el, fromEvent, verbose, jqXHR, settings) {},
			postSuccess: function($el, response, verbose, textStatus, jqXHR) {},
			getStart: function($el, jqXHR, settings) {},
			getSuccess: function($el, response, textStatus, jqXHR) {},
			complete: function($el) {}
		};

	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);

		this._defaults = defaults;
		this._isChanged = false;
		this._depsCounter = 1;

		this._name = pluginName;
		this.init();
	}

	Plugin.prototype.init = function() {
		var self = this,
			$el = $(this.element),
			opts = this.options,
			keyUpTimer = 0,
			defaultDependencies = ['CheckoutShippingMethods', 'CheckoutPaymentMethods'];

		if (opts.tagname === 'auto') {
			var tagHint = $('input[name=response_tag]', $el).val() || '';
			opts.tagname = tagHint.split('(')[0];
		}

		switch (opts.tagname) {
			case 'CheckoutBillingAddress':
				opts.dependencies = (opts.dependencies === 'auto')
					? defaultDependencies
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? true
					: opts.returnSelf;

				break;

			case 'CheckoutShippingAddress':
				opts.dependencies = (opts.dependencies === 'auto')
					? defaultDependencies
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? true
					: opts.returnSelf;

				break;

			case 'CheckoutShippingMethods':
				opts.dependencies = (opts.dependencies === 'auto')
					? 'CheckoutPaymentMethods'
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? false
					: opts.returnSelf;

				break;

			case 'CheckoutPaymentMethods':
				opts.dependencies = (opts.dependencies === 'auto')
					? false
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? false
					: opts.returnSelf;

				break;

			case 'CheckoutAcceptTerms':
				opts.dependencies = (opts.dependencies === 'auto')
					? false
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? false
					: opts.returnSelf;

				break;

			default:
				opts.dependencies = (opts.dependencies === 'auto')
					? defaultDependencies
					: opts.dependencies;

				opts.returnSelf = (opts.returnSelf === 'auto')
					? true
					: opts.returnSelf;

				break;
		}

		$el.on('blur.mcfCheckout', 'input, select, textarea', function(evt) {
			clearTimeout(keyUpTimer);

			window.setTimeout(function() {
				var isFocused = $el.find('input, select, textarea').filter(':focus').length;
				if (!isFocused) saveData.call(self, evt.type);
				clearTimeout(keyUpTimer);
			}, 200);
		});

		$el.on('keyup.mcfCheckout', 'input:not(:radio, :checkbox), select:not(#country, #shipping_country), textarea', function(evt) {
			var target = $(evt.target);
			clearTimeout(keyUpTimer);

			keyUpTimer = setTimeout(function() {
				self._isChanged = true;
				saveData.call(self, evt.type);
			}, 1250);
		});

		$el.on('change.mcfCheckout', 'input, select, textarea', function(evt) {
			var target = $(evt.target);
			clearTimeout(keyUpTimer);

			self._isChanged = true;

			if (target.is('input:radio, #country, #shipping_country')) {
				saveData.call(self, evt.type, false);
			}
		});

		$el.on('post.mcfCheckout', function(evt) {
			self._isChanged = true;
			saveData.call(self, evt.type);
		});
	};

	var serializeData = function($wrapper) {
		return $('input, select, textarea, button', $wrapper).serialize();
	};

	var reqFilled = function(el) {
		var allInputs = $('input[type=text]', el),
			reqInputs = $('.FormItem.required input[type=text]', el),
			filledInputs = allInputs.filter(function() { return $.trim($(this).val()).length; }),
			filledReqInputs = reqInputs.filter(function() { return $.trim($(this).val()).length; });

		if (filledInputs.length === allInputs.length) return 'ALL';
		else if (filledReqInputs.length >= reqInputs.length) return 'REQ';
		else return false;
	};

	var getDependencies = function(id) {
		var that = this,
			complete = that.options.complete,
			getSuccess = that.options.getSuccess,
			getStart = that.options.getStart,
			url = '/interface/' + id,
			$el = $('#' + id),
			opts = {
				mode: 'form',
				ajax: 'true',
				responseType: that.options.responseType
			};

		if (id === 'CheckoutShippingMethods' || id === 'CheckoutPaymentMethods') {
			opts.preselect = 'false';
		}

		$.ajax({
			type: 'GET',
			url: url,
			data: opts,

			beforeSend: function(jqXHR, settings) {
				if (typeof getStart === 'function') {
					getStart($el, jqXHR, settings);
				}
			},

			success: function(html, textStatus, jqXHR) {
				that._depsCounter--;

				if (typeof getSuccess === 'function') {
					getSuccess($el, html, textStatus, jqXHR);
				}

				$el.html(html);
			},

			complete: function(jqXHR, textStatus) {
				if (that._depsCounter === 0) {
					complete($(that.element), jqXHR, textStatus);
				}
			}
		});
	};

	var saveData = function(fromEvent, verbose) {
		var that = this,
			$el = $(that.element),
			opts = that.options,
			data = serializeData($el),
			isFocused = $('input, select, textarea, label', $el).filter(':focus').length;

		verbose = (typeof verbose === undefined)
			? true
			: verbose;

		if (that._isChanged) {
			that._isChanged = false;
			$.ajax({
				type: 'POST',
				url: '/checkout/',
				data: data + '&ajax=1&responseType=' + opts.responseType,

				beforeSend: function(jqXHR, settings) {
					verbose = (isFocused > 0 || opts.returnSelf === false) ? false : true;

					if (typeof opts.postStart === "function") {
						var sendData = opts.postStart($el, fromEvent, verbose, jqXHR, settings);

						if (sendData === false) {
							return false;
						} else if (sendData && typeof sendData === 'object' && sendData.length === 2) {
							jqXHR = sendData[0];
							settings = sendData[1];
						}
					}
				},

				success: function(response, textStatus, jqXHR) {
					var html = (opts.responseType === 'json')
						? response.content
						: response;

					if (typeof opts.dependencies === 'object') {
						that._depsCounter = opts.dependencies.length;

						$.each(opts.dependencies, function(i) {
							var id = opts.dependencies[i];
							getDependencies.call(that, id, i);
						});
					} else if (opts.dependencies !== false) {
						that._depsCounter = 1;
						var id = opts.dependencies;
						getDependencies.call(that, id, false);
					} else {
						that._depsCounter = 0;

						if (typeof opts.complete === 'function') {
							opts.complete($el, response);
						}
					}

					if (opts.returnSelf && isFocused <= 0 && verbose) {
						$el.html(html).hide();
						$el.find('.Notification').remove();
						$el.show();
					}

					if (typeof opts.postSuccess === 'function') {
						opts.postSuccess($el, response, verbose, textStatus, jqXHR);
					}
				}
			});
		}
	};

	$.fn[pluginName] = function(options) {
		return this.each(function() {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
	};
})(jQuery, window, document);