function Parser(sourceText) {
  var parserState = {
    position: 0,
    source: sourceText
  };

  var STRING = 0,
    ARROW = 1,
    OPEN_PAREN = 2,
    CLOSE_PAREN = 3,
    OPEN_BRACE = 4,
    CLOSE_BRACE = 5,
    ID = 6,
    TAB = 7,
    UNDERSCORE = 8,
    SEMICOLON = 9,
    COMMA = 10,
    FILE_END = 11,
    SHARP = 12,
    EQUAL = 13;

  function tokenToString(n) {
    switch (n) {
      case STRING:
        return "STRING";
      case ARROW:
        return "ARROW";
      case OPEN_PAREN:
        return "OPEN_PAREN";
      case CLOSE_PAREN:
        return "CLOSE_PAREN";
      case OPEN_BRACE:
        return "OPEN_BRACE";
      case CLOSE_BRACE:
        return "CLOSE_BRACE";
      case ID:
        return "ID";
      case TAB:
        return "TAB";
      case UNDERSCORE:
        return "UNDERSCORE";
      case SEMICOLON:
        return "SEMICOLON";
      case COMMA:
        return "COMMA";
      case FILE_END:
        return "FILE_END";
      case SHARP:
        return "SHARP";
      case EQUAL:
        return "EQUAL";
      default:
        return null;
    }
  }

  function parseTop() {
    var rootNode = node("");
    var newNode = parseNode(true);
    rootNode.child(newNode);
    while (newNode = parseNode())
      rootNode.child(newNode);
    return rootNode;
  }

  function parseNode(start) {  
    var startPosition = getPosition();  
    var currentTab = start ? 0 : tab();

    var str = string();

    if (str) {
      backtrackTo(startPosition);
      return standard(start);
    }

    var identifier = id();

    if (identifier === 'freetype') {
      backtrackTo(startPosition);
      return parseFreeTypeNode(start);
    } else if (identifier === 'or') {
      backtrackTo(startPosition);    
      return parseOrNode(start);
    } else if (identifier === 'and') {
      backtrackTo(startPosition);    
      return parseAndNode(start);
    }
    
    if (identifier !== null)
      error('Expected \'freetype\', \'or\' or \'and\' block, but found: \'' +
        identifier + '\'');
    
    if (identifier === null && endOfFile()) 
      return null;

    wrongToken([ID, STRING, FILE_END]);
  }

  function standard(start) {
    var currentTab = start ? 0 : tab();

    var shortcut = string();

    if (!shortcut)
      return null;

    var modifiers;
    if (arrow()) {
      modifiers = mods();
    } else {
      modifiers = [];
    }

    var preTabPosition = getPosition();
    var nextTab = tab();
    
    while (arrow()) {
      modifiers = modifiers.concat(mods());
      preTabPosition = getPosition();
      nextTab = tab();
    }

    backtrackTo(preTabPosition);

    var newNode = node(shortcut);

    for (var i = 0; i < modifiers.length; i++) {
      newNode.modifier(modifiers[i]);
    };

    while (nextTab - currentTab === 2) {
      newNode.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    return newNode;
  }

  function parseFreeTypeNode(start) {
    var currentTab = start ? 0 : tab();

    var identifier = id();

    if (identifier !== 'freetype')
      return null;

    var terminator = null;
    if (openParen()) {
      terminator = string(true);
      closeParen(true);
    }

    var isArrow = arrow();

    var modifiers = [];
    if (isArrow)
      modifiers = mods();

    var newNode = freetype(terminator);

    for (var i = 0; i < modifiers.length; i++) {
      newNode.modifier(modifiers[i]);
    };

    var preTabPosition = getPosition();
    var nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      newNode.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    return newNode;
  }

  function parseOrNode(start) {
    var currentTab = start ? 0 : tab();

    var orId = id();

    if (orId !== 'or')
      return null;

    var orChild = node('');

    var preTabPosition = getPosition();
    var nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      orChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    var thenTab = tab();
    var thenId = id();

    if (thenId !== 'then')
      error('\'then\' block expected after \'or\' block');

    var thenChild = node('');

    preTabPosition = getPosition();
    nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      thenChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    return orNode(orChild, thenChild);
  }

  function parseAndNode(start) {
    var currentTab = start ? 0 : tab();

    var andId = id();

    if (andId !== 'and')
      return null;

    var andChild = node('');

    var preTabPosition = getPosition();
    var nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      andChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    var thenTab = tab();
    var thenId = id();

    if (thenId !== 'then')
      error('\'then\' block expected after \'and\' block');

    var thenChild = node('');

    preTabPosition = getPosition();
    nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      thenChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);

    };

    return andNode(andChild, thenChild);
  }

  function mods() {
    var isBrace = openBrace();

    var newModifiers = [];

    if (isBrace) {
      while (true) {
        var newMod = modifier();
        if (!newMod) {
          closeBrace();
          return newModifiers;
        } else {        
          newModifiers.push(newMod);
          semicolon();
        }
      }
    } else {
      return [modifier()];
    }
  }

  function paramValue() {
    var preValPosition = getPosition();
    var str = string();

    if (str !== null)
      return str;

    var identifier = id();

    if (identifier !== null)
      return function(obj) { return obj[identifier]; }
    
    backtrackTo(preValPosition);
    return null;
  }

  function modifier() {
    var identifier = id();

    switch (identifier) {
      case 'host':
        openParen(true);
        var val = paramValue();
        if (val === null && underscore(true))
          val = null;
        closeParen(true);
        return set('host', val);

      case 'path':
        openParen(true);
        var val = paramValue();
        if (val === null && underscore(true))
          val = null;
        closeParen(true);
        return set('path', val);

      case 'anchor':
        openParen(true);
        var str = string();
        if (!str && underscore(true))
          str = null;
        closeParen(true);
        return set('anchor', str);

      case 'param':
        openParen(true);
        var prop = string(true);
        comma(true);
        var value = paramValue();
        if (!value && underscore(true)) {
          value = null;
        };
        closeParen(true);
        return add('params', prop, value);

      case 'replace':
        openParen(true);
        var prop = id(true);
        comma(true);
        var fromVal = paramValue();
        comma(true);
        var toVal = paramValue();
        if (toVal === null && underscore(true))
          var toVal = null;
        closeParen(true);
        return replace(prop, fromVal, toVal);

      case 'set':
        openParen(true);
        var identifier = id();
        comma(true);
        var val = paramValue();
        closeParen(true);
        return set(identifier, val);
    }

    if (!isSharp())
      return null;

    var varId = id(true);
    debugger;
    if(isEqual())
      return set('#'+varId, mods());
    else if(openParen() && closeParen()) {
      return modifierVarCall('#'+varId);
    }

    return null;
  }


  var comma = BoolParser(COMMA),
    openParen = BoolParser(OPEN_PAREN),
    closeParen = BoolParser(CLOSE_PAREN),
    id = ValueParser(ID),
    openBrace = BoolParser(OPEN_BRACE),
    closeBrace = BoolParser(CLOSE_BRACE),
    string = ValueParser(STRING),
    arrow = BoolParser(ARROW),
    tab = ValueParser(TAB),
    underscore = BoolParser(UNDERSCORE),
    semicolon = BoolParser(SEMICOLON),
    endOfFile = BoolParser(FILE_END),
    isSharp = BoolParser(SHARP),
    isEqual = BoolParser(EQUAL);


  function BoolParser(type) {
    return function(isRequired) {
      var startPosition = getPosition();
      var token = getToken();

      if (token.type !== type) {
        backtrackTo(startPosition);
        if (isRequired)
          wrongToken([type]);
        return false;
      } else {
        return true;
      }
    }
  }

  function ValueParser(type) {
    return function(isRequired) {
      var startPosition = getPosition();
      var token = getToken();

      if (token === null || token.type !== type) {
        backtrackTo(startPosition);
        if (isRequired)
          wrongToken([type]);
        return null;
      } else {
        return token.value;
      }
    }
  }

  function getNextChar() {
    return parserState.source[parserState.position++];
  }

  function backtrack(n) {
    parserState.position = parserState.position - n;
  }

  function backtrackTo(n) {
    parserState.position = n;
  }

  function getPosition() {
    return parserState.position;
  }
  
  function error(text) {
    var colRow = getColRow(parserState.source, getPosition());
    var ex = {
      text: text,
      row: colRow.row,
      col: colRow.col
    };

    throw ex;
  }

  function wrongToken(expected) {
    var found = getToken().type;
    error("Expected: " + expected.map(tokenToString).join(', ') 
      + "; but found: " + tokenToString(found));
  }

  function wrongSymbol() {
    error('Unable to recognize a token starting with: \'' +
      getNextChar() + '\'');
  }

  function getColRow(text, pos) {
    var row = 0, col = 0;
    for (var i = 0; i <= pos; ++i) {
      if (text[i] === '\n') {
        ++row;
        col = 0;
      } else {
        ++col;
      }
    }

    return { row: row, col: col };
  }

  function getToken() {
    var ch;
    do {
      ch = getNextChar();
    } while (ch === ' ' || ch === '\t');

    switch (ch) {
      case '\'':
        var preStringPosition = getPosition();
        var str = '';
        while ((ch = getNextChar()) !== '\'') {
          if (ch === '\n') {
            backtrackTo(preStringPosition);
            backtrack(1);
            error('Unclosed string');
          }
          str += ch;
        }
        return { type: STRING, value: str };

      case '/':
        if (getNextChar() !== '/') {
          backtrack(2);
          wrongSymbol();
        }

        while (getNextChar() !== '\n')
          ;

        backtrack(1);
        return getToken();
      case '\n':
        var tabCount = 0;

        ch = getNextChar();

        while (ch === ' ' || ch === '\t') {
          ++tabCount;
          ch = getNextChar();
        }

        backtrack(1);
        if (ch === '/' || ch === '\n')
            return getToken();

        if (tabCount % 2 !== 0)
            error("Uneven count of tabs");

        return { type: TAB, value: tabCount };
      case '-':
        if (getNextChar() === '>')
          return { type: ARROW };
        else {
          backtrack(1);
          wrongSymbol();
        }
        break;

      case '(':
        return { type: OPEN_PAREN };
      case ')':
        return { type: CLOSE_PAREN };
      case '{':
        return { type: OPEN_BRACE };
      case '}':
        return { type: CLOSE_BRACE };
      case '_':
        return { type: UNDERSCORE };
      case ';':
        return { type: SEMICOLON };
      case ',':
        return { type: COMMA };    
      case '#':
        return { type: SHARP };
      case '=':
        return { type: EQUAL };
    }

    if (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z') {
      var id = '';
      do {
        id += ch;
        ch = getNextChar();
      } while (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z');

      backtrack(1);
      return { type: ID, value: id };
    }

    if (getPosition() >= parserState.source.length)
      return { type: FILE_END };

    backtrack(1);
    wrongSymbol();
  }

  try {
    return {
      success: true,
      tree: parseTop()
    };
  } catch(ex) {
    return {
      success: false,
      error: ex
    };
  }
}
