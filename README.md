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

To run `zeugberg` in full debug mode:
```sh
$ env DEBUG="*" zeugberg
```

```
Options:
  --help, -h      Show help
  --version, -v   Show version number
  --pattern, -p   Test glob pattern                                        [default: "test/**/*.js"]
  --reporter, -r  Test reporters to use (can be specified multiple times)  [default: "tap"]
  --proxy         Set the proxy configuration
  --debug         Enable debugging output                                  [default: false]
```

### Chromium CLI Options

Additionally, all switches supported by [Content API of Chromium](http://src.chromium.org/svn/trunk/src/content/public/common/content_switches.cc), as well as some nw.js specific switches:

- `--data-path`: Override the default data path (where cookies and localStorage etc. reside)
- `--disable-gpu --force-cpu-draw`: force the drawing / compositing using cpu (needed for click through transparency), see [nw.js/wiki/Transparency](https://github.com/nwjs/nw.js/wiki/Transparency).

For details see [nw.js/wiki/Command-line-switches](https://github.com/nwjs/nw.js/wiki/Command-line-switches).

### Proxy Configuration

Parses the rules from a string, indicating which proxies to use.
```
proxy-uri = [<proxy-scheme>"://"]<proxy-host>[":"<proxy-port>]
proxy-uri-list = <proxy-uri>[","<proxy-uri-list>]
url-scheme = "http" | "https" | "ftp" | "socks"
scheme-proxies = [<url-scheme>"="]<proxy-uri-list>
proxy-rules = scheme-proxies[";"<scheme-proxies>]
```

Thus, the proxy-rules string should be a semicolon-separated list of
ordered proxies that apply to a particular URL scheme. Unless specified,
the proxy scheme for proxy-uris is assumed to be http.

Some special cases:

* If the scheme is omitted from the first proxy list, that list applies to all URL schemes and subsequent lists are ignored.
* If a scheme is omitted from any proxy list after a list where a scheme has been provided, the list without a scheme is ignored.
* If the url-scheme is set to `socks`, that sets a fallback list that to all otherwise unspecified url-schemes,
  however the default proxy-scheme for proxy urls in the 'socks' list is understood to be `socks4://` if unspecified.

For example:

```
"http=foopy:80;ftp=foopy2"  -- use HTTP proxy "foopy:80" for http://
                               URLs, and HTTP proxy "foopy2:80" for
                               ftp:// URLs.
"foopy:80"                  -- use HTTP proxy "foopy:80" for all URLs.
"foopy:80,bar,direct://"    -- use HTTP proxy "foopy:80" for all URLs,
                               failing over to "bar" if "foopy:80" is
                               unavailable, and after that using no
                               proxy.
"socks4://foopy"            -- use SOCKS v4 proxy "foopy:1080" for all
                               URLs.
"http=foop,socks5://bar.com -- use HTTP proxy "foopy" for http URLs,
                               and fail over to the SOCKS5 proxy
                               "bar.com" if "foop" is unavailable.
"http=foopy,direct://       -- use HTTP proxy "foopy" for http URLs,
                               and use no proxy if "foopy" is
                               unavailable.
"http=foopy;socks=foopy2   --  use HTTP proxy "foopy" for http URLs,
                               and use socks4://foopy2 for all other
                               URLs.
```

See [nw.js/wiki/App#setproxyconfigconfig](https://github.com/nwjs/nw.js/wiki/App#setproxyconfigconfig)
