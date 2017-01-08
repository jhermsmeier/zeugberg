var package = require( '../package' )
var path = require( 'path' )
var Zeugberg = require( './zeugberg' )
var app = require( 'app' )
var BrowserWindow = require( 'browser-window' )

// Global reference to the main window
// NOTE: Using a global because of GC behavior
main = null

app.on( 'window-all-closed', function() {
  app.quit()
})

app.on( 'ready', function() {
  
  main = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    resizable: true,
    title: package.name,
    'enable-larger-than-screen': true,
  })
  
  main.on( 'closed', function() {
    main = null
  })
  
  main.loadUrl( 'about:blank' )
  
  // TODO: Use argv as Zeugberg options
  var specs = path.join( process.cwd(), 'test/**/*.js' )
  var zeugberg = new Zeugberg()
  
  zeugberg.load( specs, function( error ) {
    // We want to fail hard if the test specs couldn't be loaded
    if( error ) throw error
    // Otherwise, run the specs
    zeugberg.run( function( failures ) {
      log( 'DONE', 'with ' + ( failures || 0 ) + ' failures' )
      process.exit( failures || 0 )
    })
  })
  
})
