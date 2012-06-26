;(function ( $, window, document, undefined ) {
    
    function checkLangCode(code) {
    	mcf.Lang = mcf.Lang || {};
    	if (mcf.Lang[code] === undefined) {
    		return false;
    	} else {
    		return true;
    	}
    }

    // Create the defaults once
    var pluginName = 'mcfImageSwapper';
    var defaults = {
			variationType: 'auto',
			texts: {
        	loading: (checkLangCode("Loading")) ? mcf.Lang.Loading : "Loading…"
    	}
    };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }
    
    // Image changing. Simply fade in and out stuff before and after of loading the new image.
		function SwapImage(image, href, caption, eq) {
		
			var $imgWrapper = $("#CurrentProductImage"),
					$imgElement = $("img", $imgWrapper),
					$imgLoader = $("#ImgLoader");
					
			var $newImage = $('<img alt="' + caption + '" />').hide(0);
		
			if ($imgElement.attr("src") != image) {
			
				$imgWrapper.data("eq", eq);
			
				$imgElement.fadeOut(300, function() {
					$imgLoader.fadeIn(150, function() {

						$imgElement.before($newImage).remove();
						
						$newImage.load(function() {
							$imgLoader.fadeOut(150, function() {
								
								// After the loader fades out, bring in the new image
								$("#ProductImageCaption").html(caption);
								$imgWrapper.attr("title",caption);
								$imgWrapper.attr("href",href); 
								$newImage.fadeIn(300);
								
							});
						});
						
						$newImage.attr("src",image);
						
					});
				});
			}
			
		}

    Plugin.prototype.init = function () {
      
      var $el, ev, type = this.options.variationType;
      
      // Create image loading spinner
      $("#CurrentProductImage").prepend($('<span id="ImgLoader">'+this.options.texts.loading+'</span>').hide());
      
      // Check if the variationType option isn't pre-set and set the type
      if ( type !== "select" && type !== "radio" ) {
				if ($("#ProductBuy .BuyFormVariationSelect").length) {
					type = "select";
				} else {
					type = "radio";
				}
      }
      
      // Set the wanted event and element according to variationType
			if (type === "radio") {
				$el = $("#ProductBuy .BuyFormVariationRadio input");
				ev = "click";
			} else {
				$el = $("#ProductBuy .BuyFormVariationSelect");
				ev = "change";
			}
			
			// Bind either the change at select or click at input 
			$el.bind(ev, function(event, triggered) {
				
				// Do nothing if the event is triggered
				if (triggered===undefined) {
	
					var vName = (type === "radio" ? $(this).parent("label").text() : $("option:selected", this).text()),
							vTrim = vName.replace(/^[ \t]+|[ \t]+$/,"").toLowerCase();
	
					// Loop through the thumbnails looking for caption-variation name match
					$("#ProductThumbnails li a").each(function() {
					
						var iTrim = $(this).attr("title").replace(/^[ \t]+|[ \t]+$/,"").toLowerCase();
						var matches = (iTrim.length < vTrim.length ? vTrim.match(iTrim) : iTrim.match(vTrim)); 
						
						// If matches => break the loop and trigger click on thumbnail to change the image
						if (matches) {
							var triggered = true;
							$(this).trigger("click", triggered);
							return false;
						}
						
					});
					
				}

			});
			
			// Bind the click event on thumbnails and prevent normal link action
			$("#ProductThumbnails li a").click(function(event, triggered) {
			
				event.preventDefault();
				
				// Gather the needed information from clicked image
				var self = $(this),
						eq = self.parent().prevAll("li").length,
						title = self.attr("title"),
						href = self.attr("href"),
						src = $("#CurrentProductImage img").attr("src"),
						targetSize = src.split("/")[2],
						targetImg = href.split("/")[3],
						newImg = "/tuotekuvat/"+targetSize+"/"+targetImg;

				// Trigger the change
				SwapImage(newImg,href,title,eq);
				
				// Do nothing if the event is triggered
				if (triggered===undefined) {
				
					var iTrim = title.replace(/^[ \t]+|[ \t]+$/,"").toLowerCase(),
							$variationOptions = (type === "radio" ? $el : $("option", $el));
					
					// Loop through the variations looking for caption-variation name match
					$variationOptions.each(function() {
					
						var vName = (type === "radio" ? $(this).parent("label").text() : $(this).text().split("(")[0]),
								vTrim = vName.replace(/^[ \t]+|[ \t]+$/,"").toLowerCase(),
								matches = (iTrim.length < vTrim.length ? vTrim.match(iTrim) : iTrim.match(vTrim)); 

						// If matches => break the loop and trigger click on thumbnail to change the image
						if (matches) {
							var triggered = true;
							type === "radio" ? $(this).trigger("click", triggered) : $(this).attr("selected","selected");
							return false;
						}
						
					});
				}
								
			});

      
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Plugin( this, options ));
            }
        });
    }
    
})( jQuery, window, document );