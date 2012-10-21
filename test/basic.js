$(document).ready(function() {

  var templateSettings;

  module("Basic", {

    setup: function() {
      function clone (source) {
        var obj = {};
        for (var prop in source) {
          obj[prop] = source[prop];
        }
        return obj;
      }
      templateSettings = clone(Die.templateSettings);
    },

    teardown: function() {
      Die.templateSettings = templateSettings;
    }

  });

  test("comments", function () {
    var basicComment = Die.compile("<%# you don't see me %> hopefully true");
    var result = basicComment();
    equal(result, " hopefully true", 'basic comment ignored properly');

    var commentInterpolate = Die.compile("<%#= thing %> is getting to me");
    equal(commentInterpolate({thing: 'This'}),
          " is getting to me", 'comment short circuts interpolate tag');

    var commentWrapsTag =
          Die.compile("<%# <%= thing %> is just not there %>");
    equal(commentWrapsTag({thing: 'This'}),
          "", 'comment wraps a tag');

  });

  /* should this work? */
  // test("delimiter in substring", function () {
  //   var delimiterInSubstr = Die.compile("<%= print('%>') %>");
  //   equal(delimiterInSubstr(),
  //         "%>", 'handles delimiter in substring');
  // });

  test("Die.escape", function() {
    equal(Die.escape("Curly & Moe"), "Curly &amp; Moe");
    equal(Die.escape("Curly &amp; Moe"), "Curly &amp;amp; Moe");
    equal(Die.escape(null), '');
  });

  test("Die.unescape", function() {
    var string = "Curly & Moe";
    equal(Die.unescape("Curly &amp; Moe"), string);
    equal(Die.unescape("Curly &amp;amp; Moe"), "Curly &amp; Moe");
    equal(Die.unescape(null), '');
    equal(Die.unescape(Die.escape(string)), string);
  });

  test("template", function() {
    var basicTemplate = Die.compile("<%= thing %> is gettin' on my noives!");
    var result = basicTemplate({thing : 'This'});
    equal(result, "This is gettin' on my noives!", 'can do basic attribute interpolation');

    var sansSemicolonTemplate = Die.compile("A <% this %> B");
    equal(sansSemicolonTemplate(), "A  B");

    var backslashTemplate = Die.compile("<%= thing %> is \\ridanculous");
    equal(backslashTemplate({thing: 'This'}), "This is \\ridanculous");

    var escapeTemplate = Die.compile('<%= a ? "checked=\\"checked\\"" : "" %>');
    equal(escapeTemplate({a: true}), 'checked="checked"', 'can handle slash escapes in interpolations.');

    var fancyTemplate = Die.compile("<ul><% \
      for (key in people) { \
    %><li><%= people[key] %></li><% } %></ul>");
    result = fancyTemplate({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    // var escapedCharsInJavascriptTemplate = Die.compile("<ul><% Die.each(numbers.split('\\n'), function(item) { %><li><%= item %></li><% }) %></ul>");
    // result = escapedCharsInJavascriptTemplate({numbers: "one\ntwo\nthree\nfour"});
    // equal(result, "<ul><li>one</li><li>two</li><li>three</li><li>four</li></ul>", 'Can use escaped characters (e.g. \\n) in Javascript');

    // var namespaceCollisionTemplate = Die.compile("<%= pageCount %> <%= thumbnails[pageCount] %> <% Die.each(thumbnails, function(p) { %><div class=\"thumbnail\" rel=\"<%= p %>\"></div><% }); %>");
    // result = namespaceCollisionTemplate({
    //   pageCount: 3,
    //   thumbnails: {
    //     1: "p1-thumbnail.gif",
    //     2: "p2-thumbnail.gif",
    //     3: "p3-thumbnail.gif"
    //   }
    // });
    // equal(result, "3 p3-thumbnail.gif <div class=\"thumbnail\" rel=\"p1-thumbnail.gif\"></div><div class=\"thumbnail\" rel=\"p2-thumbnail.gif\"></div><div class=\"thumbnail\" rel=\"p3-thumbnail.gif\"></div>");

    var noInterpolateTemplate = Die.compile("<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");
    result = noInterpolateTemplate();
    equal(result, "<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");

    var quoteTemplate = Die.compile("It's its, not it's");
    equal(quoteTemplate({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("<%\
      if(foo == 'bar'){ \
    %>Statement quotes and 'quotes'.<% } %>");
    equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    var withNewlinesAndTabs = Die.compile('This\n\t\tis: <%= x %>.\n\tok.\nend.');
    equal(withNewlinesAndTabs({x: 'that'}), 'This\n\t\tis: that.\n\tok.\nend.');

    var template = Die.compile("<i><%- value %></i>");
    var result = template({value: "<script>"});
    equal(result, '<i>&lt;script&gt;</i>');

    var stooge = {
      name: "Moe",
      template: Die.compile("I'm <%= this.name %>")
    };
    equal(stooge.template(), "I'm Moe");

    if (!$.browser.msie) {
      var fromHTML = Die.compile($('#template').html());
      equal(fromHTML({data : 12345}).replace(/\s/g, ''), '<li>24690</li>');
    }

    Die.templateSettings = {
      evaluate: '{{',
      interpolate: '{{=',
      escape: '{{-',
      comment: '{{#',
      end: '}}'
    };

    var custom = Die.compile("<ul>{{ for (key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>");
    result = custom({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    var customQuote = Die.compile("It's its, not it's");
    equal(customQuote({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("{{ if(foo == 'bar'){ }}Statement quotes and 'quotes'.{{ } }}");
    equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    Die.templateSettings = {
      evaluate: '<?',
      interpolate: '<?=',
      escape: '<?-',
      comment: '<?#',
      end: '?>'
    };

    var customWithSpecialChars = Die.compile("<ul><? for (key in people) { ?><li><?= people[key] ?></li><? } ?></ul>");
    result = customWithSpecialChars({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    var customWithSpecialCharsQuote = Die.compile("It's its, not it's");
    equal(customWithSpecialCharsQuote({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("<? if(foo == 'bar'){ ?>Statement quotes and 'quotes'.<? } ?>");
    equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    Die.templateSettings = {
      evaluate: '{{#',
      interpolate: '{{',
      escape: '{{-',
      comment: '{{!',
      end: '}}'
    };

    var mustache = Die.compile("Hello {{planet}}!");
    equal(mustache({planet : "World"}), "Hello World!", "can mimic mustache.js");

    var templateWithNull = Die.compile("a null undefined {{planet}}");
    equal(templateWithNull({planet : "world"}), "a null undefined world", "can handle missing escape and evaluate settings");
  });

  test('Die.compile provides the generated function source, when a SyntaxError occurs', function() {
    try {
      Die.compile('<b><%= if %></b>');
    } catch (e) {
      ok(e.source.indexOf('( if )') > 0);
    }
  });

  test('Die.compile handles \\u2028 & \\u2029', function() {
    var tmpl = Die.compile('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
    strictEqual(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  });

  test('Die.compileSettings.variable', function() {
    var s = '<%=data.x%>';
    var data = {x: 'x'};
    strictEqual(Die.compile(s, data, {variable: 'data'}), 'x');
    Die.templateSettings.variable = 'data';
    strictEqual(Die.compile(s)(data), 'x');
  });

  test('#547 - Die.templateSettings is unchanged by custom settings.', function() {
    ok(!Die.templateSettings.variable);
    Die.compile('', {}, {variable: 'x'});
    ok(!Die.templateSettings.variable);
  });

  test('#556 - undefined template variables.', function() {
    var template = Die.compile('<%=x%>');
    strictEqual(template({x: null}), '');
    strictEqual(template({x: undefined}), '');

    var templateEscaped = Die.compile('<%-x%>');
    strictEqual(templateEscaped({x: null}), '');
    strictEqual(templateEscaped({x: undefined}), '');

    var templateWithProperty = Die.compile('<%=x.foo%>');
    strictEqual(templateWithProperty({x: {} }), '');
    strictEqual(templateWithProperty({x: {} }), '');

    var templateWithPropertyEscaped = Die.compile('<%-x.foo%>');
    strictEqual(templateWithPropertyEscaped({x: {} }), '');
    strictEqual(templateWithPropertyEscaped({x: {} }), '');
  });

  test('interpolate evaluates code only once.', 2, function() {
    var count = 0;
    var template = Die.compile('<%= f() %>');
    template({f: function(){ ok(!(count++)); }});

    var countEscaped = 0;
    var templateEscaped = Die.compile('<%- f() %>');
    templateEscaped({f: function(){ ok(!(countEscaped++)); }});
  });

  test('#746 - Die.compile settings are not modified.', 1, function() {
    var settings = {};
    Die.compile('', null, settings);
    deepEqual(settings, {});
  });

  test('#779 - delimeters are applied to unescaped text.', 1, function() {
    var template = Die.compile('<<\nx\n>>', null, {evaluate: /<<(.*?)>>/g});
    strictEqual(template(), '<<\nx\n>>');
  });

});
