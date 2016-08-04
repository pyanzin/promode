function pattern(s, path, params) { 
	var re = /\$(\w{1})/g; 
	var keys = s.match(re); 
	var prefix = ""; 
	var note = s; 

	for (var i = 0; i < keys.length; i++) { 
		var k = keys[i].slice(1, 2); 
		prefix += k; 
		note = note.replace(keys[i], '<bold>' + k + '</bold>'); 
	} 

	return { 
	note: note, 
	params: params, 
	url: function(s, env) { 
			var kvs = []; 
			var ps = s.split(' ');

			if (ps[0] != (prefix))
				return null;

			for (var i = 1; i < ps.length; ++i) { 
				var param = params.find(function(x) { return ps[i].startsWith(x.prefix); }); 

				if (!param)
					return null; 

				kvs.push(param.name + '=' + ps[i].slice(1, ps[i].length)); 
			}; 

			return path + '?' + kvs.join('&'); 
		}
	}; 
} 

function param(s, pname) { 
	var re = /\$(\w{1})/g; 
	var keys = s.match(re); 
	var prefix = ""; 
	var note = s; 

	for (var i = 0; i < keys.length; i++) { 
		var k = keys[i].slice(1, 2); 
		prefix += k; 
		note = note.replace(keys[i], '<bold>' + k + '</bold>'); 
	} 

	return { 
		prefix: prefix, 
		name: pname 
	}; 
} 

pattern("go to $document $queue", '/Declarations', [ 
	param('filter by $contract name', "contractname") 
]);
