/*!
 * File: mcf.klarnacheckout.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	var loc = window.location.href;
	var thanksHash = loc.substr(loc.lastIndexOf('/'));
	$('#KlarnaCheckoutThanksLink').attr('href', '/checkout/thanks' + thanksHash);

	console.log(mcf);
	if (typeof mcf === 'undefined') {
		mcf = mcf || {};
		console.log(mcf);
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
				/*if (!isCountry && typeof window._klarnaCheckout === 'function') {
					window._klarnaCheckout(function (api) {
						api.suspend();
					});
				}*/
			},
			success: function(response) {
				$kcoShippingInfo.html($(response).html());

				$.ajax({
					type: 'GET',
					url: '/interface/Helper',
					data: { file: 'helpers/klarna-preview' },
					success: function(response) {
						$('#PreviewContent').html(response);
					}
				});

				if (typeof $.fn.customSelect === 'function') $kcoShippingInfo.find('select').customSelect();

				mcf.updateKlarnaCheckoutFrame();

				/*
				if (isCountry) {
					mcf.updateKlarnaCheckoutFrame();
				} else if (typeof window._klarnaCheckout === 'function') {
					window._klarnaCheckout(function (api) {
						api.resume();
					});
				}*/

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