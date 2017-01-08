var fs = require( 'fs' )
var path = require( 'path' )
var HAR = require( 'http-archive' )

/**
 * HARR
 * @return {HARR}
 */
function HARR( zeugberg, options ) {
  
  if( !(this instanceof HARR) )
    return new HARR( zeugberg, options )
  
  this.runner = zeugberg
  
  this.archive = null
  // Current loader ID (e.g. '33942.6')
  // to identify the current page
  // (TODO: ID by origin)
  this.currentLoader = null
  this.currentPage = null
  
  this.suite = null
  
  this.attachInspector = this.attachInspector.bind( this )
  this.recordRequest = this.recordRequest.bind( this )
  this.recordResponse = this.recordResponse.bind( this )
  this.domContentLoaded = this.domContentLoaded.bind( this )
  this.onLoad = this.onLoad.bind( this )
  
  this.attachEvents()
  
}

/**
 * HARR prototype
 * @type {Object}
 */
HARR.prototype = {
  
  constructor: HARR,
  
  attachEvents: function() {
    console.log( 'EVENTS:ATTACH' )
    var self = this
    this.runner.page.once( 'ready', this.attachInspector )
    this.runner.on( 'suite', function( suite ) {
      if( suite.parent && suite.parent.isRoot ) {
        self.suite = suite
        self.initArchive()
      }
    })
    this.runner.on( 'suite:end', function( suite ) {
      if( suite.parent && suite.parent.isRoot ) {
        self.saveArchive( suite )
      }
    })
  },
  
  attachInspector: function() {
    
    console.log( 'INSPECTOR:ATTACH' )
    
    var inspector = this.runner.chrome.inspector
    
    inspector.Network.setCacheDisabled( true, Function.prototype )
    
    inspector.Network.on( 'requestWillBeSent', this.recordRequest )
    inspector.Network.on( 'responseReceived', this.recordResponse )
    inspector.Page.on( 'domContentEventFired', this.domContentLoaded )
    inspector.Page.on( 'loadEventFired', this.onLoad )
    
  },
  
  recordRequest: function( event ) {
    
    var isDataURL = event.request.url.indexOf( 'data:' ) === 0
    var isCurrentLoader = event.loaderId === this.currentLoader
    
    if( !isCurrentLoader ) {
      this.addPage( event )
    }
    
    var entry = new HAR.Log.Entry( this.currentPage )
    
    entry.request.comment = event.requestId
    entry.request.method = event.request.method
    entry.request.url = event.request.url
    
    entry.request.headersSize = 0
    Object.keys( event.request.headers )
      .forEach( function( field ) {
        entry.request.headersSize += field.length + 2
        entry.request.headersSize += event.request.headers[ field ].length + 2
        entry.request.addHeader(
          field, event.request.headers[ field ]
        )
      })
    
    if( !isDataURL && isCurrentLoader )
      this.archive.log.entries.push( entry )
    else return console.log( 'IGNORING DATA URL' )
    
    console.log( 'REQUEST', event.request.method, event.request.url )
    console.log( 'REQUEST:ID', event.requestId )
    console.log( 'REQUEST:FRAME_ID', event.frameId )
    console.log( 'REQUEST:LOADER_ID', event.loaderId )
    console.log( 'REQUEST:TYPE', event.type )
    console.log( 'REQUEST:DOCUMENT', event.documentURL )
    
  },
  
  recordResponse: function( event ) {
    
    var entry = this.archive.getEntry( event.loaderId, event.response.url )
    if( entry ) {
      
      entry.response.status = event.response.status
      entry.response.statusText = event.response.statusText
      entry.response.content.mimeType = event.response.mimeType
      entry.response.httpVersion = event.response.protocol
      entry.serverIPAddress = event.response.remoteIPAddress
      
      entry.timings.blocked = ( event.response.timing.sendStart )|0 || 0
      entry.timings.dns = (( event.response.timing.dnsEnd - event.response.timing.dnsStart ))|0 || 0
      entry.timings.connect = (( event.response.timing.connectEnd - event.response.timing.connectStart ))|0 || 0
      entry.timings.send = (( event.response.timing.sendEnd - event.response.timing.sendStart ))|0 || 0
      entry.timings.wait = (( event.response.timing.responseStart - event.response.timing.requestStart ))|0 || 0
      entry.timings.ssl = ( event.response.timing.sslEnd - event.response.timing.sslStart )|0 || 0
      // entry.timings.receive = 
      
      entry.time = entry.timings.blocked +
        entry.timings.dns +
        entry.timings.connect +
        entry.timings.send +
        entry.timings.wait +
        entry.timings.ssl
      
      entry.response.headersSize = 0
      Object.keys( event.response.headers )
        .forEach( function( field ) {
          entry.response.headersSize += field.length + 2
          entry.response.headersSize += event.response.headers[ field ].length + 2
          entry.response.addHeader(
            field, event.response.headers[ field ]
          )
        })
      
    }
    
    console.log( 'RESPONSE:ID', event.requestId )
    console.log( 'RESPONSE:FRAME_ID', event.frameId )
    console.log( 'RESPONSE:LOADER_ID', event.loaderId )
    console.log( 'RESPONSE:TYPE', event.type )
    if( event.response.status )
      console.log( 'RESPONSE:DOCUMENT', event.response.status, event.response.statusText, event.response.url )
    
  },
  
  domContentLoaded: function( event ) {
    console.log( 'DOMCONTENTLOADED', event.timestamp )
    var diff = ( event.timestamp * 1e3 ) - new Date( this.currentPage.startedDateTime ).getTime()
    this.currentPage.pageTimings.onContentLoad = diff
  },
  
  onLoad: function( event ) {
    console.log( 'STARTED', new Date( this.currentPage.startedDateTime ).getTime() )
    console.log( 'ONLOAD', event.timestamp )
    var diff = ( event.timestamp * 1e3 ) - new Date( this.currentPage.startedDateTime ).getTime()
    this.currentPage.pageTimings.onLoad = diff
  },
  
  addPage: function( event ) {
    this.currentLoader = event.loaderId
    this.currentPage = new HAR.Log.Page(
      event.loaderId, event.request.url
    )
    this.archive.log.pages.push( this.currentPage )
  },
  
  initArchive: function() {
    this.archive = new HAR()
  },
  
  saveArchive: function( suite ) {
    var filename = suite.title + '.har'
    var filepath = path.join( __dirname, '../test/archives', filename )
    console.log( 'SAVE', filename )
    fs.writeFileSync( filepath, this.archive.toString() )
    this.archive = null
  },
  
}

// Exports
module.exports = HARR
