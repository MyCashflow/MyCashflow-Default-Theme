/*!
 * File: mcf.events.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */
/*global console:false, mcf:false */

$(function() {
	'use strict';

	mcf.subscribers = [];

	mcf.subscribe = function(name, func) {
		if (typeof $.subscribe === 'undefined') {
			console.warn('MyCashflow Pub/Sub: Plugin not loaded!');
			return false;
		}

		$.subscribe(name, func);
		mcf.subscribers.push(name);
	};

	mcf.publish = function(name, opts) {
		if (typeof $.publish === 'undefined') {
			console.warn('MyCashflow Pub/Sub: Plugin not loaded!');
			return false;
		}

		if (!mcf.isSubscribed(name)) {
			console.warn("MyCashflow Pub/Sub: Subscriber doesn't exist!");
			return false;
		}

		$.extend(opts, {
			category: name,
			showTools: false
		});

		$.publish(name, [opts]);
	};

	mcf.isSubscribed = function(name) {
		// Returns true if a subscription for a given
		// name exists inside the subscription array.
		return ($.inArray(name, mcf.subscribers) > -1);
	};

	mcf.isJSON = function(data) {
		try {
			$.parseJSON(data);
		} catch (e) {
			return false;
		}

		return true;
	}

	mcf.raiseNotification = function(message, category, klass, showTools) {
		// All of the notifications should be
		// added into the notification center.
		var $notification = $('<div class="Notification">' + message + '</div>'),
			$notificationCenter = $('#NotificationCenter');

		// We'll want to have one notification
		// per event category to avoid clutter.
		category = (typeof category !== 'undefined')
			? category + 'Notification'
			: 'UndefinedNotification';

		var $oldNotifications = $('.' + category);
		$oldNotifications.remove();

		$notification.addClass(klass);
		$notification.addClass(category);
		$notification.append('<span class="Close"></span>');
		$notification.appendTo($notificationCenter);
		$notification.hide().fadeIn(250);

		if (typeof showTools !== 'undefined' && showTools) {
			var toolsHtml = [];

			toolsHtml.push('<p>');
			toolsHtml.push('<span class="Separator"><a href="#Close" class="Close">' + mcf.Lang.HideNotification + '</a></span>');
			toolsHtml.push('<span class="Separator"><a href="/cart/" class="Close">' + mcf.Lang.ShoppingCartEdit + '</a></span>');
			toolsHtml.push('<span class="Separator"><a href="/checkout/" class="Close">' + mcf.Lang.OrderProducts + '</a></span>');
			toolsHtml.push('</p>');

			$notification.append(toolsHtml.join(''));
		}

		// Elements with the class "Close" will
		// close the notification when clicked.
		$('.Close', $notification).click(function() {
			// Close just the containing notification.
			$(this).closest($notification).remove();
		});

		// Reset the notification timer - this'll
		// makes sure that all of the current and
		// new notifications are shown for X secs.
		window.clearTimeout(mcf.NotificationTimer);

		mcf.NotificationTimer = window.setTimeout(function() {
			$('.Notification', '#NotificationCenter').fadeOut(250);
		}, 6000);

		return $notification;
	};

	mcf.handleResponse = function(opts) {
		var $notifications = null,
			notificationClass = '.Notification';

		// Skip the notifications?
		if (typeof opts.disableNotifications !== 'undefined') {
			if (opts.disableNotifications) return false;
		}

		if (typeof opts.response === 'string' && mcf.isJSON(opts.response)) {
			// If the response is in JSON format,
			// we'll just grab the notifications.
			$notifications = (opts.response !== '') ? $($.parseJSON(opts.response).notifications) : $();
		} else if (typeof opts.response === 'object') {
			// The JSON seems to be already parsed
			$notifications = $(opts.response.notifications);
		} else {
			// It must mean that we're getting HTML back
			// If the response is a notification
			// element, $.filter will do the job.
			$notifications = $(opts.response).filter(notificationClass);

			// If the response is a full page,
			// then we'll have to use $.find().
			if (!$notifications.length) {
				$notifications = $(opts.response).find(notificationClass);
			}
		}

		if ($notifications.not('.Error')) {
			// Invoke the success handler if one
			// was provided in the options hash.
			if (typeof opts.success !== 'undefined') {
				opts.success.call(opts.response);
			}
		} else {
			// Invoke the error handler if one
			// was provided in the options hash.
			if (typeof opts.error !== 'undefined') {
				opts.error.call(opts.response);
			}
		}

		$.each($notifications, function() {
			if (typeof opts.notifyClass !== 'undefined') {
				$(this).removeClass('Success Error');
				$(this).addClass(opts.notifyClass);
			}

			var klass = $(this).attr('class');
			mcf.raiseNotification($(this).html(), opts.category, klass, opts.showTools);
		});

		return false;
	};

	$(document).ajaxComplete(function(evt, xhr, opts) {
		if (typeof opts.custom !== 'undefined') {
			var custom = opts.custom;
			$.extend(custom, { response: xhr.responseText });
			mcf.handleResponse(custom);
		}
	});

	mcf.subscribe('UpdateCampaignCode', function(evt, opts) {
		var $campaignCodeWrapper = $('#SubmitCampaignCode'),
			$cartWrapper = ($('#PreviewContent').length)
				? $('#CartTable')
				: $('#CartForm');

		$cartWrapper.append('<div class="CheckoutLoader"></div>');

		$.ajax({
			type: 'POST',
			url: '/cart/',

			custom: opts,
			data: $.extend(opts.data, { ajax: 1, response_type: 'json' }),
			dataType: 'json',

			success: function(response) {
				$campaignCodeWrapper.html(response.content);

				$.ajax({
					type: 'GET',
					url: '/interface/Helper/',
					data: { file: 'helpers/' + $campaignCodeWrapper.data('helper') },
					success: function(response) {
						$cartWrapper.html(response);
						$('.CheckoutLoader', $cartWrapper).remove();
					}
				});
			}
		});
	});

	mcf.subscribe('AddProducts', function(evt, opts) {
		// If the resposive layout's link is there, use it as wrapper
		var $miniCartWrapper = ($('#ResponsiveCartLink').length) ? $('#ResponsiveCartLink') : $('#MiniCartWrapper'),
			$miniCartLoader = $('<div class="CheckoutLoader"></div>'),
			$trigger = opts.trigger,
			origTrigger = $trigger.html();

		$miniCartLoader.appendTo($miniCartWrapper);

		$.ajax({
			type: 'POST',
			url: '/cart/',

			custom: $.extend(opts, { showTools: true }),
			data: $.extend(opts.data, { ajax: 1, response_type: 'json' }),
			dataType: 'json',

			beforeSend: function() {
				var $notification = mcf.raiseNotification(mcf.Lang.AddingToCart, 'AddProducts');
				$trigger.html('<span class="Icon Adding"></span> ' + mcf.Lang.AddingButtonText).addClass('AddingToCart');
			},

			success: function(response) {
				if (typeof response === 'object' && response.notifications.length) {
					var errors = $(response.notifications).wrap('<div />').parent().find('.Error').length;
					if (errors > 0) {
						$trigger.text(mcf.Lang.AddToCart);
					} else {
						$trigger.html('<span class="Icon Added"></span> ' + mcf.Lang.AddedButtonText).addClass('AddedToCart');
					}
				}

				$miniCartLoader.remove();

				$.ajax({
					type: 'GET',
					url: '/interface/Helper',
					data: { file: 'helpers/minicart' },
					success: function(response) { $miniCartWrapper.html(response); }
				});
			},

			error: function() {
				$trigger.text(mcf.Lang.AddToCart);
			}
		});
	});

	// Helper function for updating the full cart content via ajax
	mcf.updateFullCartContent = function($el, helper) {
		var helperFile = (typeof helper !== 'undefined') ? helper : 'full-cart';
		if (helperFile !== undefined && $el !== undefined) {
			$.ajax({
				type: 'GET',
				url: '/interface/Helper',
				data: { file: 'helpers/' + helperFile },
				success: function(response) {
					$el.html(response);
					if (!$('#CartTable', $el).length) {
						$('.CheckoutButton').hide();
						$('#SubmitCampaignCode').hide();
					} else {
						$('.CheckoutButton').show();
						$('#SubmitCampaignCode').show();
					}
				}
			});
		}
	}

	mcf.subscribe('RemoveProduct', function(evt, opts) {
		var $cartFormWrapper = $('#CartForm'),
			isFullCart = ($cartFormWrapper.length) ? true : false,
			$cartFormLoader = $('<div class="CheckoutLoader"></div>');

		if (isFullCart) $cartFormLoader.appendTo($cartFormWrapper);

		$.ajax({
			type: 'GET',
			url: '/cart/delete/' + opts.data,
			data: { ajax: 1 },
			dataType: 'html',
			custom: $.extend(opts, { notifyClass: '' }),
			success: function(response) {
				if (isFullCart) {
					$cartFormLoader.remove();
					mcf.updateFullCartContent($cartFormWrapper);
				} else {
					if ($('#MiniCartWrapper ul li:visible').length > 1) {
						$.ajax({
							type: 'GET',
							url: '/interface/CartSubTotal',
							success: function(price) {
								$('#MiniCartFooter').find('.SubTotal').html(price);
							}
						});
					} else {
						$.ajax({
							type: 'GET',
							url: '/interface/Helper?file=helpers%2Fminicart',
							success: function(html) {
								$('#MiniCartWrapper').html(html);
							}
						});
					}
				}
			}
		});
	});

	mcf.subscribe('UpdateCart', function(evt, opts) {
		var $cartForm = $('#CartForm'),
			$cartFormLoader = $('<div class="CheckoutLoader"></div>');

		$cartFormLoader.appendTo($cartForm);

		$.ajax({
			type: 'POST',
			url: '/cart/update/',

			custom: opts,
			data: (opts && opts.data) ? $.extend(opts.data, { ajax: 1 }) : { ajax: 1 },
			dataType: 'html',

			success: function(response) {
				var cart_target = $cartForm.data('cart_target');
				$cartFormLoader.remove();
				if (cart_target === 'checkout') {
					window.location.replace("/" + cart_target + "/");
				} else {
					mcf.updateFullCartContent($cartForm);
				}
			}
		});
	});

	mcf.subscribe('Checkout', function(evt, opts) {
		$.ajax({
			type: 'POST',
			url: '/checkout/',

			custom: opts,
			data: $.extend(opts.data, { ajax: 1, response_type: 'json' }),
			dataType: 'json',

			success: function(response) {
				$.ajax({
					type: 'GET',
					url: '/interface/Helper/',
					data: { file: 'helpers/preview-cart' },
					success: function(response) { $('#CartTable').replaceWith(response); }
				});
			}
		});
	});
});