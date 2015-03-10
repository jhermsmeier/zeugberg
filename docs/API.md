# API

### Function `new Zeugberg()`

#### Properties

- **Array `files`:** A list of files loaded by the `glob-stream` during load (see [glob-stream](https://github.com/wearefractal/glob-stream) for details on the structure)
- **Zeugberg.Suite `suite`:** The root suite
- **Zeugberg.Chrome `chrome`:** Chrome frame controller
- **Zeugberg.Page `page`:** Page API exposed to tests
- **Zeugberg.Suite `currentSuite`:** The currently running suite
- **Zeugberg.Test `currentTest`:** The currently running test
- **Number `failures`:** Number of test failures that occured

#### Methods

##### `load( patterns, callback )`

- **Array `patterns`:** Glob patterns for files to load
- **Function `callback( error )`:** called when done loading files

##### `run( callback )`

- **Function `callback( failureCount )`:** Called when all tests have been run (or prematurely aborted by failures)

##### `abort( callback )`

- **Function `callback()`:** Called when the test run has been aborted successfully (NOTE: Currently, the process exits before this happens)

#### Events

- `suite` ( suite )
- `suite:error` ( failedSuite, error )
- `suite:end` ( suite )
- `hook` ( fn )
- `hook:error` ( fn, error )
- `hook:end`
- `test` ( test )
- `test:pending` ( test )
- `test:error` ( test, error )
- `test:pass` ( test )
- `test:end` ( test )
- `aborted`

### Function `new Zeugberg.Test( title, fn, suite )`

#### Properties

- **String `title`:**
- **Zeugberg.Suite `parent`:**
- **Function `fn`:**
- **Boolean `isAsync`:**
- **Boolean `isPending`:**

#### Methods

##### `run( callback )`

### Function `new Zeugberg.Suite( title, parent )`

#### Properties

- **String `title`:**
- **Zeugberg.Suite `parent`:**
- **Object `context`:**
- **Array `tests`:**
- **Array `suites`:**
- **Object `hooks`:**
  - **Array `setup`:**
  - **Array `beforeEach`:**
  - **Array `afterEach`:**
  - **Array `teardown`:**
- **Boolean `isRoot`:**
- **String `name`:**

#### Methods

##### `count()`
##### `updateContext( context )`

- **Object `context`:** Optional.

##### `setup( fn )`
##### `beforeEach( fn )`
##### `afterEach( fn )`
##### `teardown( fn )`

##### `addTest( title, fn )`

- **String `title`:**
- **Function `fn`:**

##### `addSuite( title, fn )`

- **String `title`:**
- **Function `fn`:**

#### Events

### Function `new Zeugberg.Page( chrome )`

#### Properties

- **Number `status`:** HTTP status code
- **String `statusText`:** HTTP status text
- **Object `response`:** HTTP response
- **Zeugberg.Chrome `chrome`:**
- **Array `checklist`:** List of events to wait for, before emitting the `ready` event

#### Methods

##### `updateGlobals()`
##### `attachEvents()`
##### `reload( callback )`
##### `navigate( path, callback )`
##### `resize( width, height, callback )`
##### `capture( [width,] callback )`

#### Events

- `ready`

### Function `new Zeugberg.Chrome()`

#### Properties

- **nw.gui.Window `frame`:**
- **nw.gui.Window `devTools`:** The `frame`'s devTools
- **WebKitInspector `inspector`:** See [jhermsmeier/inspector](https://github.com/jhermsmeier/inspector)
- **String `location`:** `window.location.href`

#### Methods

##### `attachEvents()`
##### `attachWindowEvents()`
##### `attachDebugger()`
##### `attachInspector()`
##### `open( path )`
##### `close( [force] )`

#### Events

- `loaded`
- `resized`
- `response` ( response )
- `attachEvents`
- `error` ( error )
- `inspector:attached`
- `inspector:enabled`
