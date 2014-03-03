/*!
 * File: mcf.nosto.js
 * Part of MyCashFlow's default theme.
 * Translates Nosto recommendations into product lists.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */
/*global mcf:false */

;(function ($, window, document, undefined) {
	var pluginName = 'mcfNosto';
	var defaults = {};

	function Plugin(elem, options) {
		this.$elem = $(elem);
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this._timeout = null;
		this._timer = null;
		this.init();
	}

	Plugin.prototype = {
		init: function () {
			var self = this;

			// Cancel after a while.
			self._timeout = setTimeout(function () {
				clearInterval(self._timer);
				if ($.isFunction(self.settings.error)) {
					self.settings.error.call(self, pluginName + ": Nosto didn't return anything for " + self.$elem.attr('id') + ".");
				}
			}, 10000);

			// Dirty-check for state.
			self._timer = setInterval(function () {
				if (self.$elem.children().length) {
					clearTimeout(self._timeout);
					clearInterval(self._timer);
					self.replaceNosto(self.$elem, self.settings.success, self.settings.error);
				}
			}, 250);
		},
		replaceNosto: function ($elem, success, error) {
			var self = this;

			// Get the product IDs.
			var ids = [];
			$elem.children().each(function () {
				ids.push($(this).attr('data-nosto-id'));
			});
			if (!ids) {
				return false;
			}

			// Get the Nosto ref.
			var ref = $elem.children().first().attr('data-nosto-url');
			ref = ref.split('?');
			ref = ref.length ? ref[1] : '';

			// Replace with /interface/.
			ids = ids.join('|');
			var params = $elem.attr('data-nosto-params');
			$.ajax({
				type: 'GET',
				url: '/interface/Products?id=' + ids + (params ? '&' + params : ''),
				success: function (res) {
					// Add the Nosto reference to product links.
					$elem.html(res).find('a[href*="/product/"]').each(function () {
						var href = $(this).attr('href');
						$(this).attr('href', href + '?' + ref);
					});
					if ($.isFunction(self.settings.success)) {
						self.settings.success.call(self);
					}
				},
				error: function () {
					if ($.isFunction(self.settings.error)) {
						self.settings.error.call(self, pluginName + ": The /interface/ call failed for " + self.$elem.attr('id') + ".");
					}
				}
			});
		}
	};

	$.fn[pluginName] = function (options) {
		this.each(function () {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
		return this;
	};
})(jQuery, window, document);