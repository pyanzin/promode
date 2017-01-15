

// returns modifier which adds element at the passed depth
function addElement(elem, depth) {
  return function(urlObj) {
    urlObj.elements[depth] = urlObj.elements[depth] || [];
    urlObj.elements[depth].push(elem);
  }
}

// makes standard node from shortcut passed
function node(shortcut) { 
  var re = /\$([a-zA-Z0-9\/ ]{1})/g;
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
    possibleElem: $('<span style="border-color: ' + toColor(shortcut) + '" class="node-possible">' + note + '</span>'),
    passedElem: $('<span style="background-color: ' + toColor(shortcut) + '"  class="node-passed">' + note + '</span>'),
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

      if (pattern.length < position && prefix.length > 0) {
        return parseResult(0, [addElement(that.possibleElem, depth)]);      
      }

      var isMatch = this.match(pattern, position);
      if (!isMatch)
        return null;

      if (this.children.length === 0)
        return parseResult(
          that.prefix.length,
          that.modifiers.concat([addElement(that.passedElem, depth)])
        );

      if (pattern.length <= that.prefix.length + position) {
        var possibleResults = parseResult();
        for (var i = 0; i < that.children.length; ++i) {
          possibleResults = merge(possibleResults, that.children[i].traverse(pattern, position + that.prefix.length + 1, depth + 1));
        }

        return merge(parseResult(
            that.prefix.length,
            that.modifiers.concat([addElement(that.passedElem, depth)])
          ),
        possibleResults);
      }

      for (var i = 0; i < that.children.length; ++i) {
        var result = that.children[i].traverse(pattern, position + that.prefix.length, depth + that.prefix.length > 0 ? 1 : 0);
        if (result !== null)
          return merge(
            parseResult(that.prefix.length, that.modifiers.concat([addElement(that.passedElem, depth)])),
            result
          );
      };

      return null;
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

      if (pattern.length <= position) {
        return orBody.traverse(pattern, position + 1, depth);
      }

      var orResult = orBody.traverse(pattern, position, depth);
      if (orResult === null)
        return null;

      var thenResult = thenBody.traverse(pattern, position + orResult.parsed, depth + 1);

      if (thenResult === null)
        return null;

      return merge(orResult, thenResult);
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
      }

      var thenResult = thenBody.traverse(pattern, position + andResult.parsed, depth + 1);

      if (thenResult === null)
        return null;

      return merge(andResult, thenResult);
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

      debugger;
      var mods = that.modifiers.map(
        function(m) { return function(result) { m(result, matchText); };
      });
      
      var freetypeElement = $('<span style="background-color: ' +
        toColor("freetype") + '" class="node-passed">'+ matchText +'</span>');
      var mods = mods.concat(addElement(freetypeElement, depth));

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
          parseResult( matchText.length + termLength, that.modifiers.concat([addElement(freetypeElement, depth)])),
          possibleResults);
      }

      for (var i = 0; i < that.children.length; ++i) {
        var result = that.children[i].traverse(pattern, position + matchText.length + termLength,
          depth + 1);
        if (result !== null)
          return merge(
            parseResult(matchText.length + termLength, that.modifiers.concat([addElement(that.passedElem, depth)])),
            result
          );
      };
    }
  };
}

// Makes modifier which sets the value for property. If value is not here, it should be passed on calling (required by freetype node)
function set(prop, value) {
  if (value === null)
    return function(obj, value) {
      if (typeof(prop) === 'function')
        prop = prop(obj);
      obj[prop] = value;
    };
  else
    return function(obj) {
      if (typeof(prop) === 'function')
        prop = prop(obj);
      if (typeof(value) === 'function')
        value = value(obj);
      obj[prop] = value;
    };
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
        from = from(obj);
      if (typeof(to) === 'function')
        to = to(obj);
      obj[prop] = obj[prop].replace(from, to);
    }
}

// Makes modifier to add new element to the property of array type
function add(prop, key, value) {
  if (value === null)
    return function(obj, value) {
      obj[prop] = obj[prop] || [];
      obj[prop].push({k: key, v: value});
    };
  else
    return function(obj) {
      if (typeof(value) === 'function')
        value = value(obj);
      obj[prop] = obj[prop] || [];
      obj[prop].push({k: key, v: value});
    }
}

function buildUrl(obj) {
  var url = obj.host;
  if (obj.path)
    url += "/" + obj.path;
  if (obj.params.length)
    url += "?" + obj.params.map(function(x) { return x.k + "=" + x.v; }).join("&");
  if (obj.anchor && obj.anchor.length)
    url += "#" + obj.anchor;

  return url;
}

function emptyUrl() {
  return {
    host: "",
    path: "",
    params : [],
    anchor: "",
    newWindow: false,
    elements: {}
  };
}

function toColor(s) {
  var res = 0;
  for (var i = 0; i < s.length; ++i) {
    res ^= s.charCodeAt(i);
  };

  return "hsla(" + res % 256 + ", 58%, 70%, 1)";
}

var qnav = {};

function ontype(pattern) {
  var urlObj = emptyUrl();
  var result = root.traverse(pattern, 0, 0);

  if (result !== null) {
    result.modifiers.forEach(function(m) {
      m(urlObj);
    });

    var url = buildUrl(urlObj);
    qnav.url = url;
    qnav.urlObj = urlObj;
    $("#qnav-url").text(url);

    renderElemTree(urlObj.elements);
  } else {
    $("#qnav-url").text("");
  };
 
}

function renderElemTree(elementsObj) {
  $("#tree").text("");
  var i = 1;
  var rowElements;
  while(rowElements = elementsObj[i++]) {
    var row = $('<div class="treeLevel"></div>');
    for (var j = 0; j < rowElements.length; j++) {
      row.append(rowElements[j]);
    };
    $("#tree").append(row);
  }
}

$(function() {
  $('#qnav-input').keypress(function (e) {
     if (e.which === 13 && qnav.url) {
        if (qnav.urlObj.newWindow) {
            var win = window.open(qnav.url, '_blank');
            if (qnav.urlObj.focus)
              win.focus();
        } else {
            document.location.href = qnav.url;
        }

        //window.location.href = qnav.url;
    };
  });

  editor = ace.edit("script");
  editor.setTheme("ace/theme/github");
  editor.getSession().setMode("ace/mode/python");
  editor.setOption('tabSize', 2);
  // this shows all invisibles, but only the spaces are required
  //editor.setOption('showInvisibles', true);

  if (localStorage.script)  
    editor.setValue(localStorage.script);
  else
    localStorage.script = editor.getValue();

  $("#qnav-input").focus();
  parse();  
});

function parse() {
  var result = Parser(localStorage.script);
  if (result.success) {
    root = result.tree;
    $('#qnav-error').text('');
    //ontype("");
  } else {
    var errorText = result.error.text + " at " +
      (result.error.row + 1) + ":" + (result.error.col + 1);
    $('#qnav-error').text(errorText);
    $('#tree').text("");
  }
}

function saveScript () {
  localStorage.script = editor.getValue();
}
