var Test = require( './test' )
var log = require( 'debug' )( 'ZEUGBERG:SUITE' )

/**
 * Suite Constructor
 * @return {Suite}
 */
function Suite( title, parent ) {
  
  if( !(this instanceof Suite) )
    return new Suite( title, parent )
  
  this.title = title
  this.parent = parent
  this.context = Object.create(
    ( parent && parent.context ) || null
  )
  
  this.skip = false
  this.tests = []
  this.suites = []
  this.hooks = {
    setup: [],
    beforeEach: [],
    afterEach: [],
    teardown: [],
  }
  
}

/**
 * Suite prototype
 * @type {Object}
 */
Suite.prototype = {
  
  constructor: Suite,
  
  get isRoot() {
    return this.parent == null
  },
  
  get name() {
    return this.parent && this.parent.name ?
      this.parent.name + ' ' + this.title :
      this.title || ''
  },
  
  count: function() {
    var i, count = 0
    for( i = 0; i < this.suites.length; i++ ) {
      count += this.suites[i].count()
    }
    return count + this.tests.length
  },
  
  updateContext: function( context ) {
    
    log( 'UPDATE_CONTEXT' )
    
    context = context != null ?
      context : this
    
    // Suite / Test hooks
    global.setup = context.setup.bind( context )
    global.beforeEach = context.beforeEach.bind( context )
    global.afterEach = context.afterEach.bind( context )
    global.teardown = context.teardown.bind( context )
    
    // Suite / Test definition
    global.suite = context.addSuite.bind( context )
    global.describe = context.addSuite.bind( context )
    global.describe.skip = context.skipSuite.bind( context )
    global.test = this.skip === true ?
      context.skipTest.bind( context ) :
      context.addTest.bind( context )
    global.test.skip = context.skipTest.bind( context )
    
    return this
    
  },
  
  setup: function( fn ) {
    if( typeof fn === 'function' )
      this.hooks.setup.push( fn )
    return this
  },
  
  beforeEach: function( fn ) {
    if( typeof fn === 'function' )
      this.hooks.beforeEach.push( fn )
    return this
  },
  
  afterEach: function( fn ) {
    if( typeof fn === 'function' )
      this.hooks.afterEach.push( fn )
    return this
  },
  
  teardown: function( fn ) {
    if( typeof fn === 'function' )
      this.hooks.teardown.push( fn )
    return this
  },
  
  addTest: function( title, fn ) {
    log( 'ADD_TEST', fn ? '' : 'skip', title )
    var test = new Test( title, fn, this )
    this.tests.push( test )
    return this
  },
  
  skipTest: function( title ) {
    return this.addTest( title )
  },
  
  addSuite: function( title, fn, skip ) {
    var suite = new Suite( title, this )
    suite.skip = skip != null ? skip : this.skip
    log( 'ADD_SUITE', suite.skip ? 'skip' : '', title )
    fn.call( suite.updateContext() )
    this.suites.push( suite )
    return this
  },
  
  skipSuite: function( title, fn ) {
    return this.addSuite( title, fn, true )
  },
  
}

// Exports
module.exports = Suite
