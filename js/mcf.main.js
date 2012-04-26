$(function() {

	$("#ProductImages").mcfImageSwapper();
	
	$("select").customSelect();

	// Text from formhelp into inputs title
	$(".FormItem:not(.CheckWrap)").find(".FormHelp").each(function() {
		var $that = $(this), inputs = $that.prevAll("input");
		inputs.attr("title", $that.text());
		$that.remove();
	});
	
	// Clone the thumbnails so they can be used as colorbox group and open preview from actual thumbnails
	$("#ProductThumbnails").clone().hide().attr("id","fakethumbs").appendTo(document.body);
	
	// Make colorbox group or just open the image
	if ($("#fakethumbs").length) {
		$("#fakethumbs li a").colorbox({
			rel: "fake",
			current: "{current} / {total}"
		});
		// Trigger click on first thumbnail
		$("#CurrentProductImage").click(function(event) {
			$("#fakethumbs li:first-child a").trigger("click");
			event.preventDefault();
		});
	} else {
		$("#CurrentProductImage").colorbox({
			current: "{current} / {total}"
		});
	}

	// Livesearch
	var mcfLiveSearchResultsWidth = $("#SearchForm").css("width");
	$("#SearchForm").append($('<ul id="LiveSearchResults" style="width: '+ mcfLiveSearchResultsWidth +'"></ul>').hide());
	
	$("#SearchInput").typeWatch({
		highlight:true,
		wait: 500,
		callback: function(txt) {
			$("#AjaxMsg").text(mcfLang.Searching); 
			$.ajax({
				type: "GET",
				url: "/interface/SearchProducts",
				data: {
					query: txt,
					limit: 5,
					helper: "helpers/livesearchresults"
				},
				beforeSend: function() {
					$(".SearchIndicator","#SearchForm").fadeIn(500);
				},
				success: function(results) {
					$('#AjaxMsg').slideUp(250);
					$("#LiveSearchResults").html(results).fadeTo(500,0.9);
					$(".SearchIndicator","#SearchForm").addClass("CloseSearchResults").click(function() {
						$("#SearchInput").val("").blur();
						$("#LiveSearchResults").html("");
						$(this).hide().removeClass("CloseSearchResults");
					});
				}
			})
		}
	}).attr("autocomplete","off").after('<span class="SearchIndicator"></span>').keyup(function() {
		if ($(this).val()==="") {
			$("#LiveSearchResults").html("");
			$(".SearchIndicator","#SearchForm").hide().removeClass("CloseSearchResults");
		};
	});


	// Front page banners scroller
	if ($("#BannerScroller").length) {
		if ($("#FrontpageCategoryImage").find("img").length===0) {
			$("#FrontpageCategoryImage").remove();
		}
		var $self = $("#BannerScroller");
		if ($self.find(".FrontBanner").length > 1) {
			$self.wrap('<div id="HoverWrapper" style="position: relative; width: 100%; overflow: hidden;"></div>')
			.after('<a href="#" id="NextBanner"><span class="Icon"></span>'+mcfLang.Next+'</a><a href="#" id="PrevBanner"><span class="Icon"></span>'+mcfLang.Prev+'</a>');
			$("#ScrollableBanners").css("width",$self.find(".FrontBanner").length * 576 + "px");
			$("#HoverWrapper").hover(function() {
				$("#NextBanner,#PrevBanner").stop(true, true).fadeTo(500,0.8);
			}, function() {
				$("#NextBanner,#PrevBanner").stop(true, true).fadeTo(500,0);
			});
		}
		$self.find(".BannerInfo").fadeTo(0,0);
		$("#HoverWrapper").hover(function() {
			$(this).find(".BannerInfo").stop(true, true).fadeTo(500,0.8);
		}, function() {
			$(this).find(".BannerInfo").stop(true, true).fadeTo(500,0);
		});
		$self.serialScroll({
			items: '.FrontBanner',
			prev: '#PrevBanner',
			next: '#NextBanner',
			axis: 'x',
			easing: 'easeOutQuart',
			duration: 600,
			force: true,
			step: 1,
			cycle: true,
			onBefore: function(ev,el) {
				var elh = $(el).css("height"), h = $self.css("height");
				if (h>elh) {
					$self.animate({ height: elh }, 300, 'easeInQuart');
				}
			},
			onAfter: function(el) {
				var elh = $(el).css("height"), h = $self.css("height");
				if (h!=elh) {
					$self.animate({ height: elh }, 300, 'easeOutQuart');
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
			easing: 'easeOutQuart',
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

	// Ajax messages which are fixed on top of page via CSS
	$.ajaxSetup({ cache: false });
	$('<p id="AjaxMsg"></p>').insertAfter("#Container");
	$('#AjaxMsg').ajaxStart(function() { $(this).slideDown(250); });
	$('#AjaxMsg').delegate("#CloseAjaxMsg", "click", function() { $('#AjaxMsg').slideUp(250); });

	// Adding products to cart from productlists with ajax and refreshing of the minicart-tag (some things IE6-disabled)
	$("#Primary, #Secondary").find(".Product:not('.ProductVariations') .AddToCart").click(function(event) {
		var pid = $(this).attr("href").split("/")[2];
		var	listproductname = $(this).closest(".Product").find(".ProductName").text();
		$("#AjaxMsg").text(mcfLang.AddingToCart); 
		$.ajax({
			type: "post",
			url: "/cart/",
			data: {maara:1,tuote:pid},
			success: function() {
				$("#AjaxMsg").html(listproductname + mcfLang.AddedMessage).slideDown(250); 
				if (!($.browser.msie && parseInt($.browser.version)==6)) {
					$.get("/interface/MiniCart", function(minicart) {
						$("#ProductAddedNotification").slideDown(250);
						$("#MiniCartWrapper").html(minicart).slideDown(250);
					});
					$("#MiniCartWrapper").slideUp(250);
				} else {
					$("#ProductAddedNotification").slideDown(250);
				}
			}
		});
		event.preventDefault();
	});

	// Adding products to cart with ajax and refreshing of the minicart-tag
	if ($("#ProductBuy").length) {
		$(".BuyForm").submit(function(event) {
			$("#AjaxMsg").text(mcfLang.AddingToCart); 
			$(".AddToCart",".BuyForm").attr("disabled","disabled");
			$(this).ajaxSubmit(function() {
				$("#ProductAddedNotification").slideUp(250, function() { $(this).remove(); });
				if (!($.browser.msie && parseInt($.browser.version)==6)) {
					$.get("/interface/MiniCart", function(minicart) {
						$(".AddToCart",".BuyForm").removeAttr("disabled");
						$("#PageHeader").after('<div class="Notification Success" id="ProductAddedNotification">'+mcfLang.ProductAddedNotification+'</div>');
						$("#ProductAddedNotification").slideDown(250);
						$("#MiniCartWrapper").html(minicart).slideDown(250);
						$('#AjaxMsg').slideUp(250);
					});
					$("#MiniCartWrapper").slideUp(250);
				} else {
					$(".AddToCart",".BuyForm").removeAttr("disabled");
					$("#PageHeader").after('<div class="Notification Success" id="ProductAddedNotification">'+mcfLang.ProductAddedNotification+'</div>');
					$("#ProductAddedNotification").slideDown(250);
					$('#AjaxMsg').slideUp(250);
				}
			});
			event.preventDefault();
		});
	}
	
	// Removing products from minicart with ajax
	if (!($.browser.msie && parseInt($.browser.version)==6)) {
		$("#MiniCartWrapper").delegate(".CartProductRemove a","click", function(event) {
			$("#AjaxMsg").text(mcfLang.RemoveProductFromCart);
			var $parent = $(this).closest(".CartProduct");
			var rm = $(this).attr("href");
			$.get(rm, function() {
				$parent.slideUp(250, function() { $(this).remove(); });
				$.get("/interface/MiniCart", function(data) {
					var $subtotal = $("dd.SubTotal", data).html();
					$("#MiniCartWrapper dd.SubTotal").fadeOut(250, function() {
						if ($subtotal==null) {
							$("#MiniCartWrapper dd.SubTotal").html('0,<span class="PriceDecimals">00</span><span class="Currency">€</span>');
						} else {
							$("#MiniCartWrapper dd.SubTotal").html($subtotal);
						}
						$("#MiniCartWrapper dd.SubTotal").fadeIn(250);
						$('#AjaxMsg').slideUp(250);
					});
				});
			});
			event.preventDefault();
		});
	}

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