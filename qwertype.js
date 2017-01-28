var en = 'qwertyuiop[]asdfghjkl;\'zxcvbnm,./ ';
var ru = 'йцукенгшщзхъфывапролджэячсмитьбю. ';

function normalize(pattern) {
	
}


function buildIndex(dict) {
  var index = {};
  for (var i = 0; i < dict.length; ++i) {
  	index[dict.charCodeAt(i)] = i;
  }

  return index;
}

function calculateFrequency(dict, index, text) {
	var freqMatrix = new Array(dict.length);
	for (var i = 0; i < dict.length; ++i) {
		var inner = new Array(dict.length);
		inner.fill(0);
		freqMatrix[i] = inner;
	}

	for (var i = 1; i < text.length; ++i) {
		var code1 = index[text.charCodeAt(i)];
		var code2 = index[text.charCodeAt(i-1)];		
		if (code1 === undefined || code2 === undefined) 
			++i;
		else {
			freqMatrix[code1][code2] += 1;
		}	
	}

	for	(var i = 0; i < dict.length; ++i)
		for	(var j = 0; j < dict.length; ++j)
			freqMatrix[i][j] /= text.length;

	return freqMatrix;
}

function rating(dict, index, matrix, text) {
  var result = 0;

  for (var i = 1; i < text.length; ++i) {
    var code1 = index[text.charCodeAt(i)];
    var code2 = index[text.charCodeAt(i-1)];
    if (code1 !== undefined && code2 !== undefined)
      result += matrix[i-1][i];
  }

  return result;
}
