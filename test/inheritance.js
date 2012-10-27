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

  // inheritance chain

  // inheritance chain where some child doesn't override a block

  // nested blocks
});
