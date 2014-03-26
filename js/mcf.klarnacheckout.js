/*!
 * File: mcf.klarnacheckout.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	var $kcoShippingInfo = $('#KlarnaCheckoutShippingInformation');

	function updateKlarnaCheckoutFrame() {
		var $kco = $('#KlarnaCheckout');
		if ($kco.length) {
			$.ajax({
				url: '/interface/KlarnaCheckout',
				beforeSend: function() {
					//$kco.css({
					//	'width': $kco.width(),
					//	'height':  $kco.height()
					//});
					//$kco.append('<div class="CheckoutLoader"></div>');
					//debugger;
				},
				success: function(response) {
					$kco.html(response);
				}
			});
		}
	}

	updateKlarnaCheckoutFrame();

	// Handle the shipping information that are asked to determine shipping costs with Klarna Checkout
	$kcoShippingInfo.on('change', function(evt) {
		var data = $kcoShippingInfo.find('input, select').serialize();
		$.ajax({
			type: 'POST',
			url: '/checkout/klarna/',
			data: data + '&ajax=1',
			cache: false,
			beforeSend: function() {
				window._klarnaCheckout(function (api) {
					api.suspend();
				});
				//$kcoShippingInfo.append('<div class="CheckoutLoader"></div>');
				//$('#KlarnaCheckout').append('<div class="CheckoutLoader"></div>');
			},
			success: function(response) {
				$kcoShippingInfo.html($(response).html());
				$kcoShippingInfo.find('select').customSelect();
				//updateKlarnaCheckoutFrame();
				window._klarnaCheckout(function (api) {
					api.resume();
				});

				if ($('#CartForm').length && typeof mcf.publish === 'function') mcf.publish('UpdateCart');
			}
		});
	});

	// Tabs for payment method switching
	$('#KlarnaOtherPaymentMethods').find('a').click(function(evt) {
		evt.preventDefault();
		var clicked = $(this).attr('href');
		$('.PaymentTab').hide();
		$('' + clicked).show();
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
		evt.preventDefault();
		$.ajax({
			type: 'POST',
			url: '/checkout/',
			data: $('#OrderComments').serialize() + '&ajax=1',
			cache: false,
			success: function(response) {
				mcf.raiseNotification(mcf.Lang.CommentSaved, 'KlarnaCommentSaved', 'Success', false);
			}
		});
	});

});