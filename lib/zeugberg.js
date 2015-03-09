var Emitter = require( 'events' ).EventEmitter
var inherit = require( 'bloodline' )
var globStream = require( 'glob-stream' )
var path = require( 'path' )
var log = require( 'debug' )( 'ZEUGBERG' )

/**
 * Zeugberg Constructor
 * @return {Zeugberg}
 */
function Zeugberg( options ) {
  
  if( !(this instanceof Zeugberg) )
    return new Zeugberg( options )
  
  Emitter.call( this )
  
  this.files = []
  this.suite = new Zeugberg.Suite()
  this.chrome = new Zeugberg.Chrome()
  this.page = new Zeugberg.Page( this.chrome )
  
  this.shouldAbort = false
  this.currentSuite = null
  this.currentTest = null
  
  this.failures = 0
  
  log( 'NEW' )
  
}

Zeugberg.Page = require( './page' )
Zeugberg.Chrome = require( './chrome' )
Zeugberg.Suite = require( './suite' )
Zeugberg.Test = require( './test' )

/**
 * Zeugberg prototype
 * @type {Object}
 */
Zeugberg.prototype = {
  
  constructor: Zeugberg,
  
  load: function( patterns, callback ) {
    
    log( 'LOAD' )
    
    var self = this
    var done = callback.bind( this )
    var gs = globStream.create( patterns, {
      cwd: process.cwd(),
      cwdbase: false,
    })
    
    gs.on( 'error', function( error ) {
      log( 'LOAD:ERROR', error )
      done( error )
    })
    
    gs.on( 'end', function() {
      log( 'LOAD:END' )
      done()
    })
    
    gs.on( 'readable', function() {
      var file = null
      while( file = this.read() ) {
        self.files.push( file )
        log( 'LOAD:FILE', path.relative( process.cwd(), file.path ) )
        self.suite.updateContext()
        require( file.path )
      }
    })
    
    return this
    
  },
  
  run: function( callback ) {
    
    log( 'RUN' )
    
    var self = this
    var done = typeof callback === 'function' ?
      callback.bind( this ) : Function.prototype
    
    this.page.once( 'ready', function() {
      log( 'READY' )
      self.runSuite( self.suite, function( error ) {
        done( self.failures )
      })
    })
    
    this.chrome.open()
    
    return this
    
  },
  
  runSuite: function( suite, callback ) {
    
    log( 'RUN:SUITE', suite.isRoot ? 'root' : suite.title )
    
    var self = this
    var done = callback.bind( this )
    var suites = suite.suites.slice()
    
    // Check if the suite contains tests
    if( !suite.count() )
      return done()
    
    this.currentSuite = suite
    this.emit( 'suite', suite )
    
    function next( error, failedSuite ) {
      if( self.shouldAbort ) {
        self.emit( 'aborted' )
        return finish()
      }
      if( error != null ) {
        log( 'RUN:SUITE:FAILED', failedSuite && failedSuite.title || error )
        return failedSuite !== suite ?
          void finish( error, failedSuite ) :
          void finish()
      }
      var nextSuite = suites.shift()
      if( nextSuite == null ) return finish()
      self.runSuite( nextSuite, next )
    }
    
    function finish( error, failedSuite ) {
      log( 'RUN:SUITE:END', suite.isRoot ? 'root' : suite.title )
      self.currentSuite = suite
      // TODO: Run 'teardown' hooks
      self.runHook( 'teardown', function() {
        self.emit( 'suite:end', suite )
        done( error, failedSuite )
      })
    }
    
    this.runHook( 'setup', function( error ) {
      if( error != null ) return finish()
      this.runTests( suite, next )
    })
    
    return this
    
  },
  
  runTests: function( suite, callback ) {
    
    log( 'RUN:TESTS', suite.isRoot ? 'root' : suite.title )
    
    var self = this
    var done = callback.bind( this )
    var tests = suite.tests.slice()
    
    function next( error, failedSuite ) {
      if( self.shouldAbort ) {
        self.emit( 'aborted' )
        return done()
      }
      var test = self.currentTest = tests.shift()
      if( test == null ) return done()
      self.emit( 'test', test )
      if( test.isPending ) {
        log( 'TEST:PENDING', test.title )
        self.emit( 'test:pending', test )
        self.emit( 'test:end', test )
        return next()
      }
      self.runHookDown( 'beforeEach', function( error, failedSuite ) {
        log( 'TEST:RUN', test.title )
        if( error != null ) {
          log( 'TEST:ERROR', error.message || error )
          self.emit( 'test:error', test, error )
          return next( error, failedSuite || self.currentSuite )
        }
        test.run( function( error ) {
          if( error != null ) {
            log( 'TEST:ERROR', error.message || error )
            self.failures++
            self.emit( 'test:error', test, error )
          } else {
            self.emit( 'test:pass', test )
          }
          log( 'TEST:END', test.title )
          self.runHookUp( 'afterEach', function( error, failedSuite ) {
            self.emit( 'test:end', test, error )
            next( error, failedSuite || self.currentSuite )
          })
        })
      })
    }
    
    next()
    
    return this
    
  },
  
  runHook: function( name, callback ) {
    
    var self = this
    var done = callback.bind( this )
    var suite = self.currentSuite
    var hooks = suite.hooks[ name ].slice()
    var fn = null
    
    log( 'HOOK:RUN', name )
    
    function next( error ) {
      if( error != null ) {
        log( 'HOOK:ERROR', error )
        self.emit( 'hook:error', error, fn )
        return done( error )
      }
      log( 'HOOK:NEXT' )
      self.emit( 'hook', fn )
      fn = hooks.shift()
      if( fn == null ) {
        log( 'HOOK:END', name )
        self.emit( 'hook:end' )
        return done()
      }
      if( fn.length > 0 ) {
        try { fn.call( suite, next ) }
        catch( e ) { return next( e ) }
        return
      } else {
        try { fn.call( suite, next ) }
        catch( e ) { return next( e ) }
        return next()
      }
    }
    
    next()
    
    return this
    
  },
  
  runHookUp: function( name, callback ) {
    
    // Run hooks from the top level down
    var suites = [ this.currentSuite ]
      .concat( this.parents() )
      .reverse()
    
    this.runHooks( name, suites, callback )
    
    return this
    
  },
  
  runHookDown: function( name, callback ) {
    
    // Run hooks from the bottom up
    var suites = [ this.currentSuite ]
      .concat( this.parents() )
    
    this.runHooks( name, suites, callback )
    
    return this
    
  },
  
  runHooks: function( name, suites, callback ) {
    
    var self = this
    var done = callback.bind( this )
    var original = this.currentSuite
    
    function next( suite ) {
      if( suite == null ) {
        this.currentSuite = original
        return done()
      }
      this.currentSuite = suite
      self.runHook( name, function( error ) {
        if( error != null ) {
          var failedSuite = self.currentSuite
          self.currentSuite = original
          return done( error, failedSuite )
        }
        next( suites.pop() )
      })
    }
    
    next( suites.pop() )
    
    return this
    
  },
  
  parents: function() {
    
    var suites = []
    var suite = this.currentSuite
    
    while( suite = suite.parent )
      if( suite !== this.suite )
        suites.push( suite )
    
    return suites
    
  },
  
  abort: function( callback ) {
    
    var done = typeof callback === 'function' ?
      callback.bind( this ) : Function.prototype
    
    log( 'ABORT' )
    this.shouldAbort = true
    
    // TODO:
    // Wait for callback for graceful shutdown (?)
    this.once( 'aborted', function() {
      log( 'ABORTED' )
      done()
    })
    
    return this
    
  },
  
}

inherit( Zeugberg, Emitter )
// Exports
module.exports = Zeugberg