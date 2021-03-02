ready(function() {

  var settings;

  QUnit.module("Basic", {

    setup: function() {
      function clone (source) {
        var obj = {};
        for (var prop in source) {
          obj[prop] = source[prop];
        }
        return obj;
      }
      settings = clone(Die.settings);
    },

    teardown: function() {
      Die.settings = settings;
    }

  });

  QUnit.test("comments", function (assert) {
    var basicComment = Die.compile("<%# you don't see me %> hopefully true");
    var result = basicComment();
    assert.equal(result, " hopefully true", 'basic comment ignored properly');

    var commentInterpolate = Die.compile("<%#= thing %> is getting to me");
    assert.equal(commentInterpolate({thing: 'This'}),
          " is getting to me", 'comment short circuts interpolate tag');

    var commentWrapsTag =
          Die.compile("<%# <%= thing %> is just not there %>");
    assert.equal(commentWrapsTag({thing: 'This'}),
          "", 'comment wraps a tag');

  });

  /* should this work? */
  // QUnit.test("delimiter in substring", function () {
  //   var delimiterInSubstr = Die.compile("<%= print('%>') %>");
  //   equal(delimiterInSubstr(),
  //         "%>", 'handles delimiter in substring');
  // });

  QUnit.test("Die.escape", function(assert) {
    assert.equal(Die.escape("Curly & Moe"), "Curly &amp; Moe");
    assert.equal(Die.escape("Curly &amp; Moe"), "Curly &amp;amp; Moe");
    assert.equal(Die.escape(null), '');
  });

  QUnit.test("Die.unescape", function(assert) {
    var string = "Curly & Moe";
    assert.equal(Die.unescape("Curly &amp; Moe"), string);
    assert.equal(Die.unescape("Curly &amp;amp; Moe"), "Curly &amp; Moe");
    assert.equal(Die.unescape(null), '');
    assert.equal(Die.unescape(Die.escape(string)), string);
  });

  QUnit.test("template", function(assert) {
    var basicTemplate = Die.compile("<%= thing %> is gettin' on my noives!");
    var result = basicTemplate({thing : 'This'});
    assert.equal(result, "This is gettin' on my noives!", 'can do basic attribute interpolation');

    var sansSemicolonTemplate = Die.compile("A <% this %> B");
    assert.equal(sansSemicolonTemplate(), "A  B");

    var backslashTemplate = Die.compile("<%= thing %> is \\ridanculous");
    assert.equal(backslashTemplate({thing: 'This'}), "This is \\ridanculous");

    var escapeTemplate = Die.compile('<%= a ? "checked=\\"checked\\"" : "" %>');
    assert.equal(escapeTemplate({a: true}), 'checked="checked"', 'can handle slash escapes in interpolations.');

    var fancyTemplate = Die.compile("<ul><% \
      for (key in people) { \
    %><li><%= people[key] %></li><% } %></ul>");
    result = fancyTemplate({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    assert.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    var noInterpolateTemplate = Die.compile("<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");
    result = noInterpolateTemplate();
    assert.equal(result, "<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>");

    var quoteTemplate = Die.compile("It's its, not it's");
    assert.equal(quoteTemplate({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("<%\
      if(foo == 'bar'){ \
    %>Statement quotes and 'quotes'.<% } %>");
    assert.equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    var withNewlinesAndTabs = Die.compile('This\n\t\tis: <%= x %>.\n\tok.\nend.');
    assert.equal(withNewlinesAndTabs({x: 'that'}), 'This\n\t\tis: that.\n\tok.\nend.');

    var template = Die.compile("<i><%- value %></i>");
    var result = template({value: "<script>"});
    assert.equal(result, '<i>&lt;script&gt;</i>');

    var stooge = {
      name: "Moe",
      template: Die.compile("I'm <%= this.name %>")
    };
    assert.equal(stooge.template(), "I'm Moe");

    if (true /*!$.browser.msie*/ ) {
      //var fromHTML = Die.compile($('#template').html());
      //assert.equal(fromHTML({data : 12345}).replace(/\s/g, ''), '<li>24690</li>');
    }

    Die.settings = {
      evaluate: '{{',
      interpolate: '{{=',
      escape: '{{-',
      comment: '{{#',
      end: '}}'
    };

    var custom = Die.compile("<ul>{{ for (key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>");
    result = custom({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    assert.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    var customQuote = Die.compile("It's its, not it's");
    assert.equal(customQuote({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("{{ if(foo == 'bar'){ }}Statement quotes and 'quotes'.{{ } }}");
    assert.equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    Die.settings = {
      evaluate: '<?',
      interpolate: '<?=',
      escape: '<?-',
      comment: '<?#',
      end: '?>'
    };

    var customWithSpecialChars = Die.compile("<ul><? for (key in people) { ?><li><?= people[key] ?></li><? } ?></ul>");
    result = customWithSpecialChars({people : {moe : "Moe", larry : "Larry", curly : "Curly"}});
    assert.equal(result, "<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>", 'can run arbitrary javascript in templates');

    var customWithSpecialCharsQuote = Die.compile("It's its, not it's");
    assert.equal(customWithSpecialCharsQuote({}), "It's its, not it's");

    var quoteInStatementAndBody = Die.compile("<? if(foo == 'bar'){ ?>Statement quotes and 'quotes'.<? } ?>");
    assert.equal(quoteInStatementAndBody({foo: "bar"}), "Statement quotes and 'quotes'.");

    Die.settings = {
      evaluate: '{{#',
      interpolate: '{{',
      escape: '{{-',
      comment: '{{!',
      end: '}}'
    };

    var mustache = Die.compile("Hello {{planet}}!");
    assert.equal(mustache({planet : "World"}), "Hello World!", "can mimic mustache.js");

    var templateWithNull = Die.compile("a null undefined {{planet}}");
    assert.equal(templateWithNull({planet : "world"}), "a null undefined world", "can handle missing escape and evaluate settings");
  });

  QUnit.test('Die.compile provides the generated function source, when a SyntaxError occurs', function(assert) {
    try {
      Die.compile('<b><%= if %></b>');
    } catch (e) {
      assert.ok(e.source.indexOf('( if )') > 0);
    }
  });

  QUnit.test('Die.compile handles \\u2028 & \\u2029', function(assert) {
    var tmpl = Die.compile('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
    assert.strictEqual(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  });

  QUnit.test('#556 - undefined template variables.', function(assert) {
    var template = Die.compile('<%=x%>');
    assert.strictEqual(template({x: null}), '');
    assert.strictEqual(template({x: undefined}), '');

    var templateEscaped = Die.compile('<%-x%>');
    assert.strictEqual(templateEscaped({x: null}), '');
    assert.strictEqual(templateEscaped({x: undefined}), '');

    var templateWithProperty = Die.compile('<%=x.foo%>');
    assert.strictEqual(templateWithProperty({x: {} }), '');
    assert.strictEqual(templateWithProperty({x: {} }), '');

    var templateWithPropertyEscaped = Die.compile('<%-x.foo%>');
    assert.strictEqual(templateWithPropertyEscaped({x: {} }), '');
    assert.strictEqual(templateWithPropertyEscaped({x: {} }), '');
  });

  QUnit.test('interpolate evaluates code only once.'/*, 2*/, function(assert) {
    var count = 0;
    var template = Die.compile('<%= f() %>');
    template({f: function(){ assert.ok(!(count++)); }});

    var countEscaped = 0;
    var templateEscaped = Die.compile('<%- f() %>');
    templateEscaped({f: function(){ assert.ok(!(countEscaped++)); }});
  });

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

  // QUnit.test('Die.settings.variable', function() {
  //   var s = '<%=data.x%>';
  //   var data = {x: 'x'};
  //   strictEqual(Die.compile(s, data, {variable: 'data'}), 'x');
  //   Die.settings.variable = 'data';
  //   strictEqual(Die.compile(s)(data), 'x');
  // });

  // QUnit.test('#547 - Die.settings is unchanged by custom settings.', function() {
  //   ok(!Die.settings.variable);
  //   Die.compile('', {}, {variable: 'x'});
  //   ok(!Die.settings.variable);
  // });

  // QUnit.test('#746 - Die.compile settings are not modified.', 1, function() {
  //   var settings = {};
  //   Die.compile('', null, settings);
  //   deepEqual(settings, {});
  // });

  // QUnit.test('#779 - delimeters are applied to unescaped text.', 1, function() {
  //   var template = Die.compile('<<\nx\n>>', null, {evaluate: /<<(.*?)>>/g});
  //   strictEqual(template(), '<<\nx\n>>');
  // });

});
