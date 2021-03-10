/*
 * // give us a function that can be applied to a scope
 * var template = new Template(body)
 *
 * // invoke the function with arg as scope
 * template(arg)
 */

var Template = (function () {
    const DEBUG_COMPILE = true

    var interpolate = /<%=([\s\S]+?)%>/g
    var comment = /<%#([\s\S]+?)%>/g
    var escape = /<%-([\s\S]+?)%>/g
    var evaluate = /<%([\s\S]+?)%>/g

    var matcher = RegExp([
        interpolate.source,
        comment.source,
        escape.source,
        evaluate.source,
    ].join('|') + '|$', 'g')

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

    function env() {
        return '@: ' + JSON.stringify(arguments[0], null, 4)
    }

    function include(tmpl) {
        return Template.templates[tmpl]
    }

    var specialForms = {
        env: /(env)\([\s\S]*\)/g,
        include: /include\(([\s\S]+?)\)/g,
    }

    var specialMatcher = RegExp([
        specialForms.env.source,
        specialForms.include.source
    ].join('|') + '|$', 'g')

    function compile(body, depth) {
        let idx = 0
        let _body = ""

        if (depth === undefined)
            depth = 0

        // __$r# return string
        // __$s# scope
        // __$f# functions in scope
        function __return() { return '__$r' + depth }
        function __scope() { return '__$s' + depth }
        function __func() { return '__$f' + depth }

        _body += `let ${__return()} = ''` + "\n"
        _body += `let ${__scope()} = arguments[0]` + "\n"
        _body += `let ${__func()} = {}` + "\n"

        for (let bname of Object.keys(Template.builtins))
            _body += `\n${__func()}.${bname} = Template.builtins.${bname}`

        _body += "\n"
        body.replace(matcher, function (m, i, c, _e, e, o) {
            _body += "\n/* ｃｏｐｙ */\t\t"
            _body += `${__return()} += '`
            _body += body.slice(idx, o).replace(escapeRegExp, escapeChar)
            _body += "'"

            idx = o + m.length

            if (e) {

                // replace special forms
                let special = e
                let _special = ""
                let specialIdx = 0
                let matchedSpecial = false
                special.replace(specialMatcher, function(m, e, i, o) {
                    if (i) {
                        _special += `;${__return()} += `
                        _special += `${__func()}.include(${i}).apply(this, arguments)`
                        matchedSpecial = true
                    } else if (e) {
                        _special += `;${__return()} += `
                        _special += `${__func()}.env.apply(this, arguments)`
                        matchedSpecial = true
                    }
                    specialIdx = o + m.length
                    return m
                })

                if (matchedSpecial) {
                    _body += "\n/* ｓｐｅｃ */\t\t"
                    _body += `${_special}`
                 } else {
                    _body += "\n/* ｅｖａｌ */\t\t"
                    _body += scopeReplacer(e, __scope())
                 }
            } else if (i) {
                _body += "\n/* ｉｎｔｐ */\t\t"
                _body += `${__return()} += '' + ${__func()}.put(${scopeReplacer(i, __scope())})`
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
            let _body = compile(body)
            if (DEBUG_COMPILE)
                console.log(_body)
            super(_body)
            this.body = body
            this.fname = name
            Template.templates[name] = this
        }
    }

    Template.builtins.put = function(a) { return a ? '' + a : '' }
    Template.builtins.escape = function() { return '' }
    Template.builtins.env = env
    Template.builtins.include = include

    return Template
}).call(this)


let body1 = `<% for (let item of @items) { %>
<p><%= item %></p>
<% } %>`

var tmpl1 = new Template(body1)
console.log(tmpl1({ items: [10, 20, 30] }))

console.log(tmpl1({ items: [10, 20, 30] }) == `
<p>10</p>

<p>20</p>

<p>30</p>
`)

var tmpl2 = new Template('header', `<h1><%= @page.title %></h1>`)
var tmpl3 = new Template('page', `<html>
<head>
<title><%= @site.title %></title>
</head>
<body>
<% include('header') %>
<p>Body content.</p>
</body>
</html>`)

console.log(tmpl3({
    site: { title: 'My Blog' },
    page: { title: 'First Post!' }
}))

var tmpl4 = new Template(`<pre><% env() %></pre>`)
console.log(tmpl4({
    site: { title: 'My Blog' },
    page: { title: 'First Post!' }
}))

var tmpl5 = new Template(`<html>
<head>
<title><%= @site.title %></title>
<% block('head') %><% end('head') %>
</head>
<body>
<% include('header') %>
<% block('body') %><% end('body') %>
</body>
</html>`)


var tmpl6 = new Template(`
<% block('body') %>
<p>Body content.</p>
<% end('body') %>
<% block('head') %>
<link rel="stylesheet" href="style.css">
<% end('head') %>`)

//var tmpl7 = new Template([tmpl5.body, tmpl6.body])
