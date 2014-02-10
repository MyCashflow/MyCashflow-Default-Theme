/*!
 * File: mcf.nosto.js
 * Part of MyCashFlow's default theme.
 * Translates Nosto recommendations into product lists.
 * Please don't edit this file unless necessary!
 */

/*jshint browser: true, jquery: true, laxbreak: true, curly: false, expr: true */
/*global mcf:false */

$(function() {
  // Look for recommendations, cancel if none.
  var $nostoElems = $('.nosto_element');
  if (!$nostoElems.length) {
    return;
  }
  
  function replaceNosto($elem) {
    // Get the product IDs.
    var ids = [];
    $elem.children().each(function() {
      ids.push($(this).attr('data-nosto-id'));
    });
    // No IDs? Cancel.
    if (!ids) {
      return false;
    }
    // Replace with /interface/.
    ids = ids.join('|');
    var params = $elem.attr('data-nosto-params');
    $.get('/interface/Products?id=' + ids + (params ? '&' + params : ''), function(res) {
      $elem.html(res);
    });
  }
  
  var checkTimer = setInterval(function() {
    // Nothing to load, cancel.
    if (!$nostoElems.length) {
      clearInterval(checkTimer); 
    }
    // Check each element's state.
    $nostoElems.each(function() {
      var $elem = $(this);
      // Loaded? Replace with real products.
      if (!!$elem.children().length) {
        replaceNosto($elem);
        $nostoElems = $nostoElems.not($elem);
      }
    });
  }, 250);
  
  // Just-in-case cancel.
  setTimeout(function() {
    clearInterval(checkTimer);
  }, 10000);
});
