$(function() {

	$("#ProductImages").mcfImageSwapper();
	
	// Clone the thumbnails so they can be used as colorbox group and open preview from actual thumbnails
	$("#ProductThumbnails").clone().hide().attr("id","fakethumbs").appendTo(document.body);
	
	// Make colorbox group or just open the image
	if ($("#fakethumbs").length) {
		$("#fakethumbs li a").colorbox({
			rel: "fake",
			current: "{current} / {total}",
			opacity: 0.8
		});
		// Trigger click on right thumbnail
		$("#CurrentProductImage").click(function(event) {
			var eq = $(this).data("eq") || 0;
			$("#fakethumbs li:eq(" + eq + ") a").trigger("click");
			event.preventDefault();
		});
	} else {
		$("#CurrentProductImage").colorbox({
			current: "{current} / {total}",
			opacity: 0.8
		});
	}

});