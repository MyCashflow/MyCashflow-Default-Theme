$(function() {

	// Change the checkout type 'MultiPageCheckout' if it's supported and we're using mobile resolutions
	// Saves it's state into local storage
	mcf.changeCheckoutType = function(changeToType) {
		if (typeof Modernizr !== 'undefined' && Modernizr.localstorage) {

			var switchableCheckout = localStorage.getItem('switchableCheckout'),
				currentCheckoutType = ($('body').hasClass('SinglePageCheckout')) ? 'SinglePageCheckout' : 'MultiPageCheckout';

			if (!switchableCheckout) {
				switchableCheckout = (currentCheckoutType === 'SinglePageCheckout') ? 'true' : 'false';
				localStorage.setItem('switchableCheckout', switchableCheckout);
			}

			if (switchableCheckout === 'true' && changeToType !== currentCheckoutType) {
				$.ajax({
					type: 'GET',
					url: '/checkout/?' + changeToType,
					data: { ajax: true },
					error: function(jqXHR, textStatus, errorThrown) {
						if (jqXHR.status === 400) {
							// We get error if the other checkout type isn't supported and stop switching
							localStorage.setItem('switchableCheckout', 'false');
						}
					}
				});
			}

		}
	}

	// Listen for matchMedia changes with enquire: http://wicky.nillia.ms/enquire.js/ <3
	enquire.register('screen and (min-width: 981px)', {
		match: function() {
			// If we're bigger, go back to single page checkout
			mcf.changeCheckoutType('SinglePageCheckout');
		}
	}).register('screen and (max-width: 980px)', {

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

			// If we go below the 980px width, change the checkout type
			mcf.changeCheckoutType('MultiPageCheckout');

			// Wrap the whole cart as one big link
			$('#MiniCartWrapper').wrapInner('<a href="/cart/" id="ResponsiveCartLink"></a>')

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
			$('#MainNavigation').find('.Categories').before('<h2 class="MobileMenu BoxHeader">' + mcf.Lang.BrowseCategories + '</h2>');

			// Show/hide mobile navigation
			$('#MainNavigation h2').click(function() {
				$(this).next('ul').toggleClass('show-the-menu');
			});

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