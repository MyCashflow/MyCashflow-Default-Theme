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
			return_self: 'auto',
			response_type: 'html',

			post_start: function(el, fromEvent, verbose, jqXHR, settings) {},
			post_success: function($el, response, verbose, textStatus, jqXHR) {},
			get_start: function($el, jqXHR, settings) {},
			get_success: function($el, response, textStatus, jqXHR) {},
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

				opts.return_self = (opts.return_self === 'auto')
					? true
					: opts.return_self;

				break;

			case 'CheckoutShippingAddress':
				opts.dependencies = (opts.dependencies === 'auto')
					? defaultDependencies
					: opts.dependencies;

				opts.return_self = (opts.return_self === 'auto')
					? true
					: opts.return_self;

				break;

			case 'CheckoutShippingMethods':
				opts.dependencies = (opts.dependencies === 'auto')
					? 'CheckoutPaymentMethods'
					: opts.dependencies;

				opts.return_self = (opts.return_self === 'auto')
					? false
					: opts.return_self;

				break;

			case 'CheckoutPaymentMethods':
				opts.dependencies = (opts.dependencies === 'auto')
					? false
					: opts.dependencies;

				opts.return_self = (opts.return_self === 'auto')
					? false
					: opts.return_self;

				break;

			case 'CheckoutAcceptTerms':
				opts.dependencies = (opts.dependencies === 'auto')
					? false
					: opts.dependencies;

				opts.return_self = (opts.return_self === 'auto')
					? false
					: opts.return_self;

				break;

			default:
				opts.dependencies = (opts.dependencies === 'auto')
					? defaultDependencies
					: opts.dependencies;

				opts.return_self = (opts.return_self === 'auto')
					? true
					: opts.return_self;

				break;
		}

		// When focus leaves the fieldset
		$el.on('blur.mcfCheckout', 'input, select, textarea', function(evt) {
			clearTimeout(keyUpTimer);

			// Check after a wait if the focus really left the fieldset
			window.setTimeout(function() {
				var isFocused = $el.find('input, select, textarea').filter(':focus').length;
				if (!isFocused) saveData.call(self, evt.type);
				clearTimeout(keyUpTimer);
			}, 800);
		});

		// If user doesn't do anything for a while, update the checkout behind
		$el.on('keyup.mcfCheckout', 'input:not(:radio, :checkbox), select:not(#country, #shipping_country), textarea', function(evt) {
			var target = $(evt.target);
			clearTimeout(keyUpTimer);

			keyUpTimer = setTimeout(function() {
				self._isChanged = true;
				saveData.call(self, evt.type);
			}, 3000);
		});

		// On country, shipping or payment method change, update the checkout immediately
		$el.on('change.mcfCheckout', 'input, select, textarea', function(evt) {
			var target = $(evt.target);
			clearTimeout(keyUpTimer);

			self._isChanged = true;

			if (target.is('input:radio, #country, #shipping_country, .DefineShippingMethod select')) {
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

	var getDependencies = function(id) {
		var that = this,
			complete = that.options.complete,
			get_success = that.options.get_success,
			get_start = that.options.get_start,
			url = '/interface/' + id,
			$el = $('#' + id),
			opts = {
				mode: 'form',
				ajax: 'true',
				response_type: that.options.response_type
			};

		if (id === 'CheckoutShippingMethods' || id === 'CheckoutPaymentMethods') {
			var $responseTag = $el.find('[name=response_tag]');
			var preselect = ($responseTag.length) ? $responseTag.val().match(/preselect:(\'|#039;)(true|false)(\'|#039;)/) : null;
			var includetax = ($responseTag.length) ? $responseTag.val().match(/includetax:(\'|#039;)(true|false)(\'|#039;)/) : null;
			preselect = (preselect && preselect[2] === "true");
			includetax = (includetax && includetax[2] === "true");
			opts.preselect = preselect;
			opts.includetax = includetax;
		}

		$.ajax({
			type: 'GET',
			url: url,
			data: opts,
			cache: false,

			beforeSend: function(jqXHR, settings) {
				if (typeof get_start === 'function') {
					get_start($el, jqXHR, settings);
				}
			},

			success: function(html, textStatus, jqXHR) {
				that._depsCounter--;

				$el.html(html);

				if (typeof get_success === 'function') {
					get_success($el, html, textStatus, jqXHR);
				}
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
				data: data + '&ajax=1&response_type=' + opts.response_type,
				cache: false,

				beforeSend: function(jqXHR, settings) {
					verbose = (isFocused > 0 || opts.return_self === false) ? false : true;

					if (typeof opts.post_start === "function") {
						var sendData = opts.post_start($el, fromEvent, verbose, jqXHR, settings);

						if (sendData === false) {
							return false;
						} else if (sendData && typeof sendData === 'object' && sendData.length === 2) {
							jqXHR = sendData[0];
							settings = sendData[1];
						}
					}
				},

				success: function(response, textStatus, jqXHR) {
					var html = (opts.response_type === 'json')
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

					if (opts.return_self && isFocused <= 0 && verbose) {
						$el.html(html).hide();
						$el.find('.Notification').remove();
						$el.show();
					}

					if (typeof opts.post_success === 'function') {
						opts.post_success($el, response, verbose, textStatus, jqXHR);
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
