/*!
 * File: mcf.nostoSupport.js
 * Part of MyCashFlow's default theme.
 * This file is only to support Nosto implementation in MyCashflow
 * when either jQuery or Nosto MyCashflow plugin is missing from theme.
 *
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */
/*global mcf:false */

(function() {

	function contentLoaded(win, fn) {
		/*!
		 * contentloaded.js
		 *
		 * Author: Diego Perini (diego.perini at gmail.com)
		 * Summary: cross-browser wrapper for DOMContentLoaded
		 * Updated: 20101020
		 * License: MIT
		 * Version: 1.2
		 *
		 * URL:
		 * http://javascript.nwbox.com/ContentLoaded/
		 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
		 *
		 */

		// @win window reference
		// @fn function reference

		var done = false, top = true,

		doc = win.document,
		root = doc.documentElement,
		modern = doc.addEventListener,

		add = modern ? 'addEventListener' : 'attachEvent',
		rem = modern ? 'removeEventListener' : 'detachEvent',
		pre = modern ? '' : 'on',

		init = function(e) {
			if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
			(e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
			if (!done && (done = true)) fn.call(win, e.type || e);
		},

		poll = function() {
			try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
			init('poll');
		};

		if (doc.readyState == 'complete') fn.call(win, 'lazy');
		else {
			if (!modern && root.doScroll) {
				try { top = !win.frameElement; } catch(e) { }
				if (top) poll();
			}
			doc[add](pre + 'DOMContentLoaded', init, false);
			doc[add](pre + 'readystatechange', init, false);
			win[add](pre + 'load', init, false);
		}

	}

	function getNostoScripts() {
		// Get it only if it's not there
		if (typeof $.fn.mcfNosto === 'undefined') {
			$.getScript("/templates/js/mcf.nosto.js", function() {
				// Check that the plugin was loaded and is usable
				if (typeof $.fn.mcfNosto !== 'undefined') {
					$('.nosto_element').mcfNosto({
						error: function(msg) {
							if (typeof console === 'object') { console.warn(msg); }
						}
					});
				}
			});
		}
	}

	function getJQuery() {
		if (typeof(jQuery) === 'undefined') {
			var fallbackJQuery = document.createElement('script');
			fallbackJQuery.src = '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js';
			fallbackJQuery.async = false;
			fallbackJQuery.onload = fallbackJQuery.onreadystatechange = function() {
				if (typeof jQuery === 'undefined') {
					// Polling for IE7. Ugh.
					var timer = null;
					var timeout = setTimeout(function () {
						clearInterval(timer);
					}, 10000);
					timer = setInterval(function () {
						if (typeof jQuery === 'function') {
							clearTimeout(timeout);
							clearInterval(timer);
							getNostoScripts();
						}
					}, 250);
				} else {
					getNostoScripts();
				}
			};
			document.getElementsByTagName('head')[0].appendChild(fallbackJQuery);
		} else {
			getNostoScripts();
		}
	}

	contentLoaded(window, getJQuery);

}());
