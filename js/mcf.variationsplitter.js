/*!
 * File: mcf.variationsplitter.js
 * Part of MyCashFlow's default theme.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true */
/*global _:false */

$(function() {
	'use strict';

	var pluginName = 'mcfVariationSplitter',
		defaults = {},
		BREAKING_CHARS_REGEX = /\"/g;

	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	Plugin.prototype.parseVariationGroups = function(selector) {
		var variations = [],
			$select = $(selector).find('select'),
			$radios = $(selector).find('input[type=radio]'),
			isRadio = ($radios.length) ? true : false,
			$options = (isRadio)
				? $(selector).find('label')
				: $select.find('option');

		$options.each(function(i, el) {
			var $el = $(el),
				text = $el.text().split('|'),
				temp = [],
				discontinued = false;

			if (isRadio && $el.find("input").is("[disabled]")) discontinued = true;
			else if (!isRadio && $el.is("[disabled]")) discontinued = true;

			if (discontinued) return true;

			$.each(text, function(level, group) {
				var keyValue = group.split(':'),
					isLast = level === (text.length) - 1;

				if (keyValue.length == 1) keyValue.unshift(mcf.Lang.Variation);
				if (!isRadio) {
					var availability = keyValue[1].match(/\(([^\)]+)\)/, '');
					if (availability) keyValue[1] = keyValue[1].replace(' (' + availability[1] + ')', '');
				}

				var group = {
					last: isLast,
					level: level,
					label: $.trim(keyValue[0]),
					group: $.trim(keyValue[0]) + '-' + level,
					value: $.trim(keyValue[1]),
					triggers: level ? _.pluck(temp, 'value') : null
				};

				var price = keyValue[1].match(/(\d+,\d+)/),
					availability = (availability)
						? availability[1]
						: $el.next('.FormHelp').text(),
					$option = $el.is('option')
						? $el
						: $el.find('input');

				price = price
					? _.last(price)
					: 'N/A';

				if (isLast) {
					$.extend(group, {
						el: $option,
						price: price,
						availability: availability
					});
				}

				temp.push(group);
			});

			variations.push(temp);
		});

		return (_.flatten(variations));
	};

	Plugin.prototype.renderVariationGroups = function(variations, filters, level) {
		var groups = [],
			uniqs = [],
			labels = [],
			markup = [];

		// Find the matching groups.
		groups = _.filter(variations, function(obj) { return obj.level === level && _.isEqual(obj.triggers, filters); });

		// Get unique group names.
		uniqs = _.pluck(groups, 'group');
		uniqs = _.uniq(uniqs);

		// Get unique group labels.
		labels = _.pluck(groups, 'label');
		labels = _.uniq(labels);

		markup.push('<div class="FormItem VariationGroup" data-level="' + level + '">');

		$.each(uniqs, function (i, group) {
			var groupValues = [],
				optionsHtml = [];

			groupValues = _.filter(groups, function(obj) { return obj.group === group; });
			groupValues = _.pluck(groupValues, 'value');
			groupValues = _.uniq(groupValues);

			$.each(groupValues, function (j, value) {
				optionsHtml.push('<option value="' + value.replace(BREAKING_CHARS_REGEX, '') + '">' + value + '</option>');
			});

			markup.push('<label for="VariationGroupSelect-' + level + '">' + labels[i] + ':</label>');
			markup.push('<select id="VariationGroupSelect-' + level + '">');
			markup.push('<option value="">' + mcf.Lang.Choose + ' ' + labels[i] + '</option>');
			markup.push(optionsHtml.join(''));
			markup.push('</select>');
		});

		markup.push('</div>');

		return (markup.join(''));
	};

	Plugin.prototype.getActiveFilters = function(maxGroupLevel) {
		var activeFilters = [];

		$(this.element).find('.VariationGroup', '#VariationGroups').each(function() {
			$(this).data('level') > maxGroupLevel
				? $(this).remove()
				: activeFilters.push($(this).find(':selected').val());
		});

		return (activeFilters);
	};

	Plugin.prototype.init = function() {
		var plugin = this,
			$variationGroupsWrap = $('<div id="VariationGroups"></div>'),
			$buyFormFieldset = $('[class*=BuyFormVariation]', this.element),
			$buyFormSubmit = $('button.AddToCart', this.element),
			$availability = $('.Availability', '#ModalBuying'),
			$buyFormRadios = $buyFormFieldset.find('input[type=radio]'),
			$buyFormSelect = $buyFormFieldset.find('select'),
			hasVariationSplits = $buyFormFieldset.find('label:contains(|), select:contains(|)').length;

		if (hasVariationSplits) {
			var variationGroups = plugin.parseVariationGroups($buyFormFieldset),
				groupedByTriggers = _.groupBy(variationGroups, 'triggers'),
				groupedByTriggers = _.toArray(groupedByTriggers),
				isAValidSplit = true;

			_.each(groupedByTriggers, function(groups) {
				var uniqGroups = _.pluck(groups, 'group');
				uniqGroups = _.uniq(uniqGroups);
				if (uniqGroups.length > 1) isAValidSplit = false;
			});

			if (!isAValidSplit) return;
			$variationGroupsWrap.insertAfter($buyFormFieldset);
			$variationGroupsWrap.html(plugin.renderVariationGroups(variationGroups, null, 0));

			$availability.hide();
			$buyFormFieldset.hide();

			$buyFormRadios.removeAttr('checked');
			$buyFormSubmit.attr('disabled', 'disabled');

			var $infoWrap = $('<p class="FormHelp VariationInfo"></p>'),
				$price = $('<strong></strong>'),
				$availability = $('<span></span>');

			$infoWrap.append($price);
			$infoWrap.append($availability);
			$infoWrap.insertAfter($variationGroupsWrap);
			$infoWrap.hide();

			$variationGroupsWrap.on('change', 'select', function(evt) {
				var $changedGroup = $(evt.target).closest('.VariationGroup'),
					maxGroupLevel = $changedGroup.data('level'),
					activeFilters = plugin.getActiveFilters(maxGroupLevel);

				var groupData = _.find(variationGroups, function(group) {
					var triggersMatch = !_.difference(group.triggers, activeFilters).length;
					var valueMatches = _.last(activeFilters) === group.value.replace(BREAKING_CHARS_REGEX, '');
					return triggersMatch && valueMatches;
				});

				if (groupData && groupData.last) {
					$infoWrap.fadeIn(250);
					$price.text(groupData.price);
					$availability.text(groupData.availability);

					var $groupEl = $(groupData.el);
					$groupEl.prop('checked', true);
					$buyFormSelect.val($groupEl.val());
					$buyFormSubmit.removeAttr('disabled');
				} else {
					$infoWrap.hide();
					$buyFormRadios.prop('checked', false);
					$buyFormSelect.val('');
					$buyFormSubmit.attr('disabled', 'disabled');
				}

				$variationGroupsWrap.append(plugin.renderVariationGroups(variationGroups, activeFilters, maxGroupLevel + 1));
				$variationGroupsWrap.find('.VariationGroup').last().hide().fadeIn(250);
			});
		}
	};

	$.fn[pluginName] = function(options) {
		return this.each(function() {
			if (!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options));
			}
		});
	}
});
