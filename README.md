Web navigation language, check it here: https://pyanzin.github.io/qnav

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
