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

	// When variationsplitter creates new selects make them also pretty
	$('.BuyForm').on('change', 'select', function(evt) {
		$(evt.delegateTarget).find('select').customSelect();
	});

	// Bypass IE caching.
	$.ajaxSetup({ cache: false });

	// Make selects pretty
	if (typeof $.fn.customSelect === 'function') {
		$('select').customSelect();

		// When variationsplitter creates new selects make them also pretty
		$('.BuyForm').on('change', 'select', function(evt) {
			$(evt.delegateTarget).find('select').customSelect();
		});
	}

	//--------------------------------------------------------------------------
	// Availability notifications modal
	//--------------------------------------------------------------------------

	$('.inlineColorbox').colorbox($.extend({}, {
		inline: true,
		href: "#AvailabilityNotificationModal"
	}, mcf.colorboxOpts));

	//--------------------------------------------------------------------------
	// Pagination & Forms
	//--------------------------------------------------------------------------

	function paginationForms() {
		var $paginationForms = $('#PaginationSortForm');

		$('select', $paginationForms).customSelect();

		// Make the pagination form autosubmit on change
		$('button', $paginationForms).parent('div').hide();
		$('select', $paginationForms).change(function() { $(this).closest($paginationForms).submit(); });
	}

	paginationForms();

	//--------------------------------------------------------------------------
	// Ajax Live Search
	//--------------------------------------------------------------------------

	function LiveSearch(opts) {
		$.extend(this, {
			$searchForm: $('#SearchForm'),
			$liveSearchResults: $('#LiveSearch'),
			$searchInput: $('#SearchInput'),
			$searchCategoryFilter: $('#SearchCategoryFilter select'),
			$results: $('.SearchSuggestions li'),
			$selectedResult: null,
			$nextResult: null,
			downKeyCode: 40,
			upKeyCode: 38,
			currentSearchTerm: null,
			previousSearchTerm: null,
			selectedSearchTerm: null,
			searchKeyUpTimer: null,
			resultsCache: {}
		}, opts || {});

		// Turn browser's form autocompletion off
		this.$searchInput.attr('autocomplete', 'off');

		// Initialize.
		this.currentSearchTerm = (this.$searchInput.val()) ? this.$searchInput.val().toLowerCase() : '';
		this.bindEvents();
	}

	LiveSearch.prototype.bindEvents = function() {
		var self = this;

		/**
		 * Search input events
		 */

		function onSearchInputFocus() {
			self.$searchForm.addClass('SearchActive');
		}

		function onSearchInputBlur() {
			window.setTimeout(function() {
				self.$searchForm.removeClass('SearchActive');
			}, 300);
		}

		function onSearchInputKeyDown(evt) {
			var downKey = evt.which == self.downKeyCode;
			var upKey = evt.which == self.upKeyCode;

			function fallbackSelection(downKey) {
				// Select first / last.
				self.$selectedResult = (downKey)
					? self.$results.first()
					: self.$results.last();

				self.$selectedResult.addClass('SelectedResult');
			}

			if (downKey || upKey) {
				evt.preventDefault();

				if (self.$selectedResult) {
					self.$selectedResult.removeClass('SelectedResult');

					// Select next / prev.
					self.$nextResult = (downKey)
						? self.$selectedResult.next()
						: self.$selectedResult.prev();

					if (self.$nextResult.length > 0) {
						self.$selectedResult = self.$nextResult.addClass('SelectedResult');
					} else {
						fallbackSelection(downKey);
					}
				} else {
					fallbackSelection(downKey);
				}

				var searchQuery = $('a', self.$selectedResult).first().text();
				self.$searchInput.val(searchQuery);
				self.selectedSearchTerm = searchQuery.toLowerCase();
			}
		}

		function onSearchInputKeyUp(evt) {
			var downKey = evt.which == self.downKeyCode;
			var upKey = evt.which == self.upKeyCode;

			clearTimeout(self.searchKeyUpTimer);

			if (!downKey || !upKey) {
				self.currentSearchTerm = self.$searchInput.val();
				if (self.selectedSearchTerm === self.currentSearchTerm) {
					self.currentSearchTerm = self.previousSearchTerm;
				}

				self.previousSearchTerm = !!self.previousSearchTerm
					? self.currentSearchTerm
					: self.previousSearchTerm;

				if (self.previousSearchTerm !== self.currentSearchTerm) {
					self.searchKeyUpTimer = setTimeout(function() {
						self.getLivesearchResults(self.$searchInput.val());
					}, 500);
				}
			}
		}

		function onSearchInputChange() {
			if (self.$searchInput.val() === '') {
				window.setTimeout(function() {
					self.$searchForm.removeClass('SearchInitiated');
					self.$searchForm.remove($('#SearchResults'));
				}, 350);
			}
		}

		self.$searchInput
			.on('focus', onSearchInputFocus)
			.on('blur', onSearchInputBlur)
			.on('keydown', onSearchInputKeyDown)
			.on('keyup', onSearchInputKeyUp)
			.on('change', self.$searchInput, onSearchInputChange);

		/**
		 * Search Form Events
		 */

		function onSearchResultMouseEnter(evt) {
			var $that = $(evt.currentTarget);
			self.$results.removeClass('SelectedResult');
			self.$selectedResult = $that.addClass('SelectedResult');
		}

		function onSearchResultMouseLeave(evt) {
			var $that = $(evt.currentTarget);
			$that.removeClass('SelectedResult');
			self.$selectedResult = null;
		}

		function onSearchFilterResultClick(evt) {
			var $that = $(evt.currentTarget);
			var href = $that.attr('href');
			var q = href.substr(href.lastIndexOf('?'));

			self.getFullResults(q);
			history.pushState(null, null, q);
			evt.preventDefault();
		}

		self.$liveSearchResults
			.on('mouseenter', '.SearchSuggestions li', onSearchResultMouseEnter)
			.on('mouseleave', '.SearchSuggestions li', onSearchResultMouseLeave);

		$('#Primary').on('click', '.SearchFilter li a, .SearchSuggestions a', onSearchFilterResultClick);

		// Load the results when state changes.
		$(window).on('popstate', function(evt) {
			self.getFullResults(location.search);
		});
	}

	LiveSearch.prototype.cacheResults = function(queryObj) {
		var self = this;
		var query = '/search/?' + $.param(queryObj);
		var deferred = self.resultsCache[query];

		if (!deferred) {
			deferred = $.ajax({
				type: 'GET',
				url: '/interface/Helper',
				data: queryObj
			});
			self.resultsCache[query] = deferred;
		}

		return deferred;
	};

	LiveSearch.prototype.getLivesearchResults = function(searchQuery) {
		var self = this;
		var queryObj = {
			query: searchQuery,
			file: 'helpers/header-livesearch'
		}

		$.when(self.cacheResults(queryObj)).done(function(results) {
			self.$searchForm.addClass('SearchInitiated');

			if ($('#SearchResults').length) {
				$('#SearchResults').replaceWith(results);
			} else {
				self.$liveSearchResults.prepend(results);
			}

			self.$results = $('.SearchSuggestions li');
			self.$selectedResult = null;
			self.$nextResult = null;
		});
	};

	LiveSearch.prototype.getFullResults = function(searchQuery) {
		var self = this;
		var queryObj = $.deparam(searchQuery.substr(1));
		queryObj.file = 'helpers/searchresults';

		// Check if we're dealing with search query
		if (typeof queryObj.q !== 'undefined') {
		$.when(self.cacheResults(queryObj)).done(function(results) {
				 $('#Primary').html(results);
				paginationForms();
			});
		}
	};

	new LiveSearch();

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
					if (typeof $.fn.customSelect === 'function') {
						$('#cboxContent').mcfVariationSplitter().find('select').customSelect();

						// Make variationsplitter-made selects pretty too
						$('#cboxContent').on('change', 'select', function(evt) {
							$(evt.delegateTarget).find('select').customSelect();
						});
					}
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

	$('#Main').on('click', 'a.CartRemove', function(evt) {
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
		mcf.publish('UpdateCampaignCode', {
			data: $(evt.target).serializeObject(),
			success: function() {
				// If we're on Klarna Checkout page
				if (typeof mcf !== 'undefined' && typeof mcf.updateKlarnaCheckoutFrame === 'function') {
					mcf.updateKlarnaCheckoutFrame();
				}
			}
		});
		evt.preventDefault();
	});

	// Hide the campaign code input and
	// append the campaign code link only if there's
	// the input and not the submitted code.
	$campaignCodeForm.has('input[type="text"]').hide().before($campaignCodeLink);

	// Show the campaign code input when
	// the campaign code link is clicked.
	$campaignCodeWrap.on('click', 'a', function(evt) {
		evt.preventDefault();
		$campaignCodeLink.fadeOut(200, function() {
			$campaignCodeForm.fadeIn(200);
		});
	});

	//--------------------------------------------------------------------------
	// Packaging/gift-wrapping plugin
	//--------------------------------------------------------------------------

	// It is recommended to initialize the packaging plugin from the template instead,
	// so one can use translated strings and other interface helpers to initialize it:
	//
	// <script>
	//	// #CheckoutAcceptTerms is used as a reference point to insert the packaging checkbox.
	//	// Here we're inserting the checkbox before the 'accept terms' form item.
	//	$('#OrderComments, #KlarnaCheckoutWrapper #PreviewContent').mcfPackaging({
	//		insert: 'after', // valid values are 'before' & 'after'
	//		label: "Add packaging for {Product(id: PACKAGING_PRODUCT_ID, helper: '{{ {ProductPrice(currencysymbol: true)} }}')}?",
	//		productId: PACKAGING_PRODUCT_ID, // packaging product ID
	//		detailsText: '--- PACKAGING ---', // used only when product ID not present
	//		onChange: function() {
	//			if ($.isFunction(mcf.updateKlarnaCheckoutFrame)) {
	//				mcf.updateKlarnaCheckoutFrame();
	//			}
	//		}
	//	});
	// </script>
});
