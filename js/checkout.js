$(function() {
	if ($("body").hasClass("CheckoutShipping")) {
		if ( $(".DefineShippingMethod").parent("div").find("input[type=radio]").is(":checked")) {
			$("#ValitseLahinToimipiste").attr("disabled", "").parent().removeClass("DefineDisabled");
		} else {
			$("#ValitseLahinToimipiste").attr("disabled", "disabled").parent().addClass("DefineDisabled");
		}
		$(".ShippingMethodWrapper > label").click(function () {
			if ( $(".DefineShippingMethod").parent("div").find("input[type=radio]").is(":checked")) { $("#ValitseLahinToimipiste").attr("disabled", "").parent().removeClass("DefineDisabled"); }
			else { $("#ValitseLahinToimipiste").attr("disabled", "disabled").parent().addClass("DefineDisabled"); }
		});
	}
	if ($("body").hasClass("CheckoutNewCustomer")) {
		if ($("#NewCustomerPassword #RegisterYes:checked").length == 0) {
			$("#NewCustomerPassword #Salasana").parent().hide();
		}
		$("#NewCustomerPassword #RegisterYes").click(function() {
			if ($("#NewCustomerPassword #RegisterYes").is(":checked")) {
				$("#NewCustomerPassword #Salasana").parent().slideDown(250);
			} else {
				$("#NewCustomerPassword #Salasana").parent().slideUp(250);
			}
		});
	}
	if ($("body").hasClass("CheckoutConfirmation")) { $(".TermsLink").attr("target","_blank"); }
});