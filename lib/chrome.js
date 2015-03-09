var Emitter = require( 'events' ).EventEmitter
var inherit = require( 'bloodline' )
var Inspector = require( 'inspector' )
var URL = require( 'url' )
var path = require( 'path' )
var log = require( 'debug' )( 'ZEUGBERG:CHROME' )
var async = require( 'async' )

/**
 * Chrome/Window Frame
 * @return {Chrome}
 */
function Chrome( options ) {
  
  if( !(this instanceof Chrome) )
    return new Chrome( options )
  
  Emitter.call( this )
  
  this.frame = null
  this.devTools = null
  this.inspector = null
  
  this._isResizing = null
  
}

Chrome.setTimeout = global.setTimeout.bind( global )
Chrome.clearTimeout = global.clearTimeout.bind( global )

/**
 * Options for Window.open()
 * @type {Object}
 */
Chrome.options = {
  frame: false,
  toolbar: false,
  width: 1024,
  height: 768,
}

/**
 * Chrome prototype
 * @type {Object}
 */
Chrome.prototype = {
  
  constructor: Chrome,
  
  attachEvents: function() {
    
    this.frame.on( 'loading', this.onLoading.bind( this ) )
    this.frame.on( 'loaded', this.onLoaded.bind( this ) )
    this.frame.on( 'document-start', this.onDocumentStart.bind( this ) )
    this.frame.on( 'document-end', this.onDocumentEnd.bind( this ) )
    this.frame.on( 'devtools-opened', this.onDevToolsOpened.bind( this ) )
    this.frame.on( 'devtools-closed', this.onDevToolsClosed.bind( this ) )
    this.frame.on( 'resize', this.onResize.bind( this ) )
    this.frame.on( 'capturepagedone', this.onCapturePage.bind( this ) )
    this.frame.on( 'new-win-policy', this.onNewWinPolicy.bind( this ) )
    this.frame.on( 'close', this.onClose.bind( this ) )
    this.frame.on( 'closed', this.onClosed.bind( this ) )
    
    return this
    
  },
  
  attachWindowEvents: function() {
    with( this.frame.window ) {
      addEventListener( 'DOMContentLoaded', this.onDOMContentLoaded.bind( this ) )
      addEventListener( 'load', this.onLoad.bind( this ) )
    }
  },
  
  attachDebugger: function() {
    
    if( this.devTools != null )
      return this
    
    this.devTools = this.frame.showDevTools()
    this.devTools.show( global.argv.debug )
    
    return this
    
  },
  
  attachInspector: function( location, filename ) {
    
    var self = this
    var remotePort = 9222
    
    var inspector = this.inspector = new Inspector(
      remotePort, location.hostname, filename,
      function() {
        log( 'INSPECTOR:ATTACHED' )
        self.emit( 'inspector:attached' )
        async.parallel([
          function( done ) { inspector.Network.enable( done ) },
          function( done ) { inspector.Page.enable( done ) },
          function( done ) { inspector.Profiler.enable( done ) },
        ], function( error, results ) {
          if( error != null ) {
            self.emit( 'error', error )
            return
          }
          log( 'INSPECTOR:ENABLED' )
          self.emit( 'inspector:enabled' )
        })
      }
    )
    
    this.inspector.on( 'error', function( error ) {
      log( 'INSPECTOR:ERROR', error )
      self.emit( 'error', error )
    })
    
    // Listen for network events, and pick the first
    // document type response after 'loading' event,
    // as it's the page's navigation response
    this.once( 'inspector:enabled', function() {
      this.inspector.Network.on( 'responseReceived', function( event ) {
        if( self.loading && event.type === 'Document' ) {
          self.emit( 'response', event.response )
        }
      })
    })
    
    // TODO:
    // - [ ] set up HAR recording
    // - [ ] set up JS/CPU profiling
    
  },
  
  get location() {
    if( this.frame != null )
      return this.frame.window.location.href
  },
  
  set location( value ) {
    if( this.frame != null )
      this.frame.window.location.href = value
    // TODO:
    // - [ ] Handle relative paths
  },
  
  onLoading: function() {
    this.loading = true
    log( 'LOADING' )
  },
  
  onDOMContentLoaded: function() {
    log( 'DOMCONTENTLOADED' )
  },
  
  onLoad: function() {
    log( 'LOAD' )
  },
  
  onLoaded: function() {
    this.loading = false
    log( 'LOADED' )
    this.emit( 'loaded' )
  },
  
  onDocumentStart: function() {
    log( 'DOCUMENT:START' )
    this.attachDebugger()
    this.attachWindowEvents()
    this.emit( 'attachEvents' )
  },
  
  onDocumentEnd: function() {
    log( 'DOCUMENT:END' )
  },
  
  onDevToolsOpened: function( url ) {
    
    log( 'DEVTOOLS:OPENED', url )
    
    var self = this
    var location = URL.parse( url, true )
    var dirname = path.join( __dirname, '..' )
    var filename = 'file://' + dirname + '/about:blank'
    
    this.attachInspector( location, filename )
    
  },
  
  onDevToolsClosed: function() {
    log( 'DEVTOOLS:CLOSED' )
    // Remove the ref to the closed window
    this.devTools = null
    // TODO:
    // - [ ] shutdown the inspector
  },
  
  onResize: function( width, height ) {
    log( 'RESIZE', width, height )
    var self = this
    Chrome.clearTimeout( this._isResizing )
    this._isResizing = Chrome.setTimeout( function() {
      process.nextTick( function() {
        window.requestAnimationFrame( function() {
          log( 'RESIZED' )
          self.emit( 'resized' )
        })
      })
    }, 100 )
  },
  
  onCapturePage: function() {
    log( 'CAPTURE_PAGE' )
  },
  
  // Emitted when a new window is requested from this window
  // or a child iframe, e.g. user clicks a link with _blank target.
  onNewWinPolicy: function( frame, url, policy ) {
    log( 'NEW_WIN_POLICY', url )
    // Force the new (popup) window
    // to open in the current window
    // See nw.js wiki for details
    policy.forceCurrent()
    // NOTE: .forceCurrent() would prematurely terminate a test
    // if the opened frame calls window.close() on itself
    // TODO:
    // - [ ] Handle popups properly
  },
  
  onClose: function() {
    log( 'CLOSE' )
    // Don't leave any unattached
    // DevTools windows behind
    if( this.devTools != null )
      this.devTools.close( true )
    // Enforce close
    // (without 'true' it will loop endlessly,
    // calling 'onClose' over and over)
    this.close( true )
  },
  
  onClosed: function() {
    log( 'CLOSED' )
  },
  
  open: function( path ) {
    
    if( this.frame != null )
      return this
    
    var GUI = window.require( 'nw.gui' )
    var location = path || 'about:blank'
    
    this.frame = GUI.Window.open( location, Chrome.options )
    this.frame.show( global.argv.debug )
    this.attachEvents()
    
    return this
    
  },
  
  close: function( force ) {
    
    if( this.frame == null )
      return this
    
    this.frame.close( force )
    this.frame = null
    
    return this
    
  },
  
}

inherit( Chrome, Emitter )
// Exports
module.exports = Chrome
