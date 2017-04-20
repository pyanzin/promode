# qnav

Qnav is a web tool targeted to reduce time spent on web navigation.
Although an interfaces of the popular sites today are pretty handy, continuous using of some web applications could be very annoying.
Qnav is built around the idea of manipulating the parts of URL by pressing the sequence of some predefined keys.
These keys are defined by the script written in some language.

In many cases, Qnav allows to replace the sequence of actions like [mouse click]-[typing]-[mouse click]-[typing]-... by typing only one line.

The demo site is worth a thousand words: http://qnav.club

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
  freetype -> { anchor = 'en' / 'ru' / _ }
```

After saving this, typing

#### tregnavigation

will redirect you to https://translate.google.com/#en/ge/navigation.

## Reference

For the better understanding it worth to know the internal organization. The script compiles to the tree-like structure, lets call it just tree. 
Let's call the user input pattern. Tree receives the pattern, recursively advancing from the top node, 
consuming the part of the pattern and passing the rest to it's children. Advancing, the nodes collect the modifiers, which in case of  are used to form an URL.
Different types of nodes handles the pattern differently, and call it's children differenly.
To return the successful result, the parsing process is not required to reach a terminal node.

### Script language

### Standard node

Standard node could be defined by a single-quoted string:

``` javascript
'$s$earch'
```

This string is used to show the hint for the user and to define the condition for this node.
'$s' and '$e' are conditional symbols and means that user has to type 'se' to pass this node.
Standard node can have 0 or more conditional symbols.

It also can have a modifiers part defined like this:

``` javascript
'$s$earch' -> { protocol = 'https'; host = 'google.com'; path = 'search' }
```

If the modifier is only one, it could be defined without braces:

``` javascript
'$s$earch' -> host = 'google.com'
```

### Freetype node

### Or-then node

### And-then node