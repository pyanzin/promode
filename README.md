# promode
Quich site navigation

If you are so happy using modern interfaces...

Define your keyboard shortcuts like this:

``` javascript
// Google Translate
'$t$ranslate' -> {host('https://translate.google.com'); anchor('{from}/{to}/{text}')}
  or
    'from $russian' -> replace(anchor, '{from}', 'ru')
    'from $english' -> replace(anchor, '{from}', 'en')
    'from $spanish' -> replace(anchor, '{from}', 'es')
    'from $german' -> replace(anchor, '{from}', 'de')
  then
    or
      'to $russian' -> replace(anchor, '{to}', 'ru')
      'to $english' -> replace(anchor, '{to}', 'en')
      'to $spanish' -> replace(anchor, '{to}', 'es')
      'to $german' -> replace(anchor, '{to}', 'de')
    then
      '$ '
        freetype -> replace(anchor, '{text}', _)
  '$ '
    freetype -> {replace(anchor, '{from}', 'en'); replace(anchor, '{to}', 'ru'); replace(anchor, '{text}', _)}
```

After that, typing

#### treg navigation

will redirect you to https://translate.google.com/#en/es/navigation.
