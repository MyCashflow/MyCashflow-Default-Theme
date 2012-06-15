;(function ( $, window, document, undefined ) {
    
    function serializeData(wrapper) {
			var inputs = wrapper.find("input,select,textarea,button");
			var data = inputs.serialize();
			return data;
    }
    
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
				return "CheckoutShippingMethods";
			} else if (hint.search("payment_method") > -1) {
				return "CheckoutPaymentMethods";
			} else if (hint.search("accept_terms") > -1) {
				return "CheckoutAcceptTerms";
			} else {
				return "Cart";
			}
    }
    
    function getDependencies(id) {
    
    	// shortcuts
    	var that = this;
    	var complete = that.options.complete;
    	var get_success = that.options.get_success;
    	var get_start = that.options.get_start;
		
			var url = "/interface/" + id;
			var $el = $("#" + id);
			var opts = {
				mode: 'form',
				notifications: 'true',
				ajax: 'true'
			};
			
			// Set the ajax options depending on the tagname
			if (id === "CheckoutShippingMethods" || id === "CheckoutPaymentMethods") {
				opts.preselect = false;
			}
			
			// Get the dependency and display the returned html
			$.ajax({
				type: "GET",
				url: 	url,
				data: opts,
				beforeSend: function(jqXHR, settings) {
					if (typeof get_start === "function") {
						get_start($el, jqXHR, settings);
					}
				},
				success: function(html, textStatus, jqXHR) {
					
					that._depsCounter -= 1;
					
					// Call get_success
					if (typeof get_success === "function") {
						get_success($el, html, textStatus, jqXHR);
					}
					
					$el.html(html);
										
				},
				complete: function(jqXHR, textStatus) {
					// Call complete once all dependencies are fetched
					if (that._depsCounter === 0) {
						complete($(that.element), jqXHR, textStatus);
					}
				}
			});

		}

		function saveData(from_event, verbose) {
			// shortcuts
			var that = this;
			var el = $(that.element);
			var opts = that.options;
			var data = serializeData(el);
			var verbose = (verbose === undefined) ? true : verbose;
			var isFocused = el.find("input, select, textarea").filter(":focus").length;

			if (that._isChanged) {

				that._isChanged = false;
										
				$.ajax({
					
					type: "POST",
					url: 	"/cart/",
					data: data + "&ajax=1",
					beforeSend: function(jqXHR, settings) {
					
						verbose = (isFocused > 0 || opts.return_self === false) ? false : true;
						
						if (typeof opts.post_start === "function") {
							var start = opts.post_start(el, from_event, verbose, jqXHR, settings);
							if (start === false) { return false; }
						}
						
					},
					success: function(html, textStatus, jqXHR) {
									
						// Check if there's many dependencies and get them
						if ( typeof opts.dependencies === "object" ) {
							that._depsCounter = opts.dependencies.length;
							$.each(opts.dependencies, function(i) {
								var id = opts.dependencies[i];
								getDependencies.call(that, id, i);
							});
						} else if (opts.dependencies !== false) {
							that._depsCounter = 1;
							var id = opts.dependencies;
							getDependencies.call(that, id, false);
						} else {
							that._depsCounter = 0;
							// No dependencies, call complete
							if (typeof opts.complete === "function") {
								opts.complete(el, html);
							}
						}
												
						if (opts.return_self && isFocused <= 0 && verbose) {
							el.html(html);
						}
						
						if (typeof opts.post_success === "function") {
							opts.post_success(el, html, verbose, textStatus, jqXHR);
						}
						
					}
					
				});
				
			}
			
    }

    var pluginName = 'mcfOnepageCheckout';
    var defaults = {
    	tagname: "auto",
    	dependencies: "auto",
    	return_self: "auto",
    	//notifications: "true",
    	post_start: function(el, from_event, verbose, jqXHR, settings) {
	    },
    	post_success: function(el, html, verbose, textStatus, jqXHR) {
				var isFocused = el.find(":focus").length;
				if (update_self && isFocused <= 0) {
					el.html(html);
				}
	    },
	    get_start: function(el, jqXHR, settings) {
	    },
	    get_success: function(el, html, textStatus, jqXHR) {
	    	el.find("select").customSelect();
	    },
	    complete: function(el) {
	   	}
    };

    function Plugin( element, options ) {
			this.element = element;
			this.options = $.extend( {}, defaults, options) ;
			this._defaults = defaults;
			this._depsCounter = 1;
			this._isChanged = false;
			this._name = pluginName;
			this.init();
		}
    
    Plugin.prototype.init = function () {

			// Shortcut and wrap this.element into jquery object
			var el = $(this.element);

			// Other shortcuts from options
			var opts = this.options;
			
			// Check if tagname shold be autodetected
			if (opts.tagname === "auto") {
				var taghint = el.find("input[name='ajax']").val() || "";
				opts.tagname = detectTagName(taghint);
			}

			// Set the tag dependant variables if they're not predefined
			switch (opts.tagname) {
				case "CheckoutBillingAddress":
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethods", "CheckoutPaymentMethods"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				case "CheckoutShippingAddress":
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethods", "CheckoutPaymentMethods"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				case "CheckoutShippingMethods":
					opts.dependencies = (opts.dependencies === "auto") ? "CheckoutPaymentMethods" : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				case "CheckoutPaymentMethods":
					opts.dependencies = (opts.dependencies === "auto") ? false : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				case "CheckoutAcceptTerms":
					// Accept terms is normally submitted via regular post so we don't want to get anything
					// You could call /interface/CheckoutProcess/ here if you want to get the payment process page after submitting the terms
					opts.dependencies = (opts.dependencies === "auto") ? false : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? false : opts.return_self;
					break;
				/*
				case "Cart":
				
					// Should we even make possible to edit the cart from same page as checkout?
					// While we ponder on this, you can make the Cart by yourself if you're capable :)
					
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethod", "CheckoutPaymentMethod"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
				*/
				default:
					// Normally we want to get shipping and payment methods because they tend to change the most
					opts.dependencies = (opts.dependencies === "auto") ? ["CheckoutShippingMethods", "CheckoutPaymentMethods"] : opts.dependencies;
					opts.return_self = (opts.return_self === "auto") ? true : opts.return_self;
					break;
			}

			var that = this;
			var keyUpTimer = 0;
			
			// All bindings delegated on el
			// These bindings control when we should save the data and get dependencies
			el.on("blur.mcfCheckout", "input, select, textarea", function(event) {
				
				// Clear the keyUpTimer so that the keyup event doesn't trigger after blur
				clearTimeout(keyUpTimer);

				// Delay a bit to new focus to register
				window.setTimeout(function() {
					var isFocused = el.find("input, select, textarea").filter(":focus").length;
					if (isFocused <= 0) {
						saveData.call(that, event.type);
						// Clear the keyUpTimer so that the keyup event doesn't trigger after blur
					}	
					clearTimeout(keyUpTimer);
				}, 200);
				
			})
			
			.on("keyup.mcfCheckout", "input:not(':radio, :checkbox'), select:not('#country, #shipping_country'), textarea", function(event) {

				var target = $(event.target);
				
				// Clear the timer on every keypress
				clearTimeout(keyUpTimer);

				// Wait for 1250 ms after last keypress and then post
	    	keyUpTimer = setTimeout(function() {
	  	  	that._isChanged = true;
					saveData.call(that, event.type);
	    	}, 1250);
				
			})
			
			.on("change.mcfCheckout", "input, select, textarea", function(event) {

				that._isChanged = true;
				var target = $(event.target);

				// Clear the keyUpTimer so that the keyup event doesn't trigger after change
				clearTimeout(keyUpTimer);
				
				if (target.is("input:radio, #country, #shipping_country")) {
 		 			saveData.call(that, event.type, false);
  			}
				
			})
			
			.on("post.mcfCheckout", function(event) {
				that._isChanged = true;
  			saveData.call(that, event.type);
			});
	
    };

    $.fn[pluginName] = function ( options ) {
			return this.each(function () {
				if (!$.data(this, 'plugin_' + pluginName)) {
					$.data(this, 'plugin_' + pluginName,
					new Plugin( this, options ));
				}
			});
		};
    
})( jQuery, window, document );