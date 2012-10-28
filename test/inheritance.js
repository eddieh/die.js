$(document).ready(function() {

  module("Inheritance", {

    setup: function() {
    },

    teardown: function() {
    }

  });

  test("Simple Inheritance", function () {
    Die.compile('<% block("content") %><% end("content") %>', 'base.html');
    var extTemplate = Die.compile('<% extends("base.html") %><% block("content") %>Hello<% end("content") %>');
    var result = extTemplate();
    equal(result, "Hello", 'inheritance with trivial content block');

    Die.compile('Hello <% block("content") %><% end("content") %>,', 'base.html');
    var extTemplate2 = Die.compile('<% extends("base.html") %><% block("content") %>Eddie<% end("content") %>');
    var result2 = extTemplate2();
    equal(result2, "Hello Eddie,", 'inheritance with content in base template');
    Die.compile('Block <% block("b1") %><% end("b1") %> and block ' +
                '<% block("b2") %><% end("b2") %>.', 'base.html');
    var multipleBlocks = Die.compile('<% extends("base.html") %>' +
                                     '<% block("b1") %>One<% end("b1") %>' +
                                     '<% block("b2") %>Two<% end("b2") %>');
    var result3 = multipleBlocks();
    equal(result3, "Block One and block Two.", 'multiple blocks');
  });

  test("Super Blocks", function () {
    Die.compile('<% block("b") %>Super <% end("b") %>', 'base.html');
    var superBlock = Die.compile('<% extends("base.html") %>' +
      '<% block("b") %><% super() %>block.<% end("b") %>');
    var result = superBlock();
    equal(result, "Super block.", "simple super block");

    Die.compile('a<% block("b") %>c<% end("b") %>e', 'base.html');
    var superBlock2 = Die.compile('<% extends("base.html") %>' +
      '<% block("b") %>b<% super() %>d<% end("b") %>');
    var result2 = superBlock2();
    equal(result2, "abcde", "super block with surrounding text");
  });

  test("Overriding blocks", function () {
    Die.compile('<% block("b1") %>One<% end("b1") %> ' +
                '<% block("b2") %><% end("b2") %>', 'base');
    var template = Die.compile('<% extends("base") %>' +
                               '<% block("b2") %>two<% end("b2") %>');
    equal(template(), "One two", "child template doesn't override block in parent template");
  });

  test("Inheritance chains", function () {
    Die.compile('<% block("b1") %><% end("b1") %>' +
                '<% block("b2") %><% end("b2") %>' +
                '<% block("b3") %><% end("b3") %>', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>one<% end("b1") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b2") %> two <% end("b2") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b3") %>three<% end("b3") %>');
    equal(template(), "one two three", "simple inheritance chain");

    Die.compile('<% block("b1") %><% end("b1") %>' +
                '<% block("b3") %><% end("b3") %>', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>one<% end("b1") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b2") %> two <% end("b2") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b3") %>three<% end("b3") %>');
    equal(template(),
          "onethree",
          "block not defined in first base is ignored");

    Die.compile('<% block("b1") %><% end("b1") %>' +
                '<% block("b2") %><% end("b2") %>' +
                '<% block("b3") %><% end("b3") %>', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>1one<% end("b1") %>' +
                '<% block("b2") %> 1two <% end("b2") %>' +
                '<% block("b3") %>1three<% end("b3") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b1") %>2one<% end("b1") %>' +
                '<% block("b2") %> 2two <% end("b2") %>' +
                '<% block("b3") %>2three<% end("b3") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b1") %>3one<% end("b1") %>' +
                               '<% block("b2") %> 3two <% end("b2") %>' +
                               '<% block("b3") %>3three<% end("b3") %>',
                               'base3');
    equal(template(),
          "3one 3two 3three",
          "template takes content from last extention in chain to declare block");

    Die.compile('<% block("b1") %><% end("b1") %>' +
                '<% block("b2") %><% end("b2") %>' +
                '<% block("b3") %><% end("b3") %>', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>1one<% end("b1") %>' +
                // b2 not declared in base1
                '<% block("b3") %>1three<% end("b3") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b1") %>2one<% end("b1") %>' +
                '<% block("b2") %> 2two <% end("b2") %>' +
                '<% block("b3") %>2three<% end("b3") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b1") %>3one<% end("b1") %>' +
                               '<% block("b2") %> 3two <% end("b2") %>' +
                               '<% block("b3") %>3three<% end("b3") %>',
                               'base3');
    equal(template(),
          "3one 3two 3three",
          "template takes content from last extention in chain to declare block and some child doesn't override a block");

    Die.compile('<% block("b1") %><% end("b1") %>' +
                '<% block("b2") %> a <% end("b2") %>' +
                '<% block("b3") %><% end("b3") %>', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>1one<% end("b1") %>' +
                '<% block("b2") %><% super() %>1two <% end("b2") %>' +
                '<% block("b3") %>1three<% end("b3") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b1") %>2one<% end("b1") %>' +
                '<% block("b2") %><% super() %>2two <% end("b2") %>' +
                '<% block("b3") %>2three<% end("b3") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b1") %>3one<% end("b1") %>' +
                               '<% block("b2") %><% super() %>3two <% end("b2") %>' +
                               '<% block("b3") %>3three<% end("b3") %>',
                               'base3');
    equal(template(),
          "3one a 1two 2two 3two 3three",
          "super blocks and inheritance chains");

    Die.compile('a<% block("b1") %><% end("b1") %>b' +
                'c<% block("b2") %><% end("b2") %>d' +
                'e<% block("b3") %><% end("b3") %>f', 'base');
    Die.compile('<% extends("base") %>' +
                '<% block("b1") %>1one<% end("b1") %>' +
                '<% block("b2") %> 1two <% end("b2") %>' +
                '<% block("b3") %>1three<% end("b3") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '<% block("b1") %>2one<% end("b1") %>' +
                '<% block("b2") %> 2two <% end("b2") %>' +
                '<% block("b3") %>2three<% end("b3") %>', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               '<% block("b1") %>3one<% end("b1") %>' +
                               '<% block("b2") %>3two<% end("b2") %>' +
                               '<% block("b3") %>3three<% end("b3") %>',
                               'base3');
    equal(template(),
          "a3onebc3twode3threef",
          "content outside of block of root template is preserved");

    Die.compile('a<% block("b1") %><% end("b1") %>b' +
                'c<% block("b2") %><% end("b2") %>d' +
                'e<% block("b3") %><% end("b3") %>f', 'base');
    Die.compile('<% extends("base") %>' +
                'XX<% block("b1") %>1one<% end("b1") %>' +
                '<% block("b2") %> 1two <% end("b2") %>AA' +
                '<% block("b3") %>1three<% end("b3") %>', 'base1');
    Die.compile('<% extends("base1") %>' +
                '44<% block("b1") %>2one<% end("b1") %>' +
                '<% block("b2") %> 2two <% end("b2") %>' +
                '<% block("b3") %>2three<% end("b3") %>55', 'base2');
    var template = Die.compile('<% extends("base2") %>' +
                               'GG<% block("b1") %>3one<% end("b1") %>' +
                               '<% block("b2") %>3two<% end("b2") %>' +
                               'AA<% block("b3") %>3three<% end("b3") %>GN',
                               'base3');
    equal(template(),
          "a3onebc3twode3threef",
          "content outside of block in child template should be ignored");
  });

  // nested blocks
});
