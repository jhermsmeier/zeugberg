#!/usr/bin/env node
var bin = require( 'electron-prebuilt' )
var path = require( 'path' )
var childProcess = require( 'child_process' )
var log = require( 'debug' )( 'ZEUGBERG:CLI' )
var inspect = require( 'util' ).inspect

// Get nw.js root path (package to execute)
var root = path.join( __dirname, '..' )
// Get cli arguments for nw.js
var argv = process.argv.slice( 2 )

// Determine if the --debug flag has been specified
var debug = !!~argv.indexOf( '--debug' )
if( debug === true ) {
  process.env[ 'DEBUG' ] = '*'
}

// CWD where the process was started,
// nw needs to chdir there
argv.unshift( process.cwd() )
// Package root (zeugberg)
argv.unshift( root )

log( 'ARGV', inspect( process.argv ) )
log( 'CWD', inspect( process.cwd() ) )

// Child process options
var options = {
  // Inherit the environment
  env: process.env,
  // Ignore stderr, unless --debug is on
  stdio: debug != true ?
    [ 0, 1, 'ignore' ] :
    [ 0, 1, 2 ],
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
