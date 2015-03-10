# Zeugberg /tsɔʏ̯kbɛʁk/
[![npm](http://img.shields.io/npm/v/zeugberg.svg?style=flat-square)](https://npmjs.com/zeugberg)
[![npm downloads](http://img.shields.io/npm/dm/zeugberg.svg?style=flat-square)](https://npmjs.com/zeugberg)
[![build status](http://img.shields.io/travis/jhermsmeier/zeugberg.svg?style=flat-square)](https://travis-ci.org/jhermsmeier/zeugberg)

## Install via [npm](https://npmjs.com)

```sh
$ npm install -g zeugberg
```

## Usage

```sh
$ zeugberg [options]
```

For now, as no reporters exist yet, it is recommended to run `zeugberg` with debug logs:
```sh
$ env DEBUG="*" zeugberg
```

## API

### Function `new Zeugberg( options )`

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

## CLI Switches

- `--help, -h`: Show help
- `--version, -v`: Show version number
- `--pattern, -p`: Test glob pattern [default: "test/**/*.js"]
- `--debug`: Enable debugging output [default: false]

All switches supported by [Content API of Chromium](http://src.chromium.org/svn/trunk/src/content/public/common/content_switches.cc), as well as some nw.js specific switches:

- `--data-path`: Override the default data path (where cookies and localStorage etc. reside)
- `--disable-gpu --force-cpu-draw`: force the drawing / compositing using cpu (needed for click through transparency), see [nw.js/wiki/Transparency](https://github.com/nwjs/nw.js/wiki/Transparency).

For details see [nw.js/wiki/Command-line-switches](https://github.com/nwjs/nw.js/wiki/Command-line-switches).
