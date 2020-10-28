$(function() {
	// Show/hide mobile navigation
	$('#MainNavigation').on('click', 'h2',function() {
		$(this).next('ul').toggleClass('show-the-menu');
	});

	// Listen for matchMedia changes with enquire: http://wicky.nillia.ms/enquire.js/ <3
	enquire.register('screen and (max-width: 980px)', {

		match: function() {

			// Wait the document to load before calculating any offsets before images have loaded
			$(window).on('load.responsiveEvents', function() {
				var cartOffset = $('#MiniCartWrapper').offset().top - 9,
					cartShouldBeSticky = function(scrollTop) {
						if (scrollTop > cartOffset) {
							return true;
						} else {
							return false;
						}
					},
					throttledScroll = function() {
						var scrollTop = $(window).scrollTop();
						if (cartShouldBeSticky(scrollTop)) {
							$('#Secondary').addClass('Fixed');
						} else {
							$('#Secondary').removeClass('Fixed');
						}
					};
				$(window).on('scroll.responsiveEvents', _.throttle(throttledScroll, 100));
			});

			// Wrap the whole cart as one big link
			$('#MiniCartWrapper').wrapInner('<a href="/cart/" id="ResponsiveCartLink"></a>');

			// If the cart is empty, display the price as indication
			$('.CartEmpty').html('0,00&euro;').addClass('CartEmptyPrice');

		},
		unmatch: function() {

			// Remove the link by replacing it with it's own content. Clever us.
			$('#ResponsiveCartLink').replaceWith($('#ResponsiveCartLink').contents());

		}

	}).register('screen and (max-width: 680px)', {

		match: function() {

			// Create header for mobile navigation
			$('#MainNavigation:not(:has(> .MobileMenu))').find('.Categories').before('<h2 class="MobileMenu BoxHeader">' + mcf.Lang.BrowseCategories + '</h2>');

			// Remove the events from dropdowns, so that there's no unwanted jitter
			$('#Header').find('.DropdownNavigation').off('mouseenter');
			$('#Header').find('.DropdownNavigation').off('mouseleave');

		},
		unmatch: function() {

			// Reattach the dropdown events when we're again over 680px width
			$('.DropdownNavigation', '#Header').hover(
				function() { $('ul', this).stop(true, true).animate({ height: 'show', opacity: 'show' }, 125); },
				function() { $('ul', this).stop(true, true).animate({ height: 'hide', opacity: 'hide' }, 125); }
			);

		}

	}).listen();

});
