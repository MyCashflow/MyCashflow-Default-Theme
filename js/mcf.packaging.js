;(function($, window, document, undefined) {
	var pluginName = 'mcfPackaging';
	var defaults = {
		insert: 'before',
		label: 'Lisää paketointi?',
		detailsText: '--- PAKETOINTI ---'
	};

	function Plugin(element, options) {
		this.$element = $(element); // Anchor element, used for checkbox insertion.
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	$.extend(Plugin.prototype, {
		init: function() {
			var self = this;

			// Create the checkbox for toggling packaging.
			self.$formItem = $('<div class="FormItem" id="AddPackaging">' +
					'<label><input type="checkbox"/>' + self.settings.label + '</label>' +
				'</div>');
			self.$element[self.settings.insert](self.$formItem);
			self.$checkbox = self.$formItem.find('input');

			// Toggle the packaging product.
			self.$checkbox.change(function() {
				if (self.settings.productId) {
					self.$checkbox.prop('disabled', true);

					if (self.$checkbox.is(':checked')) {
						mcf.publish('AddProducts', {
							data: { products: [{ product_id: self.settings.productId }] },
							trigger: $('<div/>'),
							success: function() {
								self.refreshCheckbox();
								self.refreshCart();
								self.$checkbox.removeAttr('disabled');
								if ($.isFunction(self.settings.onChange)) {
									self.settings.onChange(self.$formItem);
								}
							}
						});
					} else {
						var cartProductId = self.deleteUrl.split('/')[3];
						mcf.publish('RemoveProduct', {
							data: cartProductId,
							success: function() {
								self.refreshCart();
								self.$checkbox.removeAttr('disabled');
								if ($.isFunction(self.settings.onChange)) {
									self.settings.onChange(self.$formItem);
								}
							}
						});
					}
				} else {
					var $details = $('#OrderComments');
					if (self.$checkbox.is(':checked')) {
						$details.val($details.val() + "\n" + self.settings.detailsText);
					} else {
						$details.val($details.val().replace("\n" + self.settings.detailsText, ''));
					}
				}
			});

			if (self.settings.productId) {
				self.refreshCheckbox();
			}
		},

		// Checks if the packaging product is in the
		// cart and stores the product's delete URL.
		refreshCheckbox: function() {
			var self = this;
			var dfd = $.get('/interface/CartProducts', { ajax: 1, helper: 'helpers/packaging-products' });

			dfd.success(function(res) {
				var $cartItems = $('<div/>').append(res);
				var $cartItem = $cartItems.find('#ProductID-' + self.settings.productId);

				if ($cartItem.length) {
					self.$checkbox.prop('checked', true);
					self.deleteUrl = $cartItem.find('a').attr('href');
				}
			});
		},

		refreshCart: function() {
			$.ajax({
				type: 'GET',
				url: '/interface/Helper/',
				data: { file: 'helpers/preview-cart' },
				success: function(response) { $('#CartTable').html(response); }
			});
		}
	});

	$.fn[pluginName] = function(options) {
		this.each(function() {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
		return this;
	};
})(jQuery, window, document);
