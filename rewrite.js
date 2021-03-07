/*
 * // give us a function that can be applied to a scope
 * var template = new Template(body)
 *
 * // invoke the function with arg as scope
 * template(arg)
 */

/*(function () {*/ {
    var interpolate = /<%=([\s\S]+?)%>/g
    var comment = /<%#([\s\S]+?)%>/g
    var escape = /<%-([\s\S]+?)%>/g
    var evaluate = /<%([\s\S]+?)%>/g

    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    }

    var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g

    function escapeChar(match) {
        return '\\' + escapes[match]
    }

    function scopeReplacer(stm, scope) {
        return stm.replace('@', scope + '.')
    }

    function magic(body) {
        let matcher = RegExp([
            interpolate.source,
            comment.source,
            escape.source,
            evaluate.source,
        ].join('|') + '|$', 'g')

        let idx = 0
        let _body = ""

        // __$r0 return string
        // __$s0 first scope
        // __$f0 functions in scope
        _body += "let __$r0 = ''" + "\n"
        _body += "let __$s0 = arguments[0]" + "\n"
        _body += "let __$f0 = {}" + "\n"

        for (let bname of Object.keys(Template.builtins))
            _body += "\n__$f0." + bname + " = Template.builtins." + bname

        _body += "\n"
        body.replace(matcher, function (m, i, c, _e, e, o) {
            _body += "\n/* ｃｏｐｙ */\t\t"
            _body += "__$r0 += '"
            _body += body.slice(idx, o).replace(escapeRegExp, escapeChar)
            _body += "'"

            idx = o + m.length

            if (e) {
                _body += "\n/* ｅｖａｌ */\t\t"
                _body += scopeReplacer(e, '__$s0')
            } else if (i) {
                _body += "\n/* ｉｎｔｐ */\t\t"
                _body += "__$r0 += '' + __$f0.put(" + i + ")"
            } else if (c) {
                _body += "\n/* ｃｏｍｍ */\t\t"
            } else if (_e) {
                _body += "\n/* ｅｓｃｐ */\t\t"
                _body += "__$r0 += '' + __$f0.escape(" + _e + ")"
            }

            return m
        })
        _body += "\n"
        _body += "\nreturn __$r0\n"

        return _body
    }

    class Template extends Function {
        static templates = {}
        static builtins = {}
        constructor(name, body) {
            if (body === undefined) {
                body = name;
                name = undefined
            }
            let _body = magic(body)
            super(_body)
            this.body = body
            this.fname = name
            Template.templates[name] = this
        }
    }

    Template.builtins.put = function(a) { return a ? '' + a : '' }
    Template.builtins.escape = function() { return '' }

    window.Template = Template
    /*return Template
}).call(this)*/
}

let body1 = `<% for (let item of @items) { %>
<p><%= item %></p>
<% } %>`

console.log(magic(body1))

var tmpl1 = new Template(body1)
console.log(tmpl1({ items: [10, 20, 30] }))

console.log(tmpl1({ items: [10, 20, 30] }) == `
<p>10</p>

<p>20</p>

<p>30</p>
`)
