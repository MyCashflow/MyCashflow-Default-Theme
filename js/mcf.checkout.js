/*!
 * File: mcf.checkout.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	$('.TermsLink').attr('href', '/interface/TermsAndConditions').colorbox({
		width: '62%',
		height: '80%',
		opacity: 0.5,
		fixed: true,
		title: $('.TermsLink').text()
	});

	$('#DisplayCheckoutForm').colorbox({
		opacity: 0.5,
		width: '640px',
		fixed: true,
		inline: true,
		href: '#CheckoutThanksRegistrationForm'
	});

	//--------------------------------------------------------------------------
	// One-Page Checkout
	//--------------------------------------------------------------------------

	if ($('#OnePageCheckout').length) {

		// Login in a modal window.
		$('#CheckoutLoginButton').colorbox({
			opacity: 0.5,
			width: '640px',
			fixed: true,
			href: '/interface/Login?on_success=/checkout/proceed/&on_error=/checkout/proceed/&form_info=CheckoutExistingCustomerInfo'
		});

		// Sleek checkout stage indicator.
		$('#CheckoutStage').localScroll({
			axis: 'y',
			duration: 350,
			offset: {
				left: 0,
				top: -45
			}
		});

		$('.TagWrapper').mcfOnepageCheckout({
			tagname: 'auto', // Detect from hidden input
			dependencies: 'auto', // Detect from tagname
			return_self: 'auto', // Detect from tagname
			response_type: 'json', // We want to have notifications as separate so we ask for json back

			postStart: function(el, fromEvent, verbose) {
				// If the post updates the sent element it's verbose
				if (verbose) el.append('<div class="CheckoutLoader"></div>');
			},

			postSuccess: function(el, response, verbose) {
				var $scrollToEl = el.prevAll('h2');

				$.scrollTo($scrollToEl, {
					axis: 'y',
					duration: 350,
					offset: {
						left: 0,
						top: -36
					}
				});

				if (verbose) {
					$('.CheckoutLoader', el).remove();
					$('select', el).customSelect();
				}

				mcf.handleResponse({ response: response });
			},

			getStart: function(el) {
				el.append('<div class="CheckoutLoader"></div>'); // Append loading indicator
			},

			getSuccess: function(el) {
				$('.CheckoutLoader', el).remove();
				$('select', el).customSelect();

				// Add SelectedMethod class to selected method's wrapper
				var selectedMethodClass = 'SelectedMethod';
				if (el.is('#CheckoutShippingMethods, #CheckoutPaymentMethods')) {
					// Get the method selection inputs.
					var $inputs = $('input:radio', el);

					// Select method on click.
					$inputs.click(function() {
						$(this)
							// Select THIS method.
							.closest('div')
							.addClass(selectedMethodClass)

							// Unselect others.
							.siblings('div')
							.removeClass(selectedMethodClass);
					});

					// Select current methods.
					$inputs
						.filter(':checked')
						.closest('div')
						.addClass(selectedMethodClass);
				}
			},

			complete: function(response) {
				$.ajax({
					type: 'GET',
					url: '/interface/Helper/',
					data: { file: 'helpers/preview-cart' },
					success: function(response) { $('#CartTable').html(response); }
				});
			}
		});

		var $preview = $('#PreviewContent'),
			$checkoutNavigation = $('#CheckoutNavigation'),
			previewHeight = $preview.height(),
			contentHeight = $('#OnePageCheckout').innerHeight(),
			headerHeight = $('#Main').offset().top;

		$(window).scroll(function() {
			var inView = $('h2 > span[id]:in-viewport', '#Primary').map(function() {
				return '#' + this.id;
			}).get();

			var $link = $('#CheckoutStage a').filter(function() {
				var href = $(this).attr('href');
				return $.inArray(href, inView) !== -1
					? true
					: false;
			}).parent('li');

			var scrollTop = $(window).scrollTop();

			if ($link.length) {
				$('#CheckoutStage li').removeClass('CurrentCheckoutStage');
				$link.addClass('CurrentCheckoutStage');
			}

			if (scrollTop > $('#Header').outerHeight()) $checkoutNavigation.addClass('Fixed');
			else $checkoutNavigation.removeClass('Fixed');

			if ($preview.height() <= contentHeight) {
				$preview.parent().css('height', $('#Primary').css('height'));

				var overThreshold = $(window).scrollTop() + previewHeight > $('#Footer').offset().top;
				if (overThreshold) $preview.addClass('Absolute');
				else if (scrollTop > headerHeight) $preview.removeClass('Absolute').addClass('Fixed');
				else $preview.removeClass('Absolute Fixed');
			}
		});
	}

	//--------------------------------------------------------------------------
	// All Checkout Types
	//--------------------------------------------------------------------------

	var $shippingAddress = $('#CheckoutShippingAddress'),
		$shippingMethods = $('#CheckoutShippingMethods'),
		$paymentMethods = $('#CheckoutPaymentMethods');

	// Add SelectedMethod classname to selected method
	var $methodSelectors = $shippingMethods.add($paymentMethods).find('input:radio');

	$methodSelectors.click(function() {
		var $methodDiv = $(this).closest('div');
		$methodDiv.addClass('SelectedMethod');
		$methodDiv.siblings('div').removeClass('SelectedMethod');
	});

	// Hide and show shipping address wrapper and delete shipping address
	var $shippingAddressToggleWrap = $('#CheckoutShippingAddressToggle'),
		$shippingAddressToggler = $('input', $shippingAddressToggleWrap),
		$shippingAddressRemover = $('#RemoveShippingAddress');

	$shippingAddressToggleWrap.show();
	$shippingAddressRemover.hide();

	var shouldBeShown = function() {
		var rtrn = false;
		var req = $shippingAddress.find('.FormItem.required input[type="text"]');
		if ($shippingAddressToggler.attr('checked') === 'checked') {
			rtrn = true;
		}
		req.each(function() {
			if ($(this).val() !== '') {
				rtrn = true;
				return;
			}
		});
		return rtrn;
	}

	if (shouldBeShown()) {
		$shippingAddressToggler.attr('checked', true);
		$shippingAddressToggleWrap.next().show();
		$shippingAddressRemover.show();
	} else {
		$shippingAddressToggler.attr('checked', false);
		$shippingAddressToggleWrap.next().hide();
		$shippingAddressRemover.hide();
	}

	$shippingAddressToggler.click(function() {
		var $wrapper = $shippingAddressToggleWrap.next();

		if ($(this).attr('checked') === 'checked') {
			$wrapper.fadeIn(125);
			$shippingAddressRemover.fadeIn(125);
		} else {
			$wrapper.fadeOut(125);
			$shippingAddressRemover.fadeOut(125);
		}
	});

	$('a', $shippingAddressRemover).click(function(evt) {
		$shippingAddress.find('input').not(':hidden').val('');
		$shippingAddress.trigger('post.mcfCheckout');
		$shippingAddressToggler.attr('checked',false);
		$shippingAddressToggleWrap.next().hide();
		$shippingAddressRemover.hide();

		evt.preventDefault();
	});
});