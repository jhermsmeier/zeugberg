var Emitter = require( 'events' ).EventEmitter
var inherit = require( 'bloodline' )
var log = require( 'debug' )( 'ZEUGBERG:TEST' )

/**
 * Test
 * @return {Test}
 */
function Test( title, fn, suite ) {
  
  if( !(this instanceof Test) )
    return new Test( title, fn, suite )
  
  Emitter.call( this )
  
  this.title = title
  this.parent = suite
  this.fn = fn
  this.state = 'initial'
  
}

/**
 * Test prototype
 * @type {Object}
 */
Test.prototype = {
  
  constructor: Test,
  
  get isAsync() {
    return !!( this.fn && this.fn.length )
  },
  
  get isPending() {
    return typeof this.fn !== 'function'
  },
  
  run: function( callback ) {
    
    var self = this
    var done = callback.bind( this )
    
    if( this.isPending ) {
      return done()
    }
    
    if( this.isAsync ) {
      try { this.fn.call( this.parent, done ) }
      catch( e ) { done( e ) }
      return
    } else {
      try { this.fn.call( this.parent ) }
      catch( e ) { return done( e ) }
      return done()
    }
    
  },
  
  fail: function( error ) {
    this.state = 'failed'
    this.emit( 'error', error )
  },
  
}

inherit( Test, Emitter )
// Exports
module.exports = Test
