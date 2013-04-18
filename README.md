# MyCashflow default theme
This is MyCashflow's default theme that ships with MyCashflow eCommerce software. Use it as a base for your modifications or just experiment and go wild with it. It comes packed with javascript goodies that you'll find very useful even while making your own theme from scratch.

## Installing
Just upload the theme into it's own folder in your MyCashflow shop's files or upload the zip to the root folder of your files and click the uploaded file to unpack it.

## Modifying
You can modify theme as you wish but there are some things you should consider.

### Javascripts
Javascripts are loaded in the helpers/scripts.html file with {MinifyJS} tag which then combines, removes unnecessary whitespace and comments, and serves them with gzip encoding. If you wish to modify the files put the {MinifyJS} tag into development mode. Remember to put production mode back on once you're finished!

Some of the javascript in the theme has it's requirements and is coupled with other javascript in the theme. The main file mcf.main.js and mcf.checkout.js are the initiators of plugins and these are the files that bind it all together.

For now we don't use any script loaders in the theme, so you should know what you're doing when removing files or you will break your theme's javascripts altogether.

### Styles
Stylesheets are loaded in the helpers/scripts.html file with {MinifyCSS} tag which then combines, removes unnecessary whitespace and comments, and serves them with gzip encoding. If you wish to modify the files put the {MinifyCSS} tag into development mode. Remember to put production mode back on once you're finished!

The styles aren't as modular as we would like them to be. Maybe someday we'll have enough time to fix something that isn't actually broken and will write the styles so that you can just throw markup around and it magically works.

### Responsiveness
The theme comes with separate responsive stylesheet which makes the layout to adapt to different screen sizes. Beware that responsiveness comes with the cost that the layout is a bit tricker to modify if you start meddling with the structure.

If you're not comfortable with modifying the responsive styles, just remove the stylesheet from helpers/styles.html and rows 33-51 from helpers/scripts.html where we load some responsive javascript.

## License
License: MIT (http://www.opensource.org/licenses/mit-license.php)