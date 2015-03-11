var util = require( 'util' )
var tty = require( 'tty' )

module.exports = function pathConsole( console ) {
  
  var console = console || global.console

  // Check if both stdio streams are associated with a TTY
  var isTTY = tty.isatty( 1 ) && tty.isatty( 2 )
  var options = {
    depth: null,
    colors: isTTY,
  }
  // Verbose inspection
  var inspect = function inspect( value ) {
    return util.inspect( value, options )
  }

  function msg( argv ) {
    return [].slice.call( argv )
      .map( inspect ).join( ' ' )
  }

  function out( msg ) {
    process.stdout.write( msg )
    process.stdout.write( '\n' )
  }

  function err( msg ) {
    process.stderr.write( msg )
    process.stderr.write( '\n' )
  }

  console.log = function log() {
    var argv = [].slice.call( arguments )
    if( argv.length === 1 && typeof argv[0] === 'string' ) {
      out( argv[0] )
      return
    }
    out( msg( arguments ) )
  }

  console.info =
  console.debug =
  console.warn =
  console.error = function error() {
    err( msg( arguments ) )
  }

  console.trace = function trace() {
    
    var argv = [].slice.call( arguments )
    var error = argv.shift()
    
    err( '' )
    
    error && error.stack ?
      void err( error.stack ) :
      void err( msg( error ) )
    
    if( argv.length ) {
      err( '' )
      err( msg( argv ) )
    }
    
  }
  
}
