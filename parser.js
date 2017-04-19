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
    EQUAL = 13,
    PLUS = 14,
    SLASH = 15,
    PLUS_EQUAL = 16,
    SLASH_EQUAL = 17;

  function tokenToString(n) {
    switch (n) {
      case STRING:
        return 'STRING';
      case ARROW:
        return 'ARROW';
      case OPEN_PAREN:
        return 'OPEN_PAREN';
      case CLOSE_PAREN:
        return 'CLOSE_PAREN';
      case OPEN_BRACE:
        return 'OPEN_BRACE';
      case CLOSE_BRACE:
        return 'CLOSE_BRACE';
      case ID:
        return 'ID';
      case TAB:
        return 'TAB';
      case UNDERSCORE:
        return 'UNDERSCORE';
      case SEMICOLON:
        return 'SEMICOLON';
      case COMMA:
        return 'COMMA';
      case FILE_END:
        return 'FILE_END';
      case SHARP:
        return 'SHARP';
      case EQUAL:
        return 'EQUAL';
      case PLUS:
        return 'PLUS';
      case SLASH:
        return 'SLASH';
      case PLUS_EQUAL:
        return 'PLUS_EQUAL';
      case SLASH_EQUAL:
        return 'SLASH_EQUAL';
      default:
        return null;
    }
  }

  function parseTop() {
    return standard(true);
  }

  function parseNode() {
    var startPosition = getPosition();
    var currentTab = tab();

    var str = string();

    if (str) {
      backtrackTo(startPosition);
      return standard();
    }

    var identifier = id();

    if (identifier === 'freetype') {
      backtrackTo(startPosition);
      return parseFreeTypeNode();
    } else if (identifier === 'or') {
      backtrackTo(startPosition);
      return parseOrNode();
    } else if (identifier === 'and') {
      backtrackTo(startPosition);
      return parseAndNode();
    }

    if (identifier !== null)
      error('Expected \'freetype\', \'or\' or \'and\' block, but found: \'' +
        identifier + '\'');

    if (identifier === null && endOfFile())
      return null;

    wrongToken([ID, STRING, FILE_END]);
  }

  function standard(isTop) {
    var currentTab, shortcut;
    if (isTop) {
      currentTab = -2;
      shortcut = '';
    } else {
      currentTab = tab();
      shortcut = string();
    }

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
      var childNode = parseNode();
      if (childNode === null)
        break;
      newNode.child(childNode);
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    return newNode;
  }

  function parseFreeTypeNode() {
    var currentTab = tab();

    var identifier = id();

    if (identifier !== 'freetype')
      return null;

    var terminator = null;
    if (openParen()) {
      terminator = string(true);
      closeParen(true);
    }

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

  function parseOrNode() {
    var currentTab = tab();

    var orId = id();

    if (orId !== 'or')
      return null;

    var orChild = aggregatorNode();

    var preTabPosition = getPosition();
    var nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      orChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    var preThenPosition = getPosition();
    var thenTab = tab();
    var thenId = id();

    var thenChild = aggregatorNode();

    if (thenId !== 'then') {
      backtrackTo(preThenPosition);
      return orNode(orChild, thenChild);
    }

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

  function parseAndNode() {
    var currentTab = tab();

    var andId = id();

    if (andId !== 'and')
      return null;

    var andChild = aggregatorNode();

    var preTabPosition = getPosition();
    var nextTab = tab();
    backtrackTo(preTabPosition);

    while (nextTab - currentTab === 2) {
      andChild.child(parseNode());
      var preTabPosition = getPosition();
      var nextTab = tab();
      backtrackTo(preTabPosition);
    };

    var preThenPosition = getPosition();

    var thenTab = tab();
    var thenId = id();

    var thenChild = aggregatorNode();

    if (thenId !== 'then') {
      backtrackTo(preThenPosition);
      return andNode(andChild, thenChild);
    }

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

    if (isBrace) {
      var newModifiers = [];
      while (!closeBrace()) {
        var newMod = modifier();
        newModifiers.push(newMod);
        semicolon();
      }
      return newModifiers;
    } else {
      return [modifier()];
    }
  }

  function modifier() {
    if (isSharp()) {
      var varId = id(true);
      if (isEqual())
        return set('#' + varId, mods());
      else if (openParen(true) && closeParen(true))
        return modifierVarCall('#' + varId);
    }

    var ast = topAst();
    return eval(ast.compile());

  }

  function topAst() {
    return Func([exprAst()]);
  }

  function exprAst() {
    return assignAst();
  }

  function assignAst() {
    var pos = getPosition();

    var id = idAst();

    if (id === null) {
      backtrackTo(pos);
      return sumAst();
    }

    if (isEqual())
      return Assign(id, sumAst());

    if (isPlusEqual())
      return Assign(id, Sum(id, sumAst()));

    if (isSlashEqual())
      return Assign(id, Slash(id, sumAst()));

    backtrackTo(pos);
    return sumAst();

  }

  function sumAst() {
    var pos = getPosition();

    var left = idAst();

    if (isPlus())
      return Sum(left, sumAst());

    if (isSlash())
      return Slash(left, sumAst());

    backtrackTo(pos);
    return callAst();
  }

  function callAst() {
    var pos = getPosition();

    var id = idAst();

    if (!openParen()) {
      backtrackTo(pos);
      return idAst();
    }

    var params = [];
    while (!closeParen()) {
      params.push(exprAst());
      comma();
    }

    return Call(id, params);
  }

  function idAst() {
    var pos = getPosition();

    var idName = id();

    if (idName === null) {
      backtrackTo(pos);
      return underscoreAst();
    }

    return Id(idName);
  }

  function underscoreAst() {
    var pos = getPosition();

    if (!underscore()) {
      backtrackTo(pos);
      return stringAst();
    }

    return Underscore();
  }

  function stringAst() {
    var str = string();

    if (str === null)
      wrongToken([ID, STRING, UNDERSCORE]);

    return Str(str);
  }

  var comma = BoolParser(COMMA),
    openParen = BoolParser(OPEN_PAREN),
    closeParen = BoolParser(CLOSE_PAREN),
    id = ValueParser(ID),
    openBrace = BoolParser(OPEN_BRACE),
    closeBrace = BoolParser(CLOSE_BRACE),
    string = ValueParser(STRING),
    arrow = BoolParser(ARROW),
    underscore = BoolParser(UNDERSCORE),
    semicolon = BoolParser(SEMICOLON),
    endOfFile = BoolParser(FILE_END),
    isSharp = BoolParser(SHARP),
    isEqual = BoolParser(EQUAL),
    isPlus = BoolParser(PLUS),
    isSlash = BoolParser(SLASH),
    isPlusEqual = BoolParser(PLUS_EQUAL),
    isSlashEqual = BoolParser(SLASH_EQUAL);

  function tab() {
    var preTabPosition = getPosition();
    var token = getToken();
    if (token.type === TAB)
      return token.value;
    else {
      backtrackTo(preTabPosition);
      return 0;
    }
  }

  // Parser which returns if the next token is of the type passed
  // Doesn't advances if the next token is not if this type
  // Throws an error if isRequired is specified
  function BoolParser(type) {
    return function (isRequired) {
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

  // The same as BoolParser but returns the value token represents or null if it doesn't match
  function ValueParser(type) {
    return function (isRequired) {
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

  // Returns the state by n symbols back
  function backtrack(n) {
    parserState.position = parserState.position - n;
  }

  // Sets the state to n position
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
      col: colRow.col,
      isParserError: true
    };

    throw ex;
  }

  function wrongToken(expected) {
    var found = getToken().type;
    error('Expected: ' + expected.map(tokenToString).join(', ')
      + '; but found: ' + tokenToString(found));
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

  // Returns the next token recognized
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

      case '\r':
        getNextChar();
      case '\n':
        var tabCount = 0;

        ch = getNextChar();

        while (ch === ' ' || ch === '\t') {
          ++tabCount;
          ch = getNextChar();
        }

        backtrack(1);
        if (ch === '/' || ch === '\n' || ch === '\r')
          return getToken();

        if (tabCount % 2 !== 0)
          error('Uneven count of tabs');

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
      case '+':
        if (getNextChar() === '=')
          return { type: PLUS_EQUAL };
        backtrack(1);
        return { type: PLUS };
      case '/':
        var nextCh = getNextChar();
        if (nextCh === '=')
          return { type: SLASH_EQUAL };
        if (nextCh === '/') {
          while (getNextChar() !== '\n')
            ;
          backtrack(1);
          return getToken();
        }
        backtrack(1);
        return { type: SLASH };
    }

    if (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z') {
      var id = '';
      do {
        id += ch;
        ch = getNextChar();
      } while (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9');

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
  } catch (ex) {
    return {
      success: false,
      error: ex
    };
  }
}
