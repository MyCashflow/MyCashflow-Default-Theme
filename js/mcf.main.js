/*!
 * File: mcf.main.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */
/*global mcf:false */

$(function() {
	'use strict';

	mcf.checkLangCode = function(code) {
		mcf.Lang = mcf.Lang || {};
		return typeof mcf.Lang[code] === undefined
			? false
			: true;
	};

	// Variation names are split from "|"
	// and made as chained select boxes
	$('.BuyForm').mcfVariationSplitter();

	//--------------------------------------------------------------------------
	// Pagination & Forms
	//--------------------------------------------------------------------------

	var $paginationForms = $('#PaginationSortForm');

	// Make selects pretty
	$('select').customSelect();

	// When variationsplitter creates new selects make them also pretty
	$('.BuyForm').on('change', 'select', function(evt) {
		$(evt.delegateTarget).find('select').customSelect();
	});

	// Make the pagination form autosubmit on change
	$('button', $paginationForms).parent('div').hide();
	$('select', $paginationForms).change(function() { $(this).closest($paginationForms).submit(); });

	//--------------------------------------------------------------------------
	// Ajax Live Search
	//--------------------------------------------------------------------------

	var $searchForm = $('#SearchForm'),
		$searchInput = $('#SearchInput'),
		$searchResults = $('<ul id="LiveSearchResults"></ul>'),
		$searchIndicator = $('<span class="SearchIndicator"></span>');

	// Create the search results element.
	$searchResults.appendTo($searchForm);
	$searchResults.width($searchForm.width());

	// Create the search indicator & turn
	// form brower's autocompletion off.
	$searchIndicator.insertAfter($searchInput);
	$searchInput.attr('autocomplete', 'off');

	$searchInput.keyup(function() {
		if ($searchInput.val() === '') {
			$searchResults.html('');
			$searchForm.removeClass('SearchActive');
			$searchIndicator.hide().removeClass('CloseSearchResults');
		}
	});

	$searchInput.typeWatch({
		highlight: true,
		wait: 500,

		callback: function(searchQuery) {
			$.ajax({
				type: 'GET',
				url: '/interface/SearchProducts',
				data: {
					query: searchQuery,
					limit: 8,
					helper: 'helpers/livesearchresults'
				},

				beforeSend: function() {
					$searchForm.addClass('SearchActive');
					$searchIndicator.fadeIn(500);
				},

				success: function(results) {
					$searchResults.html(results).fadeTo(500, 0.9);
					$searchIndicator.addClass('CloseSearchResults');

					$searchIndicator.click(function() {
						$searchInput.val('').blur();
						$searchResults.html('');
						$searchForm.removeClass('SearchActive');
						$searchIndicator.hide().removeClass('CloseSearchResults');
					});
				}
			});
		}
	});

	//--------------------------------------------------------------------------
	// Home Page Banners
	//--------------------------------------------------------------------------

	// Set up and cache the required scroller elements.
	var $bannerScroller = $('#BannerScroller'),
		$bannerItems = $('.FrontBanner', $bannerScroller),
		$bannerInfos = $('.BannerInfo', $bannerScroller).hide(),
		$bannerPrev = $('<a href="#" id="PrevBanner"><span class="Icon"></span>' + mcf.Lang.Prev + '</a>').hide(),
		$bannerNext = $('<a href="#" id="NextBanner"><span class="Icon"></span>' + mcf.Lang.Next + '</a>').hide();

	if ($bannerItems.length > 1) {
		// Allow overflowing and create the scroller controls.
		$bannerScroller
			.wrap('<div id="HoverWrapper" style="position: relative; width: 100%; overflow: hidden;"></div>')
			.after($bannerPrev)
			.after($bannerNext);

		$bannerScroller.parent().hover(
			// On mouse over:
			function() {
				$bannerNext
					.add($bannerPrev)
					.stop(true, true)
					.fadeTo(500, 0.8);

				$bannerInfos
					.stop(true, true)
					.fadeTo(500, 0.8);
			},

			// On mouse out:
			function() {
				$bannerNext
					.add($bannerPrev)
					.stop(true, true)
					.fadeTo(500, 0);

				$bannerInfos
					.stop(true, true)
					.fadeTo(500, 0);
			}
		);

		// Initialize the image scroller.
		$bannerScroller.serialScroll({
			axis: 'x',
			step: 1,
			force: true,
			cycle: true,
			duration: 500,
			interval: 7500,
			items: '.FrontBanner',
			prev: '#PrevBanner',
			next: '#NextBanner',

			onBefore: function(ev,el) {
				var elh = $(el).css('height'), h = $bannerScroller.css('height');
				if (h > elh) $bannerScroller.animate({ height: elh }, 300);
			},

			onAfter: function(el) {
				var elh = $(el).css('height'), h = $bannerScroller.css('height');
				if (h != elh) $bannerScroller.animate({ height: elh }, 300);
			}
		});
	}

	//--------------------------------------------------------------------------
	// Cross-Sale Products
	//--------------------------------------------------------------------------

	var $crossSaleScroller = $('#CrossSaleScroller'),
		$crossSaleProducts = $('#CrossSaleProducts'),
		$crossSalePrev = $('<span id="ScrollToPrev"><span class="Icon"></span>' + mcf.Lang.PrevPlural + '</span>'),
		$crossSaleNext = $('<span id="ScrollToNext"><span class="Icon"></span>' + mcf.Lang.NextPlural + '</span>');

	$crossSaleScroller
		.css('overflow', 'hidden')
		.before($crossSalePrev)
		.before($crossSaleNext);

	$crossSalePrev.hide();
	$crossSaleProducts.css('width', '9999px');
	$crossSaleScroller.serialScroll({
		axis: 'x',
		step: 3,
		exclude: 2,
		cycle: false,
		duration: 500,
		interval: 5000,
		items: '.Product',
		prev: '#ScrollToPrev',
		next: '#ScrollToNext',

		onBefore: function(evt, elem, $pane, $items, pos) {
			$crossSalePrev.add($crossSaleNext).fadeIn(250);
			if (pos === 0) $crossSalePrev.fadeOut(250);
			else if (pos === $items.length - 3) $crossSaleNext.fadeOut(250);
		}
	});

	$(document).keydown(function(evt) {
		if (evt.keyCode === 37) $crossSaleScroller.trigger('prev');
		if (evt.keyCode === 39) $crossSaleScroller.trigger('next');
	});

	//--------------------------------------------------------------------------
	// Category Navigation Openers
	//--------------------------------------------------------------------------

	var $categoryNavs = $('.Categories li:has(> ul)');

	$categoryNavs.addClass('Openable').each(function() {
		var $navOpener = $('<span class="NavOpener"></span>').prependTo(this);

		$(this).hasClass('Current')
			? $navOpener.text('-').attr('title', mcf.Lang.HideSubCategories).addClass('Opened')
			: $navOpener.text('+').attr('title', mcf.Lang.ShowSubCategories);

		$navOpener.click(function() {
			$(this).next('a').next('ul').slideToggle(300);

			$(this).hasClass('Opened')
				? $(this).text('+').attr('title', mcf.Lang.ShowSubCategories)
				: $(this).text('-').attr('title', mcf.Lang.HideSubCategories);

			$(this).toggleClass('Opened');
		});
	});

	//--------------------------------------------------------------------------
	// Header Dropdowns
	//--------------------------------------------------------------------------

	var $dropdownNavs = $('.DropdownNavigation', '#Header');

	$dropdownNavs.hover(
		function() { $('ul', this).stop(true, true).animate({ height: 'show', opacity: 'show' }, 125); },
		function() { $('ul', this).stop(true, true).animate({ height: 'hide', opacity: 'hide' }, 125); }
	);

	$dropdownNavs.find('ul').css({ left: 0 }).hide();

	//--------------------------------------------------------------------------
	// Adding products from product pages via Ajax
	//--------------------------------------------------------------------------

	var $miniCartWrapper = $('#MiniCartWrapper');

	$(document).on('submit', '.BuyForm', function(evt) {
		var $form = $(evt.currentTarget),
			$submit = $('.AddToCart', $form);

		$.colorbox.close();
		$submit.attr('disabled', 'disabled');

		mcf.publish('AddProducts', {
			data: $form.serializeObject(),
			success: function() {
				$submit.removeAttr('disabled');
			}
		});

		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Adding products from product lists via Ajax
	//--------------------------------------------------------------------------

	$(document).on('click', 'a.AddToCart', function(evt) {
		var $product = $(this).closest('.Product'),
			productId = $(this).attr('href').split('/')[2];

		if ($product.hasClass('ProductVariations') || $product.hasClass('ProductTailorings') || $product.hasClass('ProductDownloads')) {
			$.colorbox({
				title: mcf.Lang.AddToCart,
				fixed: true,
				opacity: 0.5,
				initialWidth: 100,
				initialHeight: 100,
				href: '/interface/Helper?file=helpers/colorbox-buyform&setProduct=' + productId,
				onComplete: function() {

					// Bind custom selects and variationsplitter to modal
					$("#cboxContent").mcfVariationSplitter().find('select').customSelect();

					// Make variationsplitter-made selects pretty too
					$("#cboxContent").on('change', 'select', function(evt) {
						$(evt.delegateTarget).find('select').customSelect();
					});
				},
				onClosed: function() {
					// Cleanup traces of the colorbox
					// so that next time it's made from scratch
					$(this).colorbox.remove();
				}
			});
		}
		else {
			mcf.publish('AddProducts', {
				data: { products: [{ product_id: productId }] }
			});
		}

		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Removing products via Ajax
	//--------------------------------------------------------------------------

	var $cartRemoveButtons = $('a.CartRemove');

	$cartRemoveButtons.live('click', function(evt) {
		var $self = $(this),
			productId = $self.attr('href').split('/')[3];

		mcf.publish('RemoveProduct', {
			data: productId,
			success: function() {
				$self.closest('li').slideUp(250);
			}
		});

		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Full cart updating via Ajax
	//--------------------------------------------------------------------------

	var $cartForm = $('#CartForm');

	$cartForm.on('change', 'input', function(evt) {
		$cartForm.trigger('submit');
		evt.preventDefault();
	});

	$cartForm.on('submit', function(evt) {
		mcf.publish('UpdateCart', { data: $cartForm.serializeObject() });
		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Adding & removing campaign codes via Ajax
	//--------------------------------------------------------------------------

	var $campaignCodeWrap = $('#SubmitCampaignCode'),
		$campaignCodeForm = $('#SubmitCampaignCode form'),
		$campaignCodeLink = $('<a href="#coupon" id="CouponCodeReveal">' + mcf.Lang.CampaignCodeInquiry + '</a>');

	$campaignCodeWrap.on('submit', $campaignCodeForm, function(evt) {
		mcf.publish('UpdateCampaignCode', { data: $(evt.target).serializeObject() });
		evt.preventDefault();
	});

	// Hide the campaign code input and
	// append the campaign code link only if there's
	// the input and not the submitted code.
	$campaignCodeForm.has('input[type="text"]').hide().before($campaignCodeLink);

	// Show the campaign code input when
	// the campaign code link is clicked.
	$campaignCodeWrap.on('click', $campaignCodeLink, function() {
		$campaignCodeLink.fadeOut(200, function() {
			$campaignCodeForm.fadeIn(200);
		});
	});
});