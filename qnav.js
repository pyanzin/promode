function addPossible(elem) {
  return function(urlObj) {
    urlObj.possibleElements = urlObj.possibleElements || [];
    urlObj.possibleElements.push(elem);
  }
}

function addPassed(elem) {
  return function(urlObj) {
    urlObj.passedElements = urlObj.passedElements || [];
    urlObj.passedElements.push(elem);
  }
}

// makes standard node from shortcut passed
function node(shortcut) { 
  var re = /\$([a-zA-Z0-9\/ \.\'\:]{1})/g;
  var keys = shortcut.match(re) || [];
  var prefix = "";
  var note = shortcut;

  for (var i = 0; i < keys.length; i++) {
      var k = keys[i].slice(1, 2);
      prefix += k;
      note = note.replace(keys[i], '<span class="key">' + k + '</span>');
  }

  return {
    children: [],
    modifiers: [],
    prefix: prefix,
    possibleElem: $('<span style="border-color: ' + toMainColor(prefix) + '; background-color: ' + toAuxColor(prefix) + '" class="node-possible">' + note + '</span>'),
    passedElem: $('<span style="background-color: ' + toMainColor(prefix) + '"  class="node-passed">' + note + '</span>'),
    match: function(pattern, position) {    
      return pattern.startsWith(this.prefix, position);
    },    
    child: function(newChild) {
      this.children.push(newChild);
      return this;
    },
    modifier: function(newModifier) {
      this.modifiers.push(newModifier);
      return this;
    },
    traverse: function(pattern, position, depth) {
      var that = this;

      var isMatch = that.match(pattern, position);
      if (!isMatch)
        return null;

      if (that.children.length === 0)
        return parseResult(
          that.prefix.length,
          that.modifiers.concat([addPassed(that.passedElem), parsed(prefix.length, toMainColor(prefix))])
        );

      if (pattern.length <= that.prefix.length + position) {
        var possibleResults = parseResult();
        for (var i = 0; i < that.children.length; ++i) {
          var childResult = that.children[i].asPossible(depth + (shortcut.length > 0 ? 1 : 0));
          if (childResult !== null) 
            possibleResults = merge(possibleResults, childResult);
        } 

        var currentResult = parseResult(
            that.prefix.length,
            that.modifiers.concat(pattern.length > 0 ? [addPassed(that.passedElem), parsed(prefix.length, toMainColor(prefix))] : [])
        );

        return merge(currentResult, possibleResults);
      }

      for (var i = 0; i < that.children.length; ++i) {
        var result = that.children[i].traverse(pattern, position + that.prefix.length, depth + (shortcut.length > 0 ? 1 : 0));
        if (result !== null)
          return merge(
            parseResult(that.prefix.length, that.modifiers.concat(pattern.length > 0 ?
              [addPassed(that.passedElem, depth), parsed(prefix.length, toMainColor(prefix))] : [])),
            result
          );
      };

      return null;
    },
    asPossible: function(depth) {      
      return parseResult(0, [addPossible(this.possibleElem, depth)]);
    }
  };
}

// returns parsing result
function parseResult(parsed, modifiers) {
  return {
        parsed: parsed || 0,
        modifiers: modifiers || []
      };
}

// Merges two traversing results
function merge(result1, result2) {
  return {
    parsed: result1.parsed + result2.parsed,
    modifiers: result1.modifiers.concat(result2.modifiers)
  };
}

// Combinator node. Calls orBody node and if it returns result goes to thenBody.
function orNode(orBody, thenBody) {
  return {
    traverse: function(pattern, position, depth) {
      var that = this;

      if (pattern.length <= position)
        return that.asPossible(depth);

      var orResult = orBody.traverse(pattern, position, depth);
      if (orResult === null)
        return null;

      if (pattern.length <= position + orResult.parsed)
        return merge(orResult, thenBody.asPossible(depth));      

      var thenResult = thenBody.traverse(pattern, position + orResult.parsed, depth + 1);

      if (thenResult === null)
        return null;

      return merge(orResult, thenResult);
    },
    asPossible: function(depth) {      
      return orBody.asPossible(depth);
    }
  };
}

// Combinator node. Calls andBody node while it returns result or moves towards the pattern and then goes to thenBody
function andNode(andBody, thenBody) {
  return {
    traverse: function(pattern, position, depth) {
      var that = this;
      var andResult = parseResult();
      while (true) {
        result = andBody.traverse(pattern, position + andResult.parsed, depth);
        if (result !== null && result.parsed > 0)
          andResult = merge(andResult, result);
        else
          break;
      };

      var thenResult = thenBody.traverse(pattern, position + andResult.parsed, depth + 1);

      if (thenResult === null)
        return merge(andResult, that.asPossible(depth));

      return merge(andResult, thenResult);
    },
    asPossible: function(depth) {      
      return merge(
        andBody.asPossible(depth),
        thenBody.asPossible(depth));
    }
  };
}

// makes freetype node which captures all the input from position to the end of string
function freetype(terminator) {
  return {
    children: [],
    modifiers: [],
    match: function(pattern, position) {
      var termPosition = pattern.indexOf(terminator, position);

      if (termPosition === -1)
        return pattern.substring(position);
      else
        return pattern.substring(position, termPosition);
    },    
    child: function(newChild) {
      this.children.push(newChild);
      return this;
    },
    modifier: function(newModifier) {
      this.modifiers.push(newModifier);
      return this;
    },
    traverse: function(pattern, position, depth) {
      var that = this;
      var matchText = this.match(pattern, position);

      var mods = that.modifiers.map(
        function(m) { return function(result) { m(result, matchText); };
      });

      var color = toMainColor("freetype");

      var terminatorPiece = terminator
                              ? '<span class="key">' + terminator + '</span>'
                              : '';
      
      var freetypeElement = $('<span style="background-color: ' +
        color + '" class="node-passed">'+ matchText + terminatorPiece + '</span>');

      var mods = mods.concat([addPassed(freetypeElement, depth), parsed(matchText.length, color)]);

      var termLength = terminator ? terminator.length : 0;

      if (this.children.length === 0)
        return parseResult(matchText.length + termLength, mods);
      
      if (pattern.length <= position + termLength) {
        var possibleResults = parseResult();
        for (var i = 0; i < that.children.length; ++i) {
          possibleResults = merge(possibleResults,
            that.children[i].traverse(pattern, position + matchText.length + termLength, depth + 1));
        }

        return merge(
          parseResult(matchText.length + termLength, mods.concat([addPassed(freetypeElement, depth)])),
          possibleResults
        );
      }

      for (var i = 0; i < that.children.length; ++i) {
        var result = that.children[i].traverse(pattern, position + matchText.length + termLength,
          depth + 1);
        if (result !== null)
          return merge(
            parseResult(matchText.length + termLength, mods),
            result
          );
      };
    },
    asPossible: function(depth) {
      var terminatorPiece = terminator
                        ? '<span class="key">' + terminator + '</span>'
                        : '';

      var freetypePossible = $('<span style="background-color: ' +
        toMainColor("freetype") + '" class="node-passed">' + terminatorPiece + '</span>');

      return parseResult(0, [addPossible(freetypePossible)]);
    }
  };
}

function aggregatorNode () {
  return {
    children: [],
    modifiers: [], 
    child: function(newChild) {
      this.children.push(newChild);
      return this;
    },
    modifier: function(newModifier) {
      this.modifiers.push(newModifier);
      return this;
    },
    traverse: function(pattern, position, depth) {
      var that = this;

      for (var i = 0; i < that.children.length; ++i) {
        var childResult = that.children[i].traverse(pattern, position, depth);
        if (childResult !== null)
          return merge(parseResult(0, that.modifiers), childResult);
      };

      return null;
    },
    asPossible: function(depth) {
      var result = parseResult();
      for (var i = 0; i < this.children.length; ++i) {
        result = merge(
          result,
          this.children[i].asPossible(depth)
        );
      };
      return result;
    }
  };
}

// Makes modifier which sets the value for property. If value is not here, it should be passed on calling (required by freetype node)
function set(prop, value) {
  if (value === null)
    return function(obj, value) {
      var propName;
      if (typeof(prop) === 'function')
        propName = prop(obj);
      else
        propName = prop;
      obj[propName] = value;
    };
  else
    return function(obj) {
      var propName;
      if (typeof(prop) === 'function')
        propName = prop(obj);
      else
        propName = prop;
      var valueName;
      if (typeof(value) === 'function')
        valueName = value(obj);
      else
        valueName = value;
      obj[prop] = valueName;
    };
}

function modifierVarCall(identifier) {
  return function(obj, value) {
    obj[identifier].forEach(function(f) {
      f(obj, value);
    });
  }
}

function replaceAll(text, from, to) {
  var pieces = text.split(from);
  return pieces.join(to);
}

// Makes modifier which replaces substring in property
function replace(prop, from, to) {
  if (to === null)
    return function(obj, to) {
      obj[prop] = obj[prop].replace(from, to);
    };
  else
    return function(obj) {
      if (typeof(from) === 'function')
        var fromStr = from(obj);
      else
        var fromStr = from;
      if (typeof(to) === 'function')
        var toStr = to(obj);
      else
        var toStr = to;
      if (typeof(obj[prop]) !== 'string')
        return;
      obj[prop] = replaceAll(obj[prop], fromStr, toStr);
    }
}

// Makes modifier to add new element to the property of array type
function add(prop, key, value) {
  if (value === null)
    return function(obj, value) {
      obj[prop] = obj[prop] || {};
      obj[prop][key] = value;
    };
  else
    return function(obj) {
      var valueStr;
      if (typeof(value) === 'function')
        valueStr = value(obj);
      else 
        valueStr = value;
      obj[prop] = obj[prop] || {};
      obj[prop][key] = valueStr;
    }
}

function concat(prop, value) {
  if (value === null)
    return function(obj, value) {
      obj[prop] = obj[prop] + value;
    };
  else
    return function(obj) {
      var valueStr;
      if (typeof(value) === 'function')
        valueStr = value(obj);
      else 
        valueStr = value;
      obj[prop] = obj[prop] + valueStr;
    }
}

function parsed(count, color) {
  return function(obj) {
    obj.ribbon.push({
      count: count,
      color: color
    });
  }
}

function buildUrl(obj) {
  var url = obj.protocol + "://";
  url += obj.host;
  if (obj.path)
    url += "/" + obj.path;
  var params = Object.keys(obj.params).map(function(k) {
    return { key: k, value: obj.params[k] };
  });
  if (params.length)
    url += "?" + params.map(function(x) { return x.key + "=" + x.value; }).join("&");
  if (obj.anchor && obj.anchor.length)
    url += "#" + obj.anchor;

  return url;
}

function emptyUrl() {
  return {
    host: "",
    path: "",
    params : {},
    anchor: "",
    newWindow: false,
    passedElements: [],
    possibleElements: [],
    ribbon: []
  };
}

function toHue(s) {
  var res = 0;
  for (var i = 0; i < s.length; ++i) {
    res += (s.charCodeAt(i) - 97) * 255 / 24 * Math.pow(2, -i + 1);
  };

  return res % 256;
}

function toMainColor(s) {
  return "hsla(" + toHue(s) + ", 58%, 70%, 1)";
}

function toAuxColor(s) {
  return "hsla(" + toHue(s) + ", 58%, 90%, 1)";
}

var qnav = {};

function ontype(pattern) {
  var urlObj = emptyUrl();
  var result = root.traverse(pattern, 0, 0);

  if (result !== null) {
    result.modifiers.forEach(function(m) {
      m(urlObj);
    });

    qnav.ribbon = urlObj.ribbon;

    var url = buildUrl(urlObj);
    qnav.url = url;
    qnav.urlObj = urlObj;
    $("#qnav-url").text(url);

    renderRibbon(qnav.ribbon);

    renderPassed(urlObj.passedElements);
    renderPossible(urlObj.possibleElements);
  } else {
    $("#qnav-url").text("");
  };
 
}

function renderRibbon(models) {
  var ribbon = $("#ribbon");
  ribbon.html("");
  models.forEach(function(m) {
    if (m.count === 0) 
      return;
    var elem = $("<span></span>");
    elem.css("width", 1.66 * m.count + "em");
    elem.css("background-color", m.color);

    ribbon.append(elem);
  });
}

function renderPassed(elements) {
  $("#passedElements").text("");
  var i = 0;
  elements.forEach(function(x) {
     $("#passedElements").append(x);
  });
}

function renderPossible(elements) {
  $("#possibleElements").text("");
  var i = 0;
  elements.forEach(function(x) {
     $("#possibleElements").append(x);
  });
}

$(function() {
  function updateHistory(newEntry) {
    var history = qnav.history;
    if (history[history.length - 1] === newEntry)
      return;

    if (history.length >= 10)
      history = history.splice(1);
    history.push(newEntry);

    localStorage.patternHistory = history.join("\n");
  }

  $('#qnav-input').keydown(function (e) {
     if (e.which === 13 && qnav.url) { // Enter
        updateHistory($("#qnav-input").val());
        if (qnav.urlObj.newWindow) {
            var win = window.open(qnav.url, '_blank');
            if (qnav.urlObj.focus)
              win.focus();
        } else {
            document.location.href = qnav.url;
        }

        //window.location.href = qnav.url;
    } else if (e.which === 40) { // Arrow down
      var len = qnav.history.length;
      var index = qnav.historyIndex;
      index = (index + 1) % len;
      $("#qnav-input").val(qnav.history[len - index - 1]);
      ontype(qnav.history[len - index - 1]);
      qnav.historyIndex = index;
    } else if (e.which === 38) { // Arrow up
      var len = qnav.history.length;
      var index = qnav.historyIndex;
      index = (index - 1 + len) % len;
      $("#qnav-input").val(qnav.history[len - index - 1]);
      ontype(qnav.history[len - index - 1]);
      qnav.historyIndex = index;
    } else if (e.which === 27) { // Esc
      $("#qnav-input").val("");
      ontype("");
    };
  });

  editor = ace.edit("script");
  editor.setTheme("ace/theme/github");
  editor.getSession().setMode("ace/mode/python");
  editor.setOption('tabSize', 2);
  editor.setShowPrintMargin(false);
  //localStorage.script = editor.getValue();
  // this shows all invisibles, but only the spaces are required
  //editor.setOption('showInvisibles', true);

  if (localStorage.script)  
    editor.setValue(localStorage.script);
  else
    localStorage.script = editor.getValue();
  
  var history = localStorage.patternHistory;
  if (history)
    qnav.history = history.split("\n");
  else
    qnav.history = [];
  qnav.historyIndex = -1;

  $("#qnav-input").focus();
  onSaveScript();  
});

function onSaveScript () {
  var result = Parser(editor.getValue());
  if (result.success) {
    root = result.tree;
    ontype("");
    editor.session.clearAnnotations();

    localStorage.script = editor.getValue();

    $("#editScriptBtn").css("display", "block");
    $("#scriptEditButtons").css("display", "none");

    $("#treeWrapper").css("display", "flex");
    $("#scriptWrapper").css("display", "none");

    $("#qnav-input").focus();
  } else {
    editor.session.setAnnotations([{
      row: result.error.row,
      column: result.error.col,
      text: result.error.text,
      type: "error"
    }]);

    $('#tree').text("");
  }

}

function onCancel() {
  editor.setValue(localStorage.script);

    $("#editScriptBtn").css("display", "block");
    $("#scriptEditButtons").css("display", "none");

    $("#treeWrapper").css("display", "flex");
    $("#scriptWrapper").css("display", "none");

    $("#qnav-input").focus();  

    $('#tree').text("");
}

function onEditScript() {
  editor.setValue(localStorage.script);

  $("#editScriptBtn").css("display", "none");
  $("#scriptEditButtons").css("display", "block");

  $("#treeWrapper").css("display", "none");
  $("#scriptWrapper").css("display", "flex");
}
