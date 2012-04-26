;(function ( $, window, document, undefined ) {
    
    function checkLangCode(code) {
    	var mcfLang = mcfLang || {};
    	if (mcfLang[code] === undefined) {
    		return false;
    	} else {
    		return true;
    	}
    }
    
    function serializeData(wrapper) {
			var inputs = wrapper.find("input,select,textarea,button");
			var data = inputs.serialize();
			return data;
    }
    
		var delay = function() {
		  var timer = 0;
		  return function(callback, ms){
		    clearTimeout (timer);
		    timer = setTimeout(callback, ms);
		  };
		};
    
    var reqFilled = function(el) {
	
				var all_inputs = el.find("input[type='text']");
				var required_inputs = el.find(".FormItem.required").find("input[type='text']");
				var filled_all_inputs = all_inputs.filter(function() { return $.trim($(this).val()).length; });
				var filled_req_inputs = required_inputs.filter(function() { return $.trim($(this).val()).length; });
				
				if (filled_all_inputs.length === all_inputs.length) {
					return "ALL";
				} else if (filled_req_inputs.length >= required_inputs.length) {
					return "REQ";
				} else {
					return false;
				}
								
    };
		
    function detectTagName(hint) {
			// Build tagname option from the hint if needed
			if (hint.search("customer_information") > -1) {
				return "CheckoutBillingAddress";
			} else if (hint.search("shipping_information") > -1) {
				return "CheckoutShippingAddress";
			} else if (hint.search("shipping_method") > -1) {
				return "CheckoutShippingMethod";
			} else if (hint.search("payment_method") > -1) {
				return "CheckoutPaymentMethod";
			} else if (hint.search("accept_terms") > -1) {
				return "CheckoutAcceptTerms";
			} else {
				return "Cart";
			}
    }
    
    function getDependencies(tag, callback, l, i) {
    
			var url = "/interface/" + tag;
			var $el = $("#" + tag);
			var opts = {
				mode: 'form',
				notifications: 'true',
				ajax: 'true'
			};
			
			$("#AjaxMsg").text("Haetaan riippuvuuksia.");
			
			// Set the ajax options depending on the tagname
			if (tag === "CheckoutShippingMethod" || tag === "CheckoutPaymentMethod") {
				opts.preselect = 'false';
			}
			
			// Get the dependency and display the returned html
			$.get(url, opts, function(html) {
			
				$el.html(html).closest("fieldset").find(".Blocker").remove();
				
				// Hide the message once everything has been get
				if (l === undefined) {
					$('#AjaxMsg').slideUp(250);
				} else if (l === i + 1) {
					$('#AjaxMsg').slideUp(250);
				}
				
				if (typeof callback === "function") { callback($el, html); }
				
			});			

    }
    
    function saveData(that, el, silently) {
    
    	// shortcut options
    	var opts = that.options;
    	var data = serializeData(el);

			$.ajax({
				
				type: "POST",
				url: 	"/cart/",
				data: data,
				success: function(html) {
								
					// Check if there's many dependencies and get them
					if ( typeof opts.dependencies === "object" ) {
						$.each(opts.dependencies, function(i) {
							var id = opts.dependencies[i];
							getDependencies(id, opts.success, opts.dependencies.length, i);
						});
					} else if (opts.dependencies !== false) {
						var id = opts.dependencies;
						getDependencies(id, opts.success);
					} else {
						// Hide the loading message if we're not getting anything
						$('#AjaxMsg').slideUp(250);
					}
					
					// Check if we're expencting something back and display it
					if (opts.return_self === true && !silently) {
						el.html(html);
						if (typeof opts.success === "function") { opts.success(el, html); }
					}
					
				}
				
			});
			
    }

    var pluginName = 'mcfOnepageCheckout';
    var defaults = {
    	tagname: "detect",
    	dependencies: "auto",
    	return_self: "auto",
    	notifications: "true",
    	success: function(el, html) {
	    	el.find("select").customSelect();
	    },
    	texts: {
        	loading: (checkLangCode("Loading")) ? mcfLang.Loading : "Loading…"
    	}
    };

    function Plugin( element, options ) {
			this.element = element;
			this.options = $.extend( {}, defaults, options) ;
			this._defaults = defaults;
			this._name = pluginName;
			this.init();
		}
    
    Plugin.prototype.init = function () {
			
			// Shortcut and wrap this.element into jquery object
			var el = $(this.element);
						
			// Other shortcuts from options
			var opts = this.options;
			
			// Check if tagname shold be autodetected
			if (opts.tagname === "detect") {
				var taghint = el.find("input[name='ajax']").val() || "";
				opts.tagname = detectTagName(taghint);				
			}

			// Set the tag dependant variables if they're not predefined
			switch (opts.tagname) {
				case "CheckoutBillingAddress":
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethod", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				case "CheckoutShippingAddress":
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethod", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				case "CheckoutShippingMethod":
					opts.dependencies = (opts.dependencies === "auto") ? ["Cart", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				case "CheckoutPaymentMethod":
					opts.dependencies = (opts.dependencies === "auto") ? ["Cart", "CheckoutAcceptTerms"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				case "CheckoutAcceptTerms":
					// Accept terms is submitted via regular post so we don't want to get anything
					opts.dependencies = (opts.dependencies === "auto") ? false : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				case "Cart":
					// Should we even make possible to edit the cart from same page as checkout?
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethod", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				default:
					// Normally we want to get shipping and payment methods because they tend to change the most
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethod", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
			}
			
			this.options = opts;
			var that = this;
			
			var isChanged = false;
			var keyUpTimer = 0;
			
			// All bindings delegated on el
			el.on("blur.mcfCheckout", "input[type='text']", function(event) {
				if (isChanged) {
				
					// Delay a bit to new focus to register
					window.setTimeout(function() {
						clearTimeout(keyUpTimer);
						if (el.find("input, select, textarea").filter(":focus").length === 0) {
							saveData(that, el);
							isChanged = false;
						}
					}, 200);
				
				}				
			})
			
			.on("keyup.mcfCheckout", "input, select, textarea", function(event) {

				clearTimeout(keyUpTimer);
				
				var req = reqFilled(el);
								
				// If required inputs are filled, wait for 1,5 secs after last keypress and then post
				if (req !== false) {
		    	keyUpTimer = setTimeout(function() {
						var silently = (req === "ALL") ? false : true;
						saveData(that, el, silently);
						isChanged = false;
		    	}, 1500);
				}
				
			})
			
			.on("change.mcfCheckout", "input, select, textarea", function(event) {
			
				// Clear the keyUpTimer so that the keyup event doesn't trigger after change
				clearTimeout(keyUpTimer);

				isChanged = true;				
				var target = $(event.target);
				
				if (target.attr("id") === "country" || target.attr("id") === "shipping_country") {
					var silently = true;
  				saveData(that, el, silently);
					isChanged = false;
				}
				
				if (target.is(":radio")) {
  				saveData(that, el);
					isChanged = false;
				}

			})
			
			.on("post.mcfCheckout", function(event) {
  			saveData(that, el);
				isChanged = false;
			});
	
    };

    $.fn[pluginName] = function ( options ) {
			return this.each(function () {
				if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName,
					new Plugin( this, options ));
				}
			});
		}
    
})( jQuery, window, document );