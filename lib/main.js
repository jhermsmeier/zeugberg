var yargs = require( 'yargs' )
var package = require( '../package' )
var log = require( 'debug' )( 'ZEUGBERG:MAIN' )
var gui = window.require( 'nw.gui' )
var Zeugberg = require( './zeugberg' )

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
  .option( 'debug', {
    default: false,
    describe: 'Enable debugging output',
    type: 'boolean',
  })
  .alias({
    help: 'h',
    version: 'v',
  })

// process.on( 'SIGTERM', function() {})
// process.on( 'SIGHUP', function() {})
// process.on( 'exit', function( code, signal ) {})

void function() {
  
  // Patch nw.js' console.*() for nice output
  require( './console' )
  
  // Change cwd to first argv supplied
  // (necessary, because nw handles arguments differently)
  process.chdir( gui.App.argv.shift() )
  
  global.argv = yargs.parse( gui.App.argv )
  
  global.main = gui.Window.get()
  global.devTools = main.showDevTools()
  global.devTools.show( global.argv.debug )
  global.zeugberg = new Zeugberg( global.argv )
  
  global.main.once( 'loaded', function() {
    log( 'LOADED' )
    log( 'START', process.cwd() )
    zeugberg.load( argv.pattern, function( error ) {
      zeugberg.run( function( failures ) {
        log( 'DONE', 'with ' + ( failures || 0 ) + ' failures' )
        process.exit( failures || 0 )
      })
    })
  })
  
}()
