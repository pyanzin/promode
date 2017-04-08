function Call(expr, params) {
	return {
		compile: function() {
			return expr.compile() + '(' + params.map(x => x.compile()).join(', ') + ')';
		}
	};
}

function Id(name) {
	return {
		compile: function() {
			return 'obj[\'' + name + '\']';
		}
	};
}

function Sum(left, right) {
	return {
		compile: function() {
			return left.compile() + ' + ' + right.compile();
		}
	};
}

function Slash(left, right) {
	return {
		compile: function() {
			return left.compile() + " + '/' + " + right.compile();
		}
	};
}

function Str(name) {
	return {
		compile: function() {
			return "'" + name + "'";
		}
	};
}

function Assign(left, expr) {
	return {
		compile: function() {
			return left.compile() + ' = ' + expr.compile();
		}
	};
}

function Func(stmts) {
	return {
            compile: function() {
                return '(function (obj, _value) { ' +
                    stmts.map(x => x.compile()).join(';\n') +
                    '; })';
        }
    };
}

function Underscore() {
    return {
        compile: function() {
            return '_value';
        }
    };
}

var ctx = {
	params: [],
	param: function(name, value) { return this.params[name] = value; },
	replace: function(str, from, to) { return str.replace(from, to); }
};

var funcText = Func([
	Assign(Id('x'), Sum(Str('a'), Sum(Str('b'), Str('c')))), 
	Assign(Id('x'), Call(Id('replace'), [Id('x'), Str('a'), Str('e')]))
]);