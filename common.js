var getKeys = Object.keys;

function getValues(obj) {
  var keys = getObjectKeys(obj);

  var result = [];

  for (var i = 0; i < keys.length; i++) {
    var value = obj[keys[i]];
    result.push(value);
  }

  return result;
}

function distinct(xs) {
  return xs.filter(function (x, i, xs) {
    return i === xs.indexOf(x);
  });
}
