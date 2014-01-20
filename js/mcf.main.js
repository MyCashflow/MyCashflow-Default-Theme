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

	// Colorbox options under the global mcf
	// Extended on call by call basis
	mcf.colorboxOpts = {
		fixed: false,
		maxWidth: '90%',
		maxHeight: '95%',
		current: '{current} / {total}',
		opacity: 0.5,
		initialWidth: 100,
		initialHeight: 100,
		onClosed: function() {
			// Cleanup traces of the colorbox
			// so that next time it's made from scratch
			// $(this).colorbox.remove();
		}
	}

	// Variation names are split from "|"
	// and made as chained select boxes
	$('.BuyForm').mcfVariationSplitter();

	// Bypass IE caching.
	$.ajaxSetup({ cache: false });

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
	// Advanced search
	//--------------------------------------------------------------------------

	// To use advaced search just uncomment these next lines and
	// call js/vendor/jquery.hashchange.js and js/mcf.advancedsearch.js in the helpers/scripts.html file.
	// Also from helpers/sidebar-left.html change {Categories(show:'all')} to {Categories(show:'active')}

	// There must be subcategories under each main category which then act as facets for the search.
	// I.e. if you have main category named "Shoes", you could then have subcategory called "Color" and
	// under that category subcategories called "Blue", "Green", "Yellow" etc. where the product would be.

	// The plugin would make an advanced search form this data and
	// the user can then select all the properties of the shoes that she wants and search for applicable products.

	/* $('ul.Categories > li.Current', '#MainNavigation').each(function(index) {

		var $that = $(this),
			categoryRegex = /CategoryID-([\d]+)/,
			categoryID = parseInt($that.attr('class').match(categoryRegex)[1], 10),
			$subCategories = $that.find('> ul'),
			$wrapper = $('<div class="FacetedNavigation" id="FacetedNav-' + categoryID + '"></div>');

		$that.addClass('AdvancedSearchItem');
		$subCategories.hide();
		$subCategories.before($wrapper);

		$wrapper.mcfAdvancedSearch({
			id: categoryID,
			mode: 'navigation',
			results: '#Primary',
			brands: 'checkbox',
			get_form: function(el) {
				el.find('select').customSelect();
			}
		});

	}); */

	//--------------------------------------------------------------------------
	// Ajax Live Search
	//--------------------------------------------------------------------------

	var $searchForm = $('#SearchForm'),
		$searchInput = $('#SearchInput'),
		$searchResults = $('<ul id="LiveSearchResults"></ul>'),
		$searchIndicator = $('<span class="SearchIndicator"></span>'),
		html5inputTypes = (typeof Modernizr === 'undefined') ? false : Modernizr.inputtypes.search;

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
			if (!html5inputTypes) $searchIndicator.hide().removeClass('CloseSearchResults');
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

					// Test if we're dealing with HTML5 search input type and react accordingly
					if (html5inputTypes) {
						$searchIndicator.hide();
						$searchInput[0].addEventListener("search", function(e) {
							$searchIndicator.trigger('click');
						}, false);
					} else {
						$searchIndicator.addClass('CloseSearchResults');
					}

					$searchIndicator.click(function() {
						$searchInput.val('').blur();
						$searchResults.html('');
						$searchForm.removeClass('SearchActive');
						if (!html5inputTypes) $searchIndicator.hide().removeClass('CloseSearchResults');
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

	var $crossSaleScrollers = $('.CrossSaleScroller');

	$crossSaleScrollers.each(function() {
		var $crossSaleScroller = $(this),
			$crossSaleProducts = $('.CrossSaleProducts', $crossSaleScroller),
			$crossSalePrev = $('<span class="ScrollToPrev"><span class="Icon"></span>' + mcf.Lang.PrevPlural + '</span>'),
			$crossSaleNext = $('<span class="ScrollToNext"><span class="Icon"></span>' + mcf.Lang.NextPlural + '</span>');

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
			force: true,
			duration: 500,
			items: '.Product',
			prev: null,
			next: null,

			onBefore: function(evt, elem, $pane, $items, pos) {
				$crossSalePrev.add($crossSaleNext).fadeIn(250);
				if (pos === 0) $crossSalePrev.fadeOut(250);
				else if (pos === $items.length - 3) $crossSaleNext.fadeOut(250);
			}
		});

		$crossSalePrev.on('click', function() { $crossSaleScroller.trigger('prev'); });
		$crossSaleNext.on('click', function() { $crossSaleScroller.trigger('next'); });

		$crossSaleScroller.on('mouseenter', function() { $(this).addClass('mouseover'); });
		$crossSaleScroller.on('mouseleave', function() { $(this).removeClass('mouseover'); });

		$(document).keydown(function(evt) {
			if ($crossSaleScroller.hasClass('mouseover')) {
				if (evt.keyCode === 37) $crossSaleScroller.trigger('prev');
				if (evt.keyCode === 39) $crossSaleScroller.trigger('next');
			}
		});
	});

	//--------------------------------------------------------------------------
	// Fade Static Notifications
	//--------------------------------------------------------------------------

	var $notifications = $('#NotificationCenter .Notification');
	if ($notifications.length) {
		setTimeout(function() {
			$('#NotificationCenter .Notification').fadeOut(250, function() {
				$(this).remove();
			});
		}, 5000);
	}

	//--------------------------------------------------------------------------
	// Category Navigation Openers
	//--------------------------------------------------------------------------

	var $categoryNavs = $('.Categories li:not(.AdvancedSearchItem):has(> ul)');

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
		function(evt) { $('ul', this).stop(true, true).animate({ height: 'show', opacity: 'show' }, 125); },
		function(evt) { $('ul', this).stop(true, true).animate({ height: 'hide', opacity: 'hide' }, 125); }
	);

	$dropdownNavs.find('ul').css({ left: 0 }).hide();

	//--------------------------------------------------------------------------
	// Adding products from product pages via Ajax
	//--------------------------------------------------------------------------

	var $miniCartWrapper = $('#MiniCartWrapper');

	$(document).on('submit', '.BuyForm', function(evt) {
		var $form = $(evt.currentTarget),
			$submit = $('.AddToCart', $form);

		// If buying requires uploading of file, return here
		if ($form.find('input[type="file"]').length) { return true; }

		$.colorbox.close();
		$submit.attr('disabled', 'disabled');

		mcf.publish('AddProducts', {
			data: $form.serializeObject(),
			trigger: $submit,
			success: function() {
				$submit.removeAttr('disabled');

				// If we're at the cart, update it after adding products
				if ($('#CartForm').length) mcf.publish('UpdateCart');
			}
		});

		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Adding products from product lists via Ajax
	//--------------------------------------------------------------------------

	$(document).on('click', 'a.AddToCart', function(evt) {
		var $link = $(evt.currentTarget),
			$product = $link.closest('.Product'),
			productId = $link.attr('href').split('/')[2];

		if ($product.hasClass('ProductVariations') || $product.hasClass('ProductTailorings') || $product.hasClass('ProductDownloads')) {
			$.colorbox($.extend({}, {
				title: mcf.Lang.AddToCart,
				href: '/interface/Helper?file=helpers/colorbox-buyform&setProduct=' + productId,
				onComplete: function() {
					// Bind custom selects and variationsplitter to modal
					$('#cboxContent').removeData('plugin_mcfVariationSplitter');
					$('#cboxContent').mcfVariationSplitter().find('select').customSelect();

					// Make variationsplitter-made selects pretty too
					$('#cboxContent').on('change', 'select', function(evt) {
						$(evt.delegateTarget).find('select').customSelect();
					});
				}
			}, mcf.colorboxOpts));
		}
		else {
			mcf.publish('AddProducts', {
				data: { products: [{ product_id: productId }] },
				trigger: $link,
				success: function() {
					// If we're at the cart, update it after adding products
					if ($('#CartForm').length) mcf.publish('UpdateCart');
				}
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

	var $cartForm = $('#CartForm').data('dirty', false);

	// At page load, hide the order buttons and campaign code submit if there's nothing at cart
	if ($cartForm.length > 0 && $('#CartTable', $cartForm).length === 0) {
		$('.CheckoutButton').hide();
		$('#SubmitCampaignCode').hide();
	}

	$cartForm.on('change', 'input', function(evt) {
		$cartForm.data('dirty', true);
	});

	$('body.Cart .CheckoutButton').on('click', function(evt) {
		if ($cartForm.data('dirty')) {
			$cartForm.data('cart_target','checkout');
			$cartForm.trigger('submit');
			evt.preventDefault();
		}
	});

	$cartForm.on('submit', function(evt) {
		mcf.publish('UpdateCart', { data: $cartForm.serializeObject() });
		$cartForm.data('dirty', false);
		evt.preventDefault();
	});

	//--------------------------------------------------------------------------
	// Shopping cart sharing
	//--------------------------------------------------------------------------

	var $shareButtons = $('#CartShareButtons');
	if ($shareButtons.length) {
		$shareButtons.on('click', '.ShareButton', function(evt) {
			var $that = $(evt.target),
				file = $that.data('file'),
				title = $that.attr('title');

			$.colorbox($.extend({}, {
				href: '/interface/Helper?file=helpers/' + file,
				title: title
			}, mcf.colorboxOpts));

			evt.preventDefault();
		});

		// Select all of the textbox's text on focus
		$(document).on('focus', '#CartShareLinkTextBox', function(evt) {
			var $that = $(evt.target);
			$that.select();
			$that.mouseup(function() {
				$that.unbind('mouseup');
				return false;
			});
		});
	}

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