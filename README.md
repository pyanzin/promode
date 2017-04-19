# qnav

Qnav is a web tool targeted to reduce time spent on web navigation.
Although an interfaces of the popular sites today are pretty handy, continuous using of some web applications could be very annoying.
Qnav is built around the idea of manipulating the parts of URL by pressing the sequence of some predefined keys.
These keys are defined by the script written in some special language.

In many cases, Qnav allows to replace the sequence of actions like [mouse click]-[typing]-[mouse click]-[typing]-... by typing only one line.

The demo site worth thousands words: http://qnav.club

The example of script:

``` javascript
// Google Translate
'$t$ranslate' -> { protocol = 'https'; host = 'translate.google.com' }
  or
    'from $russian' -> anchor = 'ru'
    'from $english' -> anchor = 'en'
    'from $spanish' -> anchor = 'es'
    'from $german' -> anchor = 'de'
    'from $french' -> anchor = 'fr'
    '$autodetect' -> anchor = 'auto'
  then
    or
      'from $russian' -> anchor /= 'ru'
      'from $english' -> anchor /= 'en'
      'from $spanish' -> anchor /= 'es'
      'from $german' -> anchor /= 'de'
      'from $french' -> anchor /= 'fr'
    then
      freetype -> anchor /= _
  freetype -> { anchor = 'en'; anchor /= 'ru'; anchor /= _ }
```

After saving this, typing

#### tregnavigation

will redirect you to https://translate.google.com/#en/ge/navigation.

## Reference

...to be continued