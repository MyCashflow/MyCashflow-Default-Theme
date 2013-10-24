/*!
 * File: mcf.checkout.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	// Uncomment next lines to make phone number required
	/* var $phoneInput = $("#phone");
	$phoneInput.closest(".FormItem").addClass("required").closest("form").submit(function(event) {
		if ($phoneInput.val() === "") {
			event.preventDefault();
			alert("Puhelinnumero on pakollinen tieto.");
		}
	}); */

	$('.TermsLink').attr('href', '/interface/TermsAndConditions').colorbox(
		$.extend({}, mcf.colorboxOpts, {
			width: '80%',
			height: '80%',
			title: mcf.Lang.TermsAndConditions
		})
	);

	$('#DisplayCheckoutForm').colorbox(
		$.extend({}, mcf.colorboxOpts, {
			width: '640px',
			inline: true,
			href: '#CheckoutThanksRegistrationForm'
		})
	);

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

			post_start: function(el, fromEvent, verbose) {
				// If the post updates the sent element it's verbose
				if (verbose) el.append('<div class="CheckoutLoader"></div>');
				// If the post is still pending, disable the submit button
				el.closest('form').find('button.SubmitButton').prop('disabled', true);
			},

			post_success: function(el, response, verbose) {
				var errs = response.notifications,
					$scrollToEl = el.prevAll('h2');

				if (verbose && errs && errs.length > 0) {
					$.scrollTo($scrollToEl, {
						axis: 'y',
						duration: 350,
						offset: {
							left: 0,
							top: -36
						}
					});
				}

				if (verbose) {
					$('.CheckoutLoader', el).remove();
					$('select', el).customSelect();
				}

				if (el.attr('id') === 'CheckoutShippingAddress') {
					shippingAddressToggler(el);
				}

				mcf.handleResponse({ response: response, disableNotifications: !verbose });
			},

			get_start: function(el) {
				el.append('<div class="CheckoutLoader"></div>'); // Append loading indicator
			},

			get_success: function(el, response) {
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

			complete: function(el) {
				// When we're complete, enable the submit again
				el.closest('form').find('button.SubmitButton').prop('disabled', false);
				// Then get the preview cart with updated data
				$.ajax({
					type: 'GET',
					url: '/interface/Helper/',
					data: { file: 'helpers/preview-cart' },
					success: function(response) { $('#CartTable').html(response); }
				});
			}
		});

		$('#OnePageCheckout form').submit(function(event) {
			if ($('#CheckoutShippingAddressToggle').find('input').length && $('#CheckoutShippingAddressToggle').find('input').prop('checked') === false) {
				$('#CheckoutShippingAddress').find('input[type!="hidden"]').val('');
				return true;
			} else {
				return true;
			}
		});


		var $preview = $('#PreviewContent'),
			$checkoutNavigation = $('#CheckoutNavigation'),
			previewHeight = $preview.height(),
			contentHeight = $('#OnePageCheckout').innerHeight(),
			headerHeight;

		$(window).scroll(function() {
			headerHeight = headerHeight || $('#Header').outerHeight();
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

			if (scrollTop > headerHeight) {
				$checkoutNavigation.addClass('Fixed');
			} else {
				$checkoutNavigation.removeClass('Fixed');
			}

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

  function updatePickupMethod() {
    var $selectedMethod = $('[name="shipping_method[id]"]:checked').closest('.ShippingMethodWrapper');
		$selectedMethod.addClass('SelectedMethod');
		$selectedMethod.siblings().removeClass('SelectedMethod');
  }

	function shippingAddressToggler(element) {
		var $shippingAddress = element || $('#CheckoutShippingAddress'),
			$shippingMethods = $('#CheckoutShippingMethods'),
			$paymentMethods = $('#CheckoutPaymentMethods'),
			$shippingMethodWrappers = $('.ShippingMethodWrapper');

		// Add SelectedMethod classname to selected method
		var $methodSelectors = $shippingMethods.add($paymentMethods).find('input:radio');
    var $pickupSelects = $shippingMethods.find('.ReplacedSelect');

    $shippingMethods.on('click', 'input:radio', function() {
      updatePickupMethod();
    });

    $pickupSelects.change(function() {
		  var $methodRadio = $(this).closest('.ShippingMethodWrapper').find('input:radio'); 
		  $methodRadio.attr('checked', true);
      updatePickupMethod();
    });

		// Hide and show shipping address wrapper and delete shipping address
		var $shippingAddressToggleWrap = $('#CheckoutShippingAddressToggle'),
			$shippingAddressToggler = $('input', $shippingAddressToggleWrap),
			$shippingAddressRemover = $('#RemoveShippingAddress');

		$shippingAddressToggleWrap.show();
		$shippingAddressRemover.hide();

		var shouldBeShown = function() {
			var rtrn = false;
			var inputs = $shippingAddress.find('.FormItem input[type="text"]');
			if ($shippingAddressToggler.prop('checked') === true) {
				rtrn = true;
			}
			inputs.each(function() {
				if ($(this).val() !== '') {
					rtrn = true;
					return;
				}
			});
			return rtrn;
		}

		if (shouldBeShown()) {
			$shippingAddressToggler.prop('checked', true);
			$shippingAddressToggleWrap.next().show();
			$shippingAddressRemover.show();
		} else {
			$shippingAddressToggler.prop('checked', false);
			$shippingAddressToggleWrap.next().hide();
			$shippingAddressRemover.hide();
		}

		$shippingAddressToggler.click(function() {
			var $wrapper = $shippingAddressToggleWrap.next();

			if ($(this).prop('checked') === true) {
				$wrapper.fadeIn(125);
				$shippingAddressRemover.fadeIn(125);
			} else {
				$wrapper.fadeOut(125);
				$shippingAddressRemover.fadeOut(125);
			}
		});

		$('a', $shippingAddressRemover).click(function(evt) {
			evt.preventDefault();
			$shippingAddress.find('input').not(':hidden').val('');
			if ($('body').hasClass('SinglePageCheckout')) {
				$shippingAddress.trigger('post.mcfCheckout');
			}
			$shippingAddressToggler.prop('checked',false);
			$shippingAddressToggleWrap.next().hide();
			$shippingAddressRemover.hide();
		});
	}

	shippingAddressToggler();
	updatePickupMethod();
});