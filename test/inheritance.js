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
  });
});