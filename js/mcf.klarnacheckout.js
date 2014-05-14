/*!
 * File: mcf.klarnacheckout.js
 * Part of MyCashFlow's default theme.
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	// Check if we're on Klarna Checkout view
	if ($('#KlarnaCheckoutWrapper').length) {

		// If the mcf.pubsub.js isn't loaded, don't even show the campaign code field
		if (typeof mcf === 'undefined') {
			window.mcf = window.mcf || {};
			if (typeof mcf.isSubscribed === 'undefined' || !mcf.isSubscribed('UpdateCampaignCode')) {
				$('#SubmitCampaignCode').hide();
			}
		}

		// Fix the link to shop's own thanks-page from the Klarna's thanks-page
		var loc = window.location.href;
		var thanksHash = loc.substr(loc.lastIndexOf('/'));
		$('#KlarnaCheckoutThanksLink').attr('href', '/checkout/thanks' + thanksHash);

		// Function that updates the Klarna Checkout frame when called
		mcf.updateKlarnaCheckoutFrame = function() {
			var $kco = $('#KlarnaCheckout');
			var mobile = (window.matchMedia('(max-width: 768px)').matches) ? true : false;
			if ($kco.length) {
				$.ajax({
					type: 'GET',
					url: '/interface/KlarnaCheckout',
					data: (mobile) ? { layout: 'mobile' } : { layout: 'desktop' },
					success: function(response) {
						$kco.html(response);
					}
				});
			}
		}

		// And then do the first update on page load
		mcf.updateKlarnaCheckoutFrame();

		// Handle the minumum shipping info that is asked to determine shipping costs with Klarna Checkout
		var $kcoShippingInfo = $('#KlarnaCheckoutShippingInformation');

		$kcoShippingInfo.on('change', function(evt) {
			var data = $kcoShippingInfo.find('input, select').serialize();
			var $changedEl = $(evt.target);
			var isCountry = $changedEl.is('#country');
			$.ajax({
				type: 'POST',
				url: '/checkout/klarna/',
				data: data + '&ajax=1',
				cache: false,
				beforeSend: function() {
					$kcoShippingInfo.append('<div class="CheckoutLoader"></div>');
				},
				success: function(response) {
					// Once changed and updated to backend, refresh preview and Klarna Checkout frame
					var $previewContent = $('#PreviewContent');
					$kcoShippingInfo.html(response);
					$('.CheckoutLoader', $kcoShippingInfo).remove();
					$.ajax({
						type: 'GET',
						url: '/interface/Helper',
						data: { file: 'helpers/klarna-preview' },
						beforeSend: function() {
							$previewContent.append('<div class="CheckoutLoader"></div>');
						},
						success: function(response) {
							$previewContent.html(response);
							$('.CheckoutLoader', $previewContent).remove();
						}
					});

					if (typeof $.fn.customSelect === 'function') $kcoShippingInfo.find('select').customSelect();

					mcf.updateKlarnaCheckoutFrame();

				}
			});
		});

		// Tabs for payment method switching
		$('#KlarnaOtherPaymentMethods').find('a').click(function(evt) {
			evt.preventDefault();
			var clicked = $(this).attr('href');
			$('.PaymentTab').hide();
			$(clicked).show();
			$(this).parent('li').addClass('Current').siblings().removeClass('Current');
		});

		// If there's no comment present hide the field to be showable via link
		if (!$.trim($("#OrderComments").val())) {
			$('#SubmitOrderComment').hide();
		} else {
			$('#CommentFieldReveal').hide();
		}

		// Show the comment field
		$('#CommentFieldReveal a').click(function(evt) {
			evt.preventDefault();
			$(this).parent().fadeOut(200, function() {
				$('#SubmitOrderComment').fadeIn(200);
			});
		});

		// Saving of order comments on save
		$('#OrderComments').change(function(evt) {
			var $that = $(this);
			evt.preventDefault();
			$.ajax({
				type: 'POST',
				url: '/checkout/',
				data: $('#OrderComments').serialize() + '&ajax=1',
				cache: false,
				success: function(response) {
					$that.next('.FormHelp').remove();
					$that.after($('<p class="FormHelp Success">' + mcf.Lang.CommentSaved + '</p>').hide()).next().fadeIn(125);
				}
			});
		});

	}

});