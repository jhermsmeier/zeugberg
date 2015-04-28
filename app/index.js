var package = require( '../package' )
var path = require( 'path' )
var Zeugberg = require( '../lib/zeugberg' )
var app = require( 'app' )
var BrowserWindow = require( 'browser-window' )

var mainWindow = null

app.on( 'window-all-closed', function() {
  app.quit()
})

app.on( 'ready', function() {
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    center: true,
    resizable: true,
    title: package.name,
    'enable-larger-than-screen': true,
  })
  
  mainWindow.on( 'closed', function() {
    mainWindow = null
  })
  
  mainWindow.loadUrl( 'about:blank' )
  
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
