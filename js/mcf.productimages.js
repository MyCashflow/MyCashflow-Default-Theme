/*!
 * File: mcf.productimage.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */

$(function() {
	'use strict';

	var $productCurrentImage = $('#CurrentProductImage'),
		$productThumbnails = $('#ProductThumbnails'),
		$productBuyForm = $('.BuyForm'),
		colorboxCurrent = '{current} / {total}',
		colorboxOpacity = 0.5;

	// Create the spinning image loader.
	var $imageLoader = $('<span id="ImgLoader">' + mcf.Lang.Loading + '</span>');
	$imageLoader.prependTo($productCurrentImage);
	$imageLoader.hide();

	// Change the preview image when a thumbnail is clicked.
	$productThumbnails.on('click', 'li a', function(evt, triggered) {
		var $self = $(this);

		var $oldImage = $('img', $productCurrentImage),
			$newImage = $('img', $self),
			imageText = $newImage.attr('alt'),
			imageSize = $oldImage.attr('src').split('/')[2];

		// Show the image loader.
		$imageLoader.fadeIn(150);

		// Hide the product image.
		$oldImage.fadeOut(300, function() {
			// Hide the image loader and
			// show the new product image.
			$imageLoader.fadeOut(300, function() {
				$oldImage.attr('alt', $newImage.attr('alt'));
				$oldImage.attr('src', $newImage.attr('src').replace(/[0-9]+x[0-9]+/, imageSize));
				$oldImage.fadeIn(300);
			});
		});

		$productCurrentImage
			.attr('title', $(this).attr('title'))
			.attr('href', $(this).attr('href'))
			.data('eq', $(this).parent().index())
			.next('#ProductImageCaption').text($self.attr('title'));

		if (!triggered) {
			$('option, :radio', $productBuyForm).each(function() {
				var inputValue = $(this).is(':radio')
					? $(this).parent('label').text()
					: $(this).text();

				var regexp = /^[\t]+|[\t]+$/,
					matchA = inputValue.replace(regexp, '').toLowerCase(),
					matchB = imageText.replace(regexp, '').toLowerCase(),
					matches = matchA.length > matchB.length
						? matchA.match(matchB)
						: matchB.match(matchA);

				if (matches !== null) {
					if ($(this).is(':radio')) {
						// Handler for radio inputs.
						$(':radio', $productBuyForm).attr('checked', false);
						$(this).attr('checked', true);
					} else {
						// Handler for option inputs.
						$('option', $productBuyForm).attr('selected', false);
						$(this).attr('selected', true);
						$('.sel_inner', $productBuyForm).text($(':selected', $(this)).text());
					}

					return false;
				}
			});
		}

		evt.preventDefault();
	});

	// Change the preview image when a different product
	// variant is selected. Matching is done by comparing
	// the variant's name against the image titles.
	$productBuyForm.on('change', function (evt) {
		var $changedEl = $(evt.target),
			inputValue = $changedEl.is(':radio')
				? $changedEl.parent('label').text()
				: $changedEl.find(':selected').text();

		$('li a', $productThumbnails).each(function() {
			var regexp = /^[\t]+|[\t]+$/,
				matchA = $(this).attr('title').replace(regexp, '').toLowerCase(),
				matchB = inputValue.replace(regexp, '').toLowerCase(),
				matches = matchA.length > matchB.length
					? matchA.match(matchB)
					: matchB.match(matchA);

			if (matches !== null) {
				$(this).trigger('click', [true]);
				return false;
			}
		});
	});

	// Open the current preview image into a modal window
	// when clicked.
	$productCurrentImage.on('click', function(evt) {
		if ($productThumbnails.length) {
			var $self = $(this);

			// Get the index of the currently active image.
			var index = $self.data('eq')
				? $self.data('eq')
				: 0;

			// Initialize the ColorBox for product images.
			$('li a', $productThumbnails).colorbox({
				open: false,
				current: colorboxCurrent,
				opacity: colorboxOpacity,
				onClosed: function() {
					$(this).colorbox.remove();
				}
			});

			// Open the currently active product image.
			$('li:eq(' + index + ') a', $productThumbnails).colorbox({ open: true });

		} else {
			$(this).colorbox({
				open: true,
				current: colorboxCurrent,
				opacity: colorboxOpacity,
				onClosed: function() {
					$(this).colorbox.remove();
				}
			});
		}

		evt.preventDefault();
	});
});