var yargs = require( 'yargs' )
var package = require( '../package' )
var log = require( 'debug' )( 'ZEUGBERG:MAIN' )
var gui = window.require( 'nw.gui' )
var Zeugberg = require( './zeugberg' )

// Patch nw.js' console.*() for nice output
require( './console' )()

// Brutally exit() on uncaught errors
process.on( 'uncaughtException', function( error ) {
  var msg = error.stack || error.message
  process.stderr.write( '\n' )
  process.stderr.write( msg )
  process.stderr.write( '\n\n' )
  process.exit( 1 )
})

process.on( 'SIGINT', function() {
  log( 'SIGINT' )
  global.zeugberg && global.zeugberg.abort( function() {
    // TODO: Stall 'til abort completed
  })
})

yargs
  .usage( 'Usage: zeugberg [options]' )
  .help( 'help' )
  .version( package.version )
  .option( 'pattern', {
    alias: 'p',
    demand: false,
    default: 'test/**/*.js',
    describe: 'Test glob pattern',
    type: 'string',
  })
  .option( 'reporter', {
    alias: 'r',
    demand: false,
    describe: 'Test reporters to use (can be specified multiple times)',
    default: 'tap',
    type: 'array',
    nargs: 1,
  })
  .option( 'proxy', {
    describe: 'Set the proxy configuration',
    type: 'string',
    nargs: 1,
  })
  .option( 'debug', {
    default: false,
    describe: 'Enable debugging output',
    type: 'boolean',
  })
  .alias({
    help: 'h',
    version: 'v',
  })

// TODO(?):
// process.on( 'SIGTERM', function() {})
// process.on( 'SIGHUP', function() {})
// process.on( 'exit', function( code, signal ) {})

// Change cwd to first argv supplied
// (necessary, because nw handles arguments differently)
process.chdir( gui.App.argv.shift() )
// Parse CLI arguments / options
global.argv = yargs.parse( gui.App.argv )

// Configure Chromium's proxy API to use our local proxy for recording & reply
// @see https://github.com/nwjs/nw.js/wiki/App#setproxyconfigconfig
if( argv.proxy )
  log( 'PROXY', argv.proxy )
gui.App.setProxyConfig( argv.proxy )

// Keep a reference to the main Window
global.main = gui.Window.get()

// Only init main window devtools in debug mode,
// to avoid unnecessary overhead
if( global.argv.debug ) {
  global.devTools = main.showDevTools()
  global.devTools.show()
}

// Init Zeugberg
global.zeugberg = new Zeugberg( global.argv )

// Load test specs, and start running,
// once the main window has fully initialized
global.main.once( 'loaded', function() {
  log( 'LOADED' )
  log( 'START', process.cwd() )
  zeugberg.load( argv.pattern, function( error ) {
    // We want to fail hard if the test specs couldn't be loaded
    if( error ) throw error
    // Otherwise, run the specs
    zeugberg.run( function( failures ) {
      log( 'DONE', 'with ' + ( failures || 0 ) + ' failures' )
      // Don't exit when in DEBUG, to enable inspection
      if( !argv.debug ) {
        process.exit( failures || 0 )
      }
    })
  })
})
