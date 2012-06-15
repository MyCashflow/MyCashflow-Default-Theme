/* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
 * http://benalman.com/
 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */

(function($) {
	var o = $({});
	$.subscribe = function() {
		o.on.apply(o, arguments);
	};
	$.unsubscribe = function() {
		o.off.apply(o, arguments);
	};
	$.publish = function() {
		o.trigger.apply(o, arguments);
	};
}(jQuery));

$.subscribe("ajax_event", function(originalEvent, ajaxEvent, eventCategory, message, type) {
	
	var categoryEl = $("#" + eventCategory + "Notification"),
		message = "<p>" + message + "</p><span class='Close'></span>",
		$notification = $('<div class="Notification" id="' + eventCategory + 'Notification"></div>').hide();
		
		if (type !== undefined) {
			$notification.addClass(type);
		}
	
	// If product is added to cart
	if (ajaxEvent === "adding_to_cart") {
		$("#MiniCartWrapper").append('<div class="CheckoutLoader"></div>');
	} else if (ajaxEvent === "added_to_cart") {
		message = message + '<p><a href="#Close" class="Close">' + mcfLang.HideNotification + '</a> | <a href="/cart/">' + mcfLang.ShoppingCartEdit + '</a> | <a href="/checkout/">' + mcfLang.OrderProducts + '</a></p>';
		$.ajax({
			type: "GET",
			url: "/interface/Helper",
			data: {
				file: 'helpers/minicart'
			},
			success: function(minicart) {
				$("#MiniCartWrapper").html(minicart);
			}
		});
	} else if (ajaxEvent === "removed_from_cart") {
		$.ajax({
			type: "GET",
			url: "/interface/CartSubTotal",
			success: function(price) {
				$("#MiniCartFooter").find(".SubTotal").html(price);
			}
		});
	}
	
	// Keep just one notification per notification category
	if (categoryEl.length) {
		categoryEl.fadeOut(250, function() {
			categoryEl.html(message);
			categoryEl.fadeIn(250);
		});
	} else {
		$notification.append(message).appendTo("#NotificationCenter").fadeIn(250);
	}
	
})

$(function() {

	$("#NotificationCenter").on("click", ".Close", function(event) {
		event.preventDefault();
		$(this).closest(".Notification").fadeOut(125, function() { $(this).remove(); });
	});
	
	$("#Primary").find("form.PaginationSorterForm").find("select").change(function(event) {
		$(this).closest("form").trigger("submit");
	}).end().find("button").hide();
		
	$("select").customSelect();
	
	// Header Dropdowns
	$("#Header").find(".DropdownNavigation").hover(function(event) {
		$(this).find("ul").stop(true, true).animate({
			height: "show",
			opacity: "show"
		},125);
	}, function(event) {
		$(this).find("ul").stop(true, true).animate({
			height: "hide",
			opacity: "hide"
		},125);
	}).find("ul").css({
		left: "0px"
	}).hide();

	
	// Livesearch
	var mcfLiveSearchResultsWidth = $("#SearchForm").css("width");
	$("#SearchForm").append($('<ul id="LiveSearchResults" style="width: '+ mcfLiveSearchResultsWidth +'"></ul>').hide());
	
	$("#SearchInput").typeWatch({
		highlight:true,
		wait: 500,
		callback: function(txt) {
			//$("#AjaxMsg").text(mcfLang.Searching);
			$.ajax({
				type: "GET",
				url: "/interface/SearchProducts",
				data: {
					query: txt,
					limit: 5,
					helper: "helpers/livesearchresults"
				},
				beforeSend: function() {
					$(".SearchIndicator", "#SearchForm").fadeIn(500);
					$("#SearchForm").addClass("SearchActive");
				},
				success: function(results) {
					//$('#AjaxMsg').slideUp(250);
					$.publish('foo', 1);
					$("#LiveSearchResults").html(results).fadeTo(500,0.9);
					$(".SearchIndicator","#SearchForm").addClass("CloseSearchResults").click(function() {
						$("#SearchInput").val("").blur();
						$("#LiveSearchResults").html("");
						$(this).hide().removeClass("CloseSearchResults");
						$("#SearchForm").removeClass("SearchActive");
					});
				}
			})
		}
	}).attr("autocomplete","off").after('<span class="SearchIndicator"></span>').keyup(function() {
		if ($(this).val()==="") {
			$("#LiveSearchResults").html("");
			$(".SearchIndicator","#SearchForm").hide().removeClass("CloseSearchResults");
			$("#SearchForm").removeClass("SearchActive");
		};
	});


	// Front page banners scroller
	if ($("#BannerScroller").length) {
		if ($("#FrontpageCategoryImage").find("img").length===0) {
			$("#FrontpageCategoryImage").remove();
		}
		var $FrontBannerScroller = $("#BannerScroller");
		if ($FrontBannerScroller.find(".FrontBanner").length > 1) {
			$FrontBannerScroller.wrap('<div id="HoverWrapper" style="position: relative; width: 100%; overflow: hidden;"></div>')
			.after('<a href="#" id="NextBanner"><span class="Icon"></span>'+mcfLang.Next+'</a><a href="#" id="PrevBanner"><span class="Icon"></span>'+mcfLang.Prev+'</a>');
			$("#ScrollableBanners").css("width", $FrontBannerScroller.find(".FrontBanner").length * 576 + "px");
			$("#HoverWrapper").hover(function() {
				$("#NextBanner,#PrevBanner").stop(true, true).fadeTo(500,0.8);
			}, function() {
				$("#NextBanner,#PrevBanner").stop(true, true).fadeTo(500,0);
			});
		}
		$FrontBannerScroller.find(".BannerInfo").fadeTo(0,0);
		$("#HoverWrapper").hover(function() {
			$(this).find(".BannerInfo").stop(true, true).fadeTo(500,0.8);
		}, function() {
			$(this).find(".BannerInfo").stop(true, true).fadeTo(500,0);
		});
		$FrontBannerScroller.serialScroll({
			items: '.FrontBanner',
			prev: '#PrevBanner',
			next: '#NextBanner',
			axis: 'x',
			duration: 600,
			force: true,
			step: 1,
			cycle: true,
			onBefore: function(ev,el) {
				var elh = $(el).css("height"), h = $FrontBannerScroller.css("height");
				if (h>elh) {
					$FrontBannerScroller.animate({ height: elh }, 300);
				}
			},
			onAfter: function(el) {
				var elh = $(el).css("height"), h = $FrontBannerScroller.css("height");
				if (h!=elh) {
					$FrontBannerScroller.animate({ height: elh }, 300);
				}
			}
		});
	}
	
	// Crossselling carousel at productpage and cart
	if ($("#CrossSaleProducts").find("div.Product").length) {
	
		$("#CrossSaleScroller")
			.css("overflow","hidden")
			.before('<span id="ScrollToPrev" style="display: none;"><span class="Icon"></span>'+mcfLang.PrevPlural+'</span><span id="ScrollToNext"><span class="Icon"></span>'+mcfLang.NextPlural+'</span>');
			
		$("#CrossSaleProducts").css("width","2304px");
		
		var $prev = $('#ScrollToPrev'),
				$next = $('#ScrollToNext'),
				$scp = $('#CrossSaleScroller');
				
		$scp.serialScroll({
			items: '.Product',
			prev: '#ScrollToPrev',
			next: '#ScrollToNext',
			axis: 'x',
			duration: 350,
			force: true,
			step: 3,
			exclude: 2,
			cycle: false,
			onBefore: function(e,elem,$pane,$items,pos) {
				$prev.add($next).fadeIn(250);
				if (pos==0) {
					$prev.fadeOut(250);
				} else if (pos==$items.length-3) {
					$next.fadeOut(250);
				}
			}
		});
		
		$(document).keyup(function(e) {
			switch (e.keyCode) {
				case 39:
					$scp.trigger('next');
					break;
				case 37:
					$scp.trigger('prev');
					break;
			}
		});
		
	}

	// Adding products to cart from productlists with ajax and refreshing of the minicart-tag (some things IE6-disabled)
	$(document).on("click", "a.AddToCart", function(event) {
		
		event.preventDefault();
		
		var target = $(event.currentTarget),
				pid = target.attr("href").split("/")[2],
				product = target.closest(".Product"),
				name = product.find(".ProductName").text();
		
		if (product.hasClass("ProductVariations") || product.hasClass("ProductTailorings")) {
			$.colorbox({
				width: "640px",
				title: target.text() + "&nbsp;" + name,
				href: "/interface/ProductBuy?setProduct=" + pid
			});
		} else {
			$.ajax({
				type: "POST",
				url: "/cart/",
				data: {
					products: [
						{ product_id: pid }
					],
					ajax: 1,
					response_type: "json"
				},
				dataType: 'json',
				beforeSend: function() {
					$.publish("ajax_event", ["adding_to_cart", "product", mcfLang.AddingToCart]);
				},
				success: function(response) {
					if (response.notifications && response.notifications.length > 0) {
						var response_notification = $(response.notifications),
							response_text = response_notification.text(),
							response_type = response_notification.removeClass("Notification").attr("class");
						$.publish("ajax_event", ["added_to_cart", "product", response_text, response_type]);
					}
				}
			});
		}
		
	});

	// Adding products to cart with ajax and refreshing of the minicart-tag
	$(document).on("submit", ".BuyForm", function(event) {
	
		event.preventDefault();
		
		var target = $(event.currentTarget),
			btn = target.find(".AddToCart"),
			formData = target.serialize() + "&ajax=1",
			colorboxed = target.closest("#cboxLoadedContent").length;

		btn.attr("disabled", "disabled");

		$.ajax({
			type: "POST",
			url: "/cart/",
			data: formData + "&ajax=1&response_type=json",
			dataType: 'json',
			beforeSend: function() {
				$.publish("ajax_event", ["adding_to_cart", "product", mcfLang.AddingToCart]);
			},
			success: function(response) {
				
				if (colorboxed) {
					$.colorbox.close();
				}
				btn.removeAttr("disabled");

				if (response.notifications && response.notifications.length > 0) {
					var response_notification = $(response.notifications),
						response_text = response_notification.text(),
						response_type = response_notification.removeClass("Notification").attr("class");
					$.publish("ajax_event", ["added_to_cart", "product", response_text, response_type]);
				}

			}
		});
		
	});

	$("#MiniCartWrapper").on("click", ".CartRemove", function(event) {
	
		event.preventDefault();
		
		var target = $(event.target),
			parent = target.closest("li"),
			name = parent.find("h3 a").text();
			
		parent.slideUp(250);
		
		$.ajax({
			type: "GET",
			url: target.attr("href"),
			data: { ajax: 1 },
			success: function(response) {
				var $response = $(response).text();
				$.publish("ajax_event", ["removed_from_cart", "cart", $response]);
			}
		});
	});
	
	// Categorynavigation openers
	$("ul.Categories li:has(> ul)").addClass("Openable").each(function() {
		if ($(this).hasClass("Current")) {
			$(this).prepend('<span class="NavOpener Opened" title="'+ mcfLang.HideSubCategories +'">-</span>');
		} else {
			$(this).prepend('<span class="NavOpener" title="'+ mcfLang.ShowSubCategories +'">+</span>');
		}
		$("> .NavOpener", this).click(function() {
			$(this).next("a").next("ul").slideToggle(300);
			if ($(this).text() == "-" ) {
				$(this).text("+").attr("title",mcfLang.ShowSubCategories);
			} else {
				$(this).text("-").attr("title",mcfLang.HideSubCategories);
			}
			$(this).toggleClass("Opened")
		});
	});

});