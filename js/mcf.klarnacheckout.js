/*!
 * File: mcf.klarnacheckout.js
 * Part of MyCashFlow's default theme.
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	var loc = window.location.href;
	var thanksHash = loc.substr(loc.lastIndexOf('/'));
	$('#KlarnaCheckoutThanksLink').attr('href', '/checkout/thanks' + thanksHash);

	if (typeof mcf === 'undefined') {
		mcf = mcf || {};
		if (typeof mcf.isSubscribed === 'undefined' || !mcf.isSubscribed('UpdateCampaignCode')) {
			$('#SubmitCampaignCode').hide();
		}
	}

	var $kcoShippingInfo = $('#KlarnaCheckoutShippingInformation');

	mcf.updateKlarnaCheckoutFrame = function() {
		var $kco = $('#KlarnaCheckout');
		var mobile = (window.matchMedia('(max-width: 768px)').matches) ? true : false;
		if ($kco.length) {
			$.ajax({
				url: '/interface/KlarnaCheckout',
				data: (mobile) ? { layout: 'mobile' } : { layout: 'desktop' },
				success: function(response) {
					$kco.html(response);
				}
			});
		}
	}

	mcf.updateKlarnaCheckoutFrame();

	// Handle the shipping information that are asked to determine shipping costs with Klarna Checkout
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
				var $previewContent = $('#PreviewContent');
				$kcoShippingInfo.html($(response).html());
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

});