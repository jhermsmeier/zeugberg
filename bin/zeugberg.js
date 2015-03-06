#!/usr/bin/env node
var nw = require( 'nw' )
var path = require( 'path' )
var childProcess = require( 'child_process' )
var log = require( 'debug' )( 'ZEUGBERG:CLI' )
var inspect = require( 'util' ).inspect

// nw root path (package to execute)
var root = path.join( __dirname, '..' )
// Path to nwjs executable
var bin = nw.findpath()

// nw cli arguments
var argv = process.argv.slice( 2 )

// cwd where the process was started,
// nw needs to chdir there
argv.unshift( process.cwd() )
// nw package root (zeugberg)
argv.unshift( root )

log( 'ARGV', inspect( process.argv ) )
log( 'CWD', inspect( process.cwd() ) )

// Child process options
var options = {
  env: process.env,
  stdio: 'inherit',
}

// Spawn nw as a child process
var proc = childProcess.spawn( bin, argv, options )

proc.on( 'exit', function( code, signal ) {
  log( 'CHILD_PROCESS:EXIT', inspect({
    code: code,
    signal: signal,
  }))
  process.on( 'exit', function() {
    signal != null ?
      void process.kill( process.pid, signal ) :
      void process.exit( code )
  })
})

process.on( 'SIGINT', function() {
  proc.kill( 'SIGINT' )
  proc.kill( 'SIGTERM' )
  process.kill( process.pid, 'SIGINT' )
})
