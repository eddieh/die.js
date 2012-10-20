/* ==========================================================
 * die.js v0.0.1
 * http://...
 * ==========================================================
 * Copyright 2012 Eddie Hillenbrand
 *
 * Licensed under the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * Die (n): a device for cutting or molding metal into a particular
 * shape. (an engraved device for stamping a design on coins or
 * medals) -- New Oxford American Dictionary 3rd edition © 2010 by
 * Oxford University Press, Inc.
 * ========================================================== */

(function() {
  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global`
  // on the server.
  var root = this;

  // Save the previous value of the `Die` variable.
  var previousDie = root.Die;

    // Create a safe reference to the Die object for use below.
  var Die = function(obj) {
    if (obj instanceof Die) return obj;
    if (!(this instanceof Die)) return new Die(obj);
    this.DieWrapped = obj;
  };

  // Export the Die object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `Die` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Die;
    }
    exports.Die = Die;
  } else {
    root['Die'] = Die;
  }

  // Current version.
  Die.VERSION = '0.0.1';


  // Convinence functions
  // --------------------

  var nativeForEach      = Array.prototype.forEach,
      nativeKeys         = Object.keys;

  // Establish the object that gets returned to break out of a loop
  // iteration.
  var breaker = {};

  // Shortcut function for checking if an object has a given property
  // directly on itself (in other words, not on a prototype).
  var has = function(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  };

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw
  // objects.  Delegates to **ECMAScript 5**'s native `forEach` if
  // available.
  var each = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Invert the keys and values of an object. The values must be
  // serializable.
  var invert = function(obj) {
    var result = {};
    for (var key in obj) if (has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  var keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Fill in a given object with default properties.
  var defaults = function(obj) {
    each(Array.prototype.slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML
  // interpolation.
  each(['escape', 'unescape'], function(method) {
    Die[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });


  // Templates
  // ---------

  // By default, Die uses ERB-style template delimiters, change
  // the following template settings to use alternative delimiters.
  Die.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define
  // an interpolation, evaluation or escaping regex, we need one that
  // is guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put
  // into a string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's
  // implementation.  Die templating handles arbitrary delimiters,
  // preserves whitespace, and correctly escapes quotes within
  // interpolated code.
  Die.template = function(text, data, settings) {
    settings = defaults({}, settings, Die.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals
    // appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, esc, interp, eval, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });
      source +=
        esc ? "'+\n((__t=(" + esc + "))==null?'':Die.escape(__t))+\n'" :
        interp ? "'+\n((__t=(" + interp + "))==null?'':__t)+\n'" :
        eval ? "';\n" + eval + "\n__p+='" : '';
      index = offset + match.length;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local
    // scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, Die);
    var template = function(data) {
      return render.call(this, data, Die);
    };

    // Provide the compiled function source as a convenience for
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source +
    '}';

    return template;
  };

}).call(this);
