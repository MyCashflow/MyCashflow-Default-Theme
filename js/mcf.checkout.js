$(function() {

	if ($("#OnePageCheckout").length) {
		
		$(".TagWrapper").mcfOnepageCheckout({
			success: function(el) { el.find("select").customSelect(); }
		});
	
		// Hide and show shipping address wrapper and delete shipping address
		(function(){
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
		
	}

});