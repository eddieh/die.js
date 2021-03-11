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
<% block('head') %><link href="first-head"><% end('head') %>
</head>
<body>
<% include('header') %>
<% block('body') %><p>First body.</p><% end('body') %>
</body>
</html>`)

var tmpl6 = new Template(`
<% block('body') %>
<p>Body content.</p>
<% end('body') %>
<% block('head') %>
<link rel="stylesheet" href="style.css">
<% end('head') %>`)

var tmpl7 = new Template([tmpl5.body, tmpl6.body])
console.log(tmpl7({
    site: { title: 'My Blog' },
    page: { title: 'First Post!' }
}))
