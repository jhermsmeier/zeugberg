/**
 * TAPR
 * @return {TAPR}
 */
function TAPR( runner, options ) {
  
  if( !(this instanceof TAPR) )
    return new TAPR( runner, options )
  
  this.runner = runner
  this.total = 0
  this.count = 0
  this.fails = []
  this.attachEvents()
  
}

/**
 * TAPR prototype
 * @type {Object}
 */
TAPR.prototype = {
  
  constructor: TAPR,
  
  attachEvents: function() {
    
    var onError = this.onError.bind( this )
    
    this.runner.on( 'error', onError )
    this.runner.on( 'uncaughtException', onError )
    
    this.runner.on( 'start', this.preamble.bind( this ) )
    this.runner.on( 'suite', this.onSuite.bind( this ) )
    this.runner.on( 'test', this.onTest.bind( this ) )
    this.runner.on( 'test:pending', this.onTestPending.bind( this ) )
    this.runner.on( 'test:error', this.onTestError.bind( this ) )
    this.runner.on( 'test:pass', this.onTestPass.bind( this ) )
    this.runner.on( 'end', this.onEnd.bind( this ) )
    
  },
  
  preamble: function() {
    this.total = this.runner.suite.count()
    console.log( ( this.count + 1 ) + '..' + this.total )
  },
  
  onError: function( error ) {
    var msg = error && error.message ?
      ' ' + error.message : ''
    console.log( 'Bail out!' + msg )
  },
  
  onSuite: function( suite ) {
    if( suite.title ) {
      console.log( '# Suite: ' + suite.title )
    }
  },
  
  onTest: function( test ) {
    this.count++
  },
  
  onTestPending: function( test ) {
    console.log( 'ok ' + this.count + ' - ' + test.title + ' # SKIPPED' )
  },
  
  onTestError: function( test, error ) {
    this.fails.push( this.count )
    console.log( 'not ok ' + this.count + ' - ' + test.title )
    if( error && error.stack ) {
      var stack = error.stack.split( /\r?\n/g )
        .map( function( line ) {
          return '# ' + line
        })
        .join( '\n' )
      console.log( stack )
    } else if( error && error.message ) {
      console.log( '# Error: ' + error.message )
    }
  },
  
  onTestPass: function( test ) {
    console.log( 'ok ' + this.count + ' - ' + test.title )
  },
  
  onEnd: function( failures ) {
    var percentage = failures !== 0 ?
      ( 100 - (( failures / this.total ) * 100 )).toFixed( 2 ) :
      ( 100 ).toFixed( 2 )
    if( failures )
      console.log( 'FAILED tests: ' + this.fails.join( ', ' ) )
    console.log( 'Failed ' + failures + '/' + this.total + ' tests, ' + percentage + '% okay' )
  },
  
}

// Exports
module.exports = TAPR
