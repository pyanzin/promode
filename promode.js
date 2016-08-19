$(function () {
    function keyPress(e) {
        var evtobj = window.event ? event : e;

        if (evtobj.keyCode == 81 && evtobj.ctrlKey) {
            $('#promode').css('display', 'block');
            $('#qnav-input').focus();
        }

        if (e.which === 27) {
            $('#qnav-input').val('');
            $('#promode').css('display', 'none');
        }
    }

    document.onkeydown = keyPress;
});

function Host(s, host) {
    var re = /\$(\w{1})/g;
    var keys = s.match(re);
    var prefix = "";
    var note = s;

    for (var i = 0; i < keys.length; i++) {
        var k = keys[i].slice(1, 2);
        prefix += k;
        note = note.replace(keys[i], '<b>' + k + '</b>');
    }

    var elem = $('<span class="qnav host">' + note + '</span>');
    return {
        elem: elem,
        match: function (p) {
            if (prefix == p) {
                elem.addClass('match');
                return host;
            } else {
                elem.removeClass('match');
                return null;
            };
        }
    };
}

function Path(s, path, params) {
    var re = /\$(\w{1})/g;
    var keys = s.match(re);
    var prefix = "";
    var note = s;

    for (var i = 0; i < keys.length; i++) {
        var k = keys[i].slice(1, 2);
        prefix += k;
        note = note.replace(keys[i], '<b>' + k + '</b>');
    }

    params = params || [];

    var elem = $('<span class="qnav path">' + note + '</span>');
    return {
        elem: elem,
        params: params,
        match: function (p) {
            if (prefix == p) {
                elem.addClass('match');
                return { path: path, params: params };
            } else {
                elem.removeClass('match');
                return null;
            };
        }
    };
}

function Param(s, param) {
    var re = /\$(\w{1})/g;
    var keys = s.match(re);
    var prefix = "";
    var note = s;

    for (var i = 0; i < keys.length; i++) {
        var k = keys[i].slice(1, 2);
        prefix += k;
        note = note.replace(keys[i], '<b>' + k + '</b>');
    }

    var elem = $('<span class="qnav param">' + note + '</span>');
    return {
        elem: elem,
        match: function (p) {
            if (p.startsWith(prefix)) {
                elem.addClass('match');
                return param + '=' + p.substring(prefix.length);
            } else {
                elem.removeClass('match');
                return null;
            };
        }
    };
}

function ontypeNew(c) {
    var result = {
        host: "",
        path: "",
        params: [],
        errors: []
    };

    c = c.trim();

    if (c.startsWith("/")) {
        qnav.newWindow = true;
        c = c.substring(1);
    } else {
        qnav.newWindow = false;
    }

    var pats = c.split(':');

    var hostPattern;
    var papPattern;

    if (pats.length === 1) {
        result.host = window.location.protocol + '//' + window.location.host;
        papPattern = pats[0];
    } else {
        qnav.newWindow = true;
        hostPattern = pats[0].trim();
        papPattern = pats[1].trim();

        var hostRes = qnav.hosts.map(function (host) { return host.match(hostPattern); }).filter(function (x) { return !!x; });
        if (hostRes.length === 0) {
            errors.push("Unknown host pattern: " + hostPattern);
        } else {
            result.host = hostRes[0];
        };
    };

    var pathAndParams = papPattern.split(' ').filter(function (x) { return !!x; });

    $('qnav-params').html('');

    if (pathAndParams.length > 0) {
        var pathPattern = pathAndParams[0];
        var pathRes = qnav.paths.map(function (path) { return path.match(pathPattern); }).filter(function (x) { return !!x; });

        var paramPatterns = pathAndParams.slice(1);

        var params = [];
        if (pathRes.length === 0) {
            result.errors.push("Unknown path pattern: " + pathPattern);
        } else {
            result.path = pathRes[0].path;
            params = pathRes[0].params;
        };

        for (var i = 0; i < params.length; i++) {
            params[i].elem.appendTo($('#qnav-params'));
        }

        for (var pi = 0; pi < paramPatterns.length; ++pi) {
            for (var i = 0; i < params.length; ++i) {
                var paramResult = null;
                if (paramResult = params[i].match(paramPatterns[pi]))
                    break;
            };
            if (!paramResult) {
                result.errors.push("Unknown parameter pattern: ", paramPatterns[pi]);
            } else {
                result.params.push(paramResult);
            };
        };
    };

    var url = result.host + '/' + result.path + '?' + result.params.join('&');
    qnav.url = url;
    $('#qnav-url').html(url);

    $('#qnav-errors').html('');
    for (var i = 0; i < result.errors.length; ++i) {
        $('#qnav-errors').append($('<div class="qnav-error">' + result.errors[i] + '</div>'));
    };

};

$(function () {
    $('body').append($('\
		<div id="promode" style="display: none"> \
		<div>Environments:</div> \
		<div id="qnav-hosts"> \
		</div> \
		<div>Paths:</div> \
		<div id="qnav-paths"> \
		</div> \
		<div>Parameters:</div> \
		<div id="qnav-params"> \
		</div> \
		<div style="text-align: center"> \
			<input id="qnav-input" type="text" oninput="ontypeNew(this.value)" /> \
		</div>			 \
		<div id="qnav-url"></div> \
		<div id="qnav-errors"></div>	 \
	</div>'));

    qnav = {};

    qnav.hosts = [];

    qnav.paths = [
		Path('$contract$s', 'Contract', [
			Param('filter by $name', 'name')
		]),

		Path('document $queue', 'DocumentQueue', [
			Param('filter by $contract name', 'contractname'),
			Param('filter by $document name', 'documentname')
		]),

		Path('go to $c$laims', 'Claim', [
			Param('filter by $contract name', 'contract')
		]),

		Path('$new $contract', 'Contract/Add'),

		Path('go to $mapping$s', 'Mapping', [
			Param('filter by $name', 'name')
		]),
		Path('$new $mapping', 'Mapping/Add')
    ];

    for (var i = 0; i < qnav.hosts.length; i++) {
        qnav.hosts[i].elem.appendTo($('#qnav-hosts'));
    }

    for (var i = 0; i < qnav.paths.length; i++) {
        qnav.paths[i].elem.appendTo($('#qnav-paths'));
    }

    $('#qnav-input').keypress(function (e) {
        if (e.which === 13 && qnav.url) {
            if (qnav.newWindow) {
                var win = window.open(qnav.url, '_blank');
                win.focus();
            } else {
                document.location.href = qnav.url;
            }

            //window.location.href = qnav.url;
        };


    });
});