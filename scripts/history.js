function HistoryNamespace(name, entries) {
    return {
        _name: name,
        _entries: entries,
        getEntries: function() {
            return entries;
        },
        addEntry: function(value) {
            if (this._entries.includes(value))
                return;

            if (this._entries.length > 10)
                this._entries = this._entries.splice(1);
            this._entries.push(value);
        }
    };
}

function FreetypeHistory(storedModel) {
    if (typeof storedModel !== 'object')
        storedModel = JSON.parse(storedModel);

    var namespaces = {};

    getKeys(storedModel).forEach(function(x) {
        namespaces[x] = HistoryNamespace(x, storedModel[x]);
    });

    return {
        _namespaces: namespaces,
        getNamespace: function(name) {
            return namespaces[name] || HistoryNamespace(name, []);
        },
        makeModifier: function(nsName, valueToAdd) {
            return function(namespaces) {
                namespaces[nsName] = namespaces[nsName] || HistoryNamespace(nsName, []);
                var ns = namespaces[nsName];
                ns.addEntry(valueToAdd);
            }
        },
        applyModifier: function(m) {
            m(namespaces);
        },
        serialize: function() {
            var resultObj = {};
            getKeys(namespaces).forEach(function(x) {
                resultObj[x] = namespaces[x].getEntries();
            });
            return JSON.stringify(resultObj);
        }
    };
}
