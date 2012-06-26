;(function ( $, window, document, undefined ) {
    
	function checkLangCode(code) {
		mcf.Lang = mcf.Lang || {};
		if (mcf.Lang[code] === undefined) {
			return false;
		} else {
			return true;
		}
	}
    
  function buildPrice(price) {
		price = parseFloat(price.replace(",",".").replace(/[^0-9.]/g, ""));
		if (isNaN(price)) {
			return false;
		} else {
			return price.toFixed(2).replace(".",",") + "€";
		}
  }
	
  // Create the defaults once
  var pluginName = 'mcfVariationSplitter';
  var defaults = {
		variationType: 'auto',
		selectWrapper: '<div class="FormItem"></div>',
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
  
	function filterByProperty(array, property, value) {
		return $.grep(array, function(item) { return item[property] == value; });
	}
	
	function populateSelect(el, items, label) {
		el.options.length = 0;
		if (items.length > 0) {
			el.options[0] = new Option('Valitse ' + label, '');
			$.each(items, function () {
				el.options[el.options.length] = new Option(this.name, this.value);
			});
		}
	}
  
  Plugin.prototype.init = function () {
  
  	var el = $(this.element);
		var	variations = el.find("label").filter(":not(:has(:disabled))");
		var length = variations.length;
		var depth;
		var names = [];
		var values = [];
		var prices = [];
		var stocks = [];
		var ids = [];
		
		var dataObj = [];
				
		variations.each(function(i) {
						
			var $that = $(this);
			var oArr = $that.text().split("|");
			
			depth = depth || oArr.length;
			
			if (depth !== oArr.length) {
				// Lengths mismatch, break out of loop without doing anything
				return false;
			}
			
			if (oArr.length > 1) {
				
				var priceOpt = oArr[oArr.length - 1].split(", ");
				prices[i] = (priceOpt[1]) ? buildPrice(priceOpt[1]) : false;
				stocks[i] = $that.next(".FormHelp").text();
				ids[i] = parseInt($that.find("input").val());
				
				if (prices[i]) {
					// If there's a price, remove the price from the array
					oArr.splice(oArr.length - 1, 1, priceOpt[0]);
				}
				
				$.each(oArr, function(j, v) {
				
					values[j] = values[j] || [];
				
					v = $.trim(v);
	
					var pair = v.split(":");
					var value = $.trim(pair[1]);
					var name = $.trim(pair[0]);

					if (i === 0) {
						names[j] = name;
					}
					
					values[j][i] = value;
					
				});
				
			}
						
		});

		var ob = [];
		
		for (var i = 0; i < length; i++) {
		
			var match = -1;
			var parent = ob;
		
			for (var j = 0; j < depth; j++) {
				
				var value = values[j][i];
				var o = {};

				//console.log(values[j][i]);
				
				if (j < depth - 1) {
				
					for (var x = 0; x < parent.length; x++) {
				  	match = (parent[x][names[j]] === value) ? x : -1;
				  	if (match !== -1) { break; }
				  }
					
					if (match < 0) {
						o[names[j]] = value;
						o["Models"] = [];
						parent.push(o);
						parent = parent[parent.length - 1]["Models"];
					} else {
						parent = parent[match]["Models"];
					}
					
				} else {
			
					o[names[j]] = value;
					o["Price"] = prices[i];
					o["Stock"] = stocks[i];
					o["ID"] = ids[i];
					parent.push(o);
				
				}

			}

		}
		
		for (var i = 0; i < depth; i++) {
			var name = names[i];
			$('<div class="FormItem VariationItem"><label for="mcfSelect-' + i + '">' + name + '</label><select id="mcfSelect-' + i + '" class="SplitVariationSelect"><option>Valitse ' + name + '</option></select></div>').appendTo(el).hide();
			if (i + 1 === depth) {
				$('<div class="FormItem VariationItem"><dl id="VariationData"></dl></div>').appendTo(el).hide();
			}
		}
		
		$('#mcfSelect-0').closest(".FormItem").show();

		populateSelect( $('#mcfSelect-0').get(0), $.map(ob, function(item) {
			return { name: item[names[0]], value: item[names[0]] };
		}), names[0]);
		
	  var selectedVariation;
	  
		el.on("change", ".SplitVariationSelect", function(event) {
		
	    var target = $(event.target);
	    var value = this.value;
	    var lvl = parseInt(this.id.split("-")[1]);
	    var next = lvl + 1;
	    var $next = $('#mcfSelect-' + next);
	    var items = [];
	    
	    $next.closest(".FormItem").show().nextAll(".VariationItem").hide();
	    
	    if (lvl === 0) {
	    
	    	selected = filterByProperty(ob, names[lvl], value);
		     
		    if (selected.length > 0) {
					items = $.map(selected[0]["Models"], function(item) {
						return {
							name: item[names[1]],
							value: value + '.' + item[names[next]]
						};
					});
				}
					
				populateSelect($next.get(0), items, names[next]);
				
		  } else if (lvl < depth - 1) {
	    
	    	values = value.split(".");
	    	
	    	var endvalue = values[0];
	    	var cacheselected = filterByProperty(ob, names[0], values[0]);

    		for (var i = 1; i <= lvl; i++) {
    			endvalue = endvalue + '.' + values[i];
    			var sel = cacheselected;
					if (sel.length > 0) {
						cacheselected = filterByProperty(sel[0]["Models"], names[i], values[i]);
					}
    		}
    		
    		selected = cacheselected;
    		
				items = $.map(selected[0]["Models"], function(item) {
					return {
						name: item[names[next]],
						value: endvalue + '.' + item[names[next]]
					}
				});
								
				populateSelect($next.get(0), items, names[next]);

				//console.log(cacheselected);
	    	
	    } else {
	    
				data = $.map(selected[0]["Models"], function(item) {
					return {
						id: item.ID,
						stock: item.Stock,
						price: item.Price
					}
				});
				
				console.log(data);
	    }
		  
		});

/*
    $('#mcfSelect-0').bind('change', function() {
	    var value = this.value;
	    var selected = filterByProperty(ob, names[0], value);
	    var items = [];
	     
	    if (selected.length > 0) {
				items = $.map(selected[0]["Models"], function(item) {
					return {
						name: item[names[1]],
						value: value + '.' + item[names[1]]
					};
				});
			}
	    
			populateSelect($('#mcfSelect-1').get(0), items, names[1]);

    });


// populating 3rd select list
$('#mcfSelect-1').bind('change', function () {

	var values = this.value.split('.');
	var items = [];

	if (values.length === 2) {
		var selected = filterByProperty(ob, names[0], values[0]);
		
		console.log(selected, names[0], values[0], names[1], values[1]);

		if (selected.length > 0) {
			var selected_2 = filterByProperty(selected[0]["Models"], names[1], values[1]);
				
			if (selected_2.length > 0) {
				items = $.map(selected_2[0]["Models"], function(item) {
					return {
						name: item[names[2]],
						value: values[0] + '.' + values[1] + '.' + item[names[2]]
					}
				});
			}
		}
	}

	populateSelect($('#mcfSelect-2').get(0), items, names[2]);

});

    // alerting value on 3rd select list change
    $('#mcfSelect-2').bind('change', function () { 
        if (this.value.length > 0)
                alert(this.value);
    })				
*/

  };


  /*
	function filterByProperty(array, property, value) {
		return $.grep(array, function(item) { return item[property] == value; });
	}
	*/

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
/*

(function($) {

  var methods = {
		init : function(options) {
			
			settings = $.extend({}, $.fn.variationsplitter.defaults, options);
			
			this.each(function(i) {
			
				var $this = $(this);
				var breik = false;
				
				if (!breik) {
					
					buildDataModel(allNames,allValues,allPrices,allAvailabilities,allIds);
					
					console.log(VariationObject);
					
					$this.css({
						position: "absolute",
						left: "-1000em"
					});
					
					$this.before('<div class="FormItem"><label for="mcfSelect-' + allNames[0][0] + '">' + allNames[0][0] + '</label><select id="mcfSelect-' + allNames[0][0] + '"><option>Valitse ' + allNames[0][0] + '</option></select></div><div class="FormItem"><label for="mcfSelect-' + allNames[0][1] + '">' + allNames[0][1] + '</label><select id="mcfSelect-' + allNames[0][1] + '"><option>Valitse ' + allNames[0][1] + '</option></select></div>');
					
					populateSelect($('#mcfSelect-' + allNames[0][0]).get(0), $.map(VariationObject, function(model) {
						return { name: model[allNames[0][0]], value: model[allNames[0][0]] };
					}), allNames[0][0]);
	
			    $('#mcfSelect-' + allNames[0][0]).bind('change', function() {
			        var modelname = this.value;
			        var model = filterByProperty(VariationObject, allNames[0][0], modelname);
			        var models = [];
			         
			        if (model.length > 0) {
								models = $.map(model[0].Models, function(model) {
									return {
										name: model[allNames[0][1]],
										value: modelname + '.' + model[allNames[0][1]]
									};
								});
							}
			        
			        populateSelect($('#mcfSelect-' + allNames[0][1]).get(0), models, allNames[0][1]);
	
			    });
	
	
			    $('#mcfSelect-' + allNames[0][1]).bind('change', function () {
						var selectedVariation = this.value.split('.');
						var Price, Availability, ID;
							
						if (selectedVariation.length === 2) {
							var firstSelect = selectedVariation[0];
							var secondSelect = selectedVariation[1];
							var v = filterByProperty(VariationObject, allNames[0][0], firstSelect);
							if (firstSelect.length > 0) {
								var model = filterByProperty(v[0].Models, allNames[0][1], secondSelect);
								if (model.length > 0) {
									Price = model[0].ProductData.Price;
									ID = model[0].ProductData.ID;
									Availability = model[0].ProductData.Availability;
								}
							}
						}
											
						//$(this).after('<p class="FormHelp">Hinta: <strong>' + Price + '</strong>, Saatavuus: <strong>' + Availability + '</strong></p>');
						
						$this.find("input[value=" + ID + "]").attr("checked","checked");
						
			    });
			   
			  }
				
				return this;
				
			});
		}
	};

  $.fn.variationsplitter = function(method) {
    if ( methods[method] ) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || ! method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.variationsplitter');
    }    
  };
  
	$.fn.variationsplitter.defaults = {};
	var settings = {};

	var allValues = [];
	var allNames = [];
	var allIds = [];
	var allPrices = [];
	var allAvailabilities = [];

	function filterByProperty(array, property, value) {
		return $.grep(array, function(item) { return item[property] == value; });
	}
	
	function populateSelect(el, items, label) {
		el.options.length = 0;
		if (items.length > 0) {
			el.options[0] = new Option('Valitse ' + label, '');
			$.each(items, function () {
				el.options[el.options.length] = new Option(this.name, this.value);
			});
		}
	}
	
	var VariationObject = [];

	function buildDataModel(names, values, prices, stocks, ids) {
		$.each(values, function(i, v) {
		
			var o = {};
			var variationName = names[i][0];
			var variationValue = v[0];
			var match = false;
			
			o[variationName] = variationValue;
			o["Models"] = [];

			var variationData = {
				ProductData: {
					ID: undefined,
					Price: undefined,
					Availability: undefined,
				}
			};
			
			variationData.ProductData = {};
			variationData.ProductData.ID = ids[i];
			variationData.ProductData.Price = prices[i];
			variationData.ProductData.Availability = stocks[i];
			variationData[names[i][1]] = v[1];
			
			o.Models.push(variationData);
			
			$.each(VariationObject, function(a,b) {
				for (var key in b) {
					console.log(a,b[key],variationValue);
					if (b[key] === variationValue) {
						VariationObject[a]["Models"].push(variationData);
						match = true;
					}
				}
			});
			
			if (!match) { VariationObject.push(o); }

		});

	}

})(jQuery);*/