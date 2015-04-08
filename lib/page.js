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
  
  this.status = 0
  this.statusText = ''
  this.response = null
  
  this.chrome = chrome
  this.chrome.on( 'attachEvents',
    this.attachEvents.bind( this )
  )
  
  this.chrome.on( 'frameLoaded', this.updateGlobals.bind( this ) )
  this.on( 'ready', this.onReady )
  
  this.checklist = [
    'loaded',
    'inspector:attached',
    'inspector:enabled',
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
  
  onReady: function() {
    log( 'READY' )
  },
  
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
    
    // Patch nw.js' console.*() for nice output
    // NOTE: Has to be done on every context patch,
    // to keep window.console up to date...
    require( './console' )()
    
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
          self.updateGlobals()
          self.emit( 'ready' )
        }
      }
    }
    
    for( var i in this.checklist ) {
      var event = this.checklist[i]
      this.chrome.once( event, wait( event ) )
    }
    
    // Listen for the first document response after loading
    // and set the page's status & response
    this.chrome.on( 'response', function( response ) {
      if( response.status >= 400 )
        log( 'CHROME:RESPONSE', response )
      self.status = response.status
      self.statusText = response.statusText
      self.response = response
    })
    
  },
  
  /**
   * Reload the page
   * @param  {Function} callback()
   * @return {Page}
   */
  reload: function( callback ) {
    
    var self = this
    var done = callback.bind( this )
    
    this.chrome.inspector.Page.reload( true, function( error ) {
      if( error != null ) return done( error )
      self.once( 'ready', done )
    })
    
    return this
    
  },
  
  /**
   * Navigate to a given location
   * @param  {String}   path
   * @param  {Function} callback( error, location )
   * @return {Page}
   */
  navigate: function( path, callback ) {
    
    var self = this
    var done = callback.bind( this )
    var Page = this.chrome.inspector.Page
    var Network = this.chrome.inspector.Network
    
    function fail( event ) {
      self.removeListener( 'ready', success )
      done( new Error( event && event.errorText ) )
    }
    
    function success() {
      Network.removeListener( 'loadingFailed', fail )
      done()
    }
    
    this.status = 0
    this.statusText = ''
    this.response = null
    
    Page.navigate( path, function( error ) {
      if( error != null ) return done( error )
      Network.on( 'loadingFailed', fail )
      self.once( 'ready', success )
    })
    
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
  capture: function( width, callback ) {
    
    var self = this
    
    if( typeof width === 'function' ) {
      callback = width
      width = 1440
    }
    
    var done = callback.bind( this )
    var options = { format: 'png', datatype: 'buffer' }
    
    // Save current dimensions,
    // to restore them afterwards
    var prevWidth = this.chrome.frame.width
    var prevHeight = this.chrome.frame.height
    
    // TODO: Determine end of painting through the inspector
    // For now, nextTick(), just to be sure...
    window.requestAnimationFrame( function() {
      // Wait for an animationFrame to make sure
      // the renderer has painted at least once
      process.nextTick( function() {
        // Determine the full body height
        var height = document.body.scrollHeight
        // And resize to it, to capture the full page,
        // not just the viewport
        self.resize( width, height, function() {
          try {
            // Capture the page content
            self.chrome.frame.capturePage( function( buffer ) {
              // Restore previous dimensions
              self.resize( prevWidth, prevHeight, function() {
                done( null, buffer )
              })
            }, options )
          } catch( error ) {
            done( error )
          }
        })
      })
    })
    
    return this
    
  },
  
}

// Inherit from EventEmitter
inherit( Page, Emitter )
// Exports
module.exports = Page
