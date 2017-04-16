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

