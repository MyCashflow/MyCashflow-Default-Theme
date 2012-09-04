$(function() {

	$(".TermsLink").attr("href", "/interface/TermsAndConditions").colorbox({
		width: "62%",
		height: "80%",
		opacity: 0.5,
		fixed: true,
		title: $(".TermsLink").text()
	});
	
	$("#DisplayCheckoutForm").colorbox({
		opacity: 0.5,
		width: "640px",
		fixed: true,
		inline: true,
		href: "#CheckoutThanksRegistrationForm"
	});

	// Preview of cart
	if ($("#CartTable").length) {
	
		// Show campaign code form
		$("#SubmitCampaignCode").on("submit", "form", function(event) {
		
			event.preventDefault();
			
			var form = $(event.target),
				wrap = $(event.delegateTarget),
				view = wrap.data("view"),
				helper = "helpers/" + wrap.data("helper"),
				loadingEl = (view === "cart") ? $("#CartForm") : $("#PreviewContent");

			loadingEl.append('<div class="CheckoutLoader"></div>');
			
			$.ajax({
				type: "POST",
				url: form.attr("action"),
				data: form.serialize() + "&ajax=1&response_type=json",
				dataType: 'json',
				success: function(response) {
					
					wrap.html(response.content);
					
					if (response.notifications.length > 0) {
						var response_notification = $(response.notifications),
							response_text = response_notification.text(),
							response_type = response_notification.removeClass("Notification").attr("class");
						$.publish("ajax_event", ["coupon_code_update", "coupon", response_text, response_type]);
					}

					// Get the preview table helper with updated data
					$.get("/interface/Helper/", {
						file: helper
					}, function(table) {
						$("#CartTable").replaceWith(table);
						loadingEl.find(".CheckoutLoader").remove();
					});
					
				}
			});
		}).find("form:has('input[type='text']')").hide()
		.before('<a href="#coupon" id="CouponCodeReveal">' + mcf.Lang.CampaignCodeInquiry + '</a>').prev()
		.click(function(event) {
			event.preventDefault();
			$(this).fadeOut(200, function() {
				$(this).next().fadeIn(200);
			});
		});
		
	}
	
	// One page checkout
	if ($("#OnePageCheckout").length) {
		
		$("#CheckoutLoginButton").colorbox({
			opacity: 0.5,
			width: "640px",
			fixed: true,
			href: "/interface/Login?on_success=/checkout/proceed/&on_error=/checkout/proceed/&form_info=CheckoutExistingCustomerInfo"
		});
		
		$("#CheckoutStage").localScroll({
			axis: "y",
			duration: 350,
			offset: {
				left: 0,
				top: -45
			}
		});

		$(".TagWrapper").mcfOnepageCheckout({
		
			tagname: "auto", // Detect from hidden input
    	dependencies: "auto", // Detect from tagname
    	return_self: "auto", // Detect from tagname
    	response_type: "json", // We want to have notifications as separate so we ask for json back

			post_start: function(el, from_event, verbose, jqXHR, settings) {
			
				// If the post updates the sent element it's verbose
				if (verbose) {
					// Append loading indicator
					el.append('<div class="CheckoutLoader"></div>');
				}
			},
			post_success: function(el, response, verbose) {
			
				var tagname = el.attr("id");
			
				if (response.notifications && response.notifications.length > 0) {
				
					var response_notification = $(response.notifications),
						response_text = response_notification.text(),
						response_type = response_notification.removeClass("Notification").attr("class");
					
					var ScrollToEl = el.prevAll("h2");

					$.scrollTo(ScrollToEl, {
						axis: "y",
						duration: 350,
						offset: {
							left: 0,
							top: -36
						}
					});
					
					$.publish("ajax_event", ["onepagecheckout_post", tagname, response_text, response_type]);
					
				} else {
					$("#" + tagname + "Notification").fadeOut(125, function() {
						$(this).remove();
					});
				}
			
				// If the post updates the sent element it's verbose
				if (verbose) {
					
					// Remove loading indicator
					el.find(".CheckoutLoader").remove();
					
					// Make selects pretty
					el.find("select").customSelect();
					
				}
				
			},
			get_start: function(el) {
				el.append('<div class="CheckoutLoader"></div>'); // Append loading indicator
			},
			get_success: function(el) {
				el.find(".CheckoutLoader").remove(); // Remove loading indicator
				el.find("select").customSelect(); // Make selects purdy
				// Add SelectedMethod class to selected method's wrapper
				if (el.is("#CheckoutShippingMethods, #CheckoutPaymentMethods")) {
					el.find("input:radio").click(function() {
						$(this).closest("div").addClass("SelectedMethod")
						.siblings("div").removeClass("SelectedMethod");
					}).filter(":checked").closest("div").addClass("SelectedMethod");
				}
			},
			complete: function(el) {
				// Get the preview table helper with updated data
				$.get("/interface/Helper/", {
					file: 'helpers/preview-cart'
				}, function(table) {
					$("#CartTable").replaceWith(table);
				});
			}
			
		});
		(function(){
			
			var $preview = $("#PreviewContent"),
				preview_height = $preview.height(),
				content_height = $("#OnePageCheckout").innerHeight(),
				$checkout_navigation = $("#CheckoutNavigation"),
				header_height = $("#Main").offset().top;

			$(window).scroll(function(event) {
			
				var in_view = $("#Primary").find("h2 > span[id]:in-viewport").map(function() { return "#" + this.id; }).get(),
					$link = $("#CheckoutStage a").filter(function(index) {
						var href = $(this).attr("href");
						return ($.inArray(href, in_view) !== -1) ? true : false;
					}).parent("li"),
					scroll_top = $(window).scrollTop();
				
				if ($link.length) {
					$("#CheckoutStage li").removeClass('CurrentCheckoutStage');
					$link.addClass('CurrentCheckoutStage');
				}
				
				if (scroll_top > $("#Header").outerHeight()) {
					$checkout_navigation.addClass("Fixed");
				} else {
					$checkout_navigation.removeClass("Fixed");
				}
				
				if ($preview.height() <= content_height) {
				
					$preview.parent().css("height", $("#Primary").css("height"));
					
					if ($(window).scrollTop() + preview_height > $("#Footer").offset().top) {
						$preview.addClass("Absolute");
					} else if (scroll_top > header_height) {
						$preview.removeClass("Absolute").addClass("Fixed");
					} else {
						$preview.removeClass("Absolute Fixed");
					}
				}
			
			});

		})();

	}

	// All Chekcout pages
	(function(){
		
		// Add SelectedMethod classname to selected method
		$("#CheckoutShippingMethods, #CheckoutPaymentMethods").find("input:radio").click(function() {
			$(this).closest("div").addClass("SelectedMethod").siblings("div").removeClass("SelectedMethod");
		}).filter(":checked").closest("div").addClass("SelectedMethod");
				
		// Hide and show shipping address wrapper and delete shipping address
		var $shippingAddressToggleWrap = $("#CheckoutShippingAddressToggle").show();
		var $shippingAddressToggler = $("#CheckoutShippingAddressToggle").find("input");
		var $shippingAddressRemover = $("#RemoveShippingAddress").hide();
		
		var shouldBeShown = function() {
			var rtrn = false;
			var req = $("#CheckoutShippingAddress").find(".FormItem.required").find("input[type='text']");
			if ($shippingAddressToggler.attr("checked") === "checked") {
				turn = true;
			}
			req.each(function() {
				if ($(this).val() !== "") {
					rtrn = true;
					return;
				}
			});
			return rtrn;
		}
		
		if (shouldBeShown()) {
			$shippingAddressToggler.attr("checked",true);
			$shippingAddressToggleWrap.next().show();
			$shippingAddressRemover.show();
		} else {
			$shippingAddressToggler.attr("checked",false);
			$shippingAddressToggleWrap.next().hide();
			$shippingAddressRemover.hide();
		}
		
		$shippingAddressToggler.click(function() {
			var $that = $(this);
			var $wrapper = $shippingAddressToggleWrap.next();
			if ($that.attr("checked") === "checked") {
				$wrapper.fadeIn(125);
				$shippingAddressRemover.fadeIn(125);
			} else {
				$wrapper.fadeOut(125);
				$shippingAddressRemover.fadeOut(125);
			}
		});
		
		$shippingAddressRemover.find("a").click(function(event) {
		
			event.preventDefault();
			
			$("#CheckoutShippingAddress").find("input").not(":hidden").val("");
				
			$("#CheckoutShippingAddress").trigger("post.mcfCheckout");
				
			$shippingAddressToggler.attr("checked",false);
			$shippingAddressToggleWrap.next().hide();
			$shippingAddressRemover.hide();
			
		});
		
	})();

});