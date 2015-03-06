var Emitter = require( 'events' ).EventEmitter
var inherit = require( 'bloodline' )
var log = require( 'debug' )( 'ZEUGBERG:PAGE' )

/**
 * Page Constructor
 * @param {nw.gui.Window} chrome
 * @return {Page}
 */
function Page( chrome ) {
  
  if( !(this instanceof Page) )
    return new Page( chrome )
  
  // Inherit from EventEmitter
  Emitter.call( this )
  
  this.chrome = chrome
  this.chrome.on( 'attachEvents',
    this.attachEvents.bind( this )
  )
  
  this.chrome.on( 'loaded', this.updateGlobals.bind( this ) )
  
  this.checklist = [
    'loaded',
    // 'inspector:attached',
    // 'inspector:network',
  ]
  
}

/**
 * Globals to map over into the
 * global context before running a test
 * @type {Array}
 */
Page.globals = [
  'window',
  'document',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'clearTimeout',
  'clearInterval',
  'clearImmediate',
  'Date',
  'XMLHttpRequest',
]

/**
 * Page prototype
 * @type {Object}
 */
Page.prototype = {
  
  /**
   * Page Constructor
   * @type {Function}
   */
  constructor: Page,
  
  /**
   * [updateGlobals description]
   */
  updateGlobals: function() {
    
    log( 'UPDATE_GLOBALS' )
    
    var frame = this.chrome.frame
    
    // Map over the testing window's globals to node's context
    // to avoid tests accessing wrong contexts
    // (also, workaround for V8's auto context switching)
    Page.globals.forEach( function( varname ) {
      global[ varname ] = frame.eval( null, 'this.' + varname )
    })
    
    // DOM helpers
    // global.$ = context.$
    // global.$$ = context.$$
    global.$ = function $( selector, startNode ) {
      return ( startNode || global.document )
        .querySelector( selector )
    }
    
    global.$$ = function $$( selector, startNode ) {
      return ( startNode || global.document )
        .querySelectorAll( selector )
    }
    
    // Page control helper
    global.page = this
    
    if( this.checklist.length === 0 )
      this.emit( 'ready' )
    
  },
  
  /**
   * Attach events to window frame
   * @return {Undefined}
   */
  attachEvents: function() {
    
    var self = this
    var checklist = this.checklist
    
    function wait( event ) {
      return function check() {
        var index = checklist.indexOf( event )
        if( ~index )
          checklist.splice( index, 1 )
        if( checklist.length === 0 ) {
          log( 'READY' )
          self.emit( 'ready' )
        }
      }
    }
    
    for( var i in this.checklist ) {
      var event = this.checklist[i]
      this.chrome.once( event, wait( event ) )
    }
    
  },
  
  /**
   * Reload the page
   * @param  {Function} callback()
   * @return {Page}
   */
  reload: function( callback ) {
    
    if( typeof callback === 'function' )
      this.once( 'ready', callback )
    
    this.chrome.reload()
    return this
    
  },
  
  /**
   * Navigate to a given location
   * @param  {String}   path
   * @param  {Function} callback( error, location )
   * @return {Page}
   */
  navigate: function( path, callback ) {
    
    if( typeof callback === 'function' )
      this.once( 'ready', callback )
    
    // TODO:
    // - [ ] Pass HTTP status to 'ready' event
    //       (Needs Debugger Protocol support)
    
    this.chrome.location = path
    return this
    
  },
  
  resize: function( width, height, callback ) {
    
    var self = this
    var done = callback.bind( this )
    
    this.chrome.once( 'resized', done )
    this.chrome.frame.resizeTo( width, height )
    
    return this
    
  },
  
  /**
   * Capture the rendered page
   * @param  {Function} callback( error, buffer )
   * @return {Page}
   */
  capture: function( callback ) {
    
    var self = this
    var done = callback.bind( this )
    var options = { format: 'png', datatype: 'buffer' }
    
    window.requestAnimationFrame( function() {
      try {
        self.chrome.frame.capturePage( function( data ) {
          done( null, data )
        }, options )
      } catch( error ) {
        done( error )
      }
    })
    
    return this
    
  },
  
}

// Inherit from EventEmitter
inherit( Page, Emitter )
// Exports
module.exports = Page
