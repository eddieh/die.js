/* ==========================================================
 * die.js v0.0.1
 * http://eddieh.bitbucket.org/diejs
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


  // Convenience functions
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

  // By default, Die uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters. Each
  // delimiter must be specified. Evaluate, interpolate, escape, and
  // comment are begin delimiters, while end terminates each of the
  // tags.
  Die.settings = {
    evaluate    : '<%',
    interpolate : '<%=',
    escape      : '<%-',
    comment     : '<%#',
    end         : '%>'
  };

  var tokens = [
    'TOKEN_EVALUATE',
    'TOKEN_INTERPOLATE',
    'TOKEN_ESCAPE',
    'TOKEN_COMMENT',
    'TOKEN_END'
  ];
  for (var i = 0; i < tokens.length; i++ ) {
    Die[tokens[i]] = i;
  }

  var tagDelimiters = {};

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

  // Die templating handles arbitrary delimiters,
  // preserves whitespace, and correctly escapes quotes within
  // interpolated code.
  Die.compile = function(text, name, settings) {
    settings = defaults({}, settings, Die.settings);

    tagDelimiters[settings.evaluate] = Die.TOKEN_EVALUATE;
    tagDelimiters[settings.interpolate] = Die.TOKEN_INTERPOLATE;
    tagDelimiters[settings.escape] = Die.TOKEN_ESCAPE;
    tagDelimiters[settings.comment] = Die.TOKEN_COMMENT;
    tagDelimiters[settings.end] = Die.TOKEN_END;

    var SPACE = 32,
        TAB = 9,
        NEWLINE = 10;

    var delimiters = keys(tagDelimiters);
    function parse(text, callback) {
      var idx = 0,
          line = 1,
          col = 1,
          ch = '',
          buffer = '',
          delimiterStack = [];

      while (true) {
        ch = text.charCodeAt(idx);

        if (!ch) {
          typeof callback === 'function' && callback(
            '',
            undefined, undefined, undefined, undefined,
            idx);
          return;
        }

        buffer += text[idx];

        if (ch == SPACE || ch == TAB) {
          idx++;
          col++;
          continue;
        }

        if (ch == NEWLINE) {
          idx++;
          line++;
          col = 1;
          continue;
        }

        for (var i = 0; i < delimiters.length; i++) {
          var d = delimiters[i];

          if (buffer.length >= d.length) {
            var possibleDelimiter = buffer.slice(-d.length);

            if (possibleDelimiter == d) {
              // unique delimiter match?
              if (text.length >= idx + 1) {
                possibleDelimiter += text[idx + 1];
                if (possibleDelimiter in tagDelimiters) {
                  break;
                }
              }

              var delimiterType = tagDelimiters[d];
              if (delimiterType == Die.TOKEN_END) {
                if (delimiterStack.length == 0) {
                  // TODO: displaying line number & column number
                  // would be sweet
                  throw new Error('End delimiter without begin?');
                }

                var last = delimiterStack.pop();
                if (delimiterStack.length == 0) {
                  var submatch = text.slice(last.offset + last.length,
                                            idx + 1 - d.length);
                  typeof callback === 'function' && callback(
                    text.slice(last.offset, idx + 1),
                    last.type == Die.TOKEN_COMMENT ? submatch : undefined,
                    last.type == Die.TOKEN_ESCAPE ? submatch : undefined,
                    last.type == Die.TOKEN_INTERPOLATE ? submatch : undefined,
                    last.type == Die.TOKEN_EVALUATE ? submatch : undefined,
                    last.offset);
                }
              } else {
                delimiterStack.push({
                  type: delimiterType,
                  content: d.slice(),
                  line: line,
                  col: col,
                  offset: idx + 1 - d.length,
                  length: d.length
                });
              }
              buffer = '';
            }
          }
        }

        idx++;
      }
    }

    // Compile the template source, escaping string literals
    // appropriately.
    var index = 0;
    var extCounter = 1;
    var cur = '$1';
    var blkStack = [];
    var blkDecls = 'var __r';
    var source = "var __t," +
          "__p=''," +
          "__j=Array.prototype.join," +
          "print=function(){__p+=__j.call(arguments,'');};\n" +
          "with(obj || {}){\n" +
          "//__EXTENSION\n" +
          "__p+='";
    var extTail = null;
    function preprocess(text) {
      var builtins = {
        'extends': /extends\s*\(\s*"([\s\S]+?)"\s*\)/g,
        'super': /(super\s*\(\s*\))/,
        'block': /block\s*\(\s*"([\s\S]+?)"\s*\)/g,
        'end': /end\s*\(\s*"([\s\S]+?)"\s*\)/g
      };
      var matcher = new RegExp([
        builtins['extends'].source,
        builtins['super'].source,
        builtins['block'].source,
        builtins['end'].source
      ].join('|') + '|$', 'g');
      var _index = 0;
      var _source ='';
      text.replace(matcher, function(match, ext, sup, blk, end, offset) {
        _source += text.slice(_index, offset);
        // .replace(escaper, function(m) {
        //   return '\\' + escapes[m];
        // });

        if (ext) {
          var template = Die.template(ext);
          var tmp = template.source.split('//__EXTENSION');
          source = tmp[0];
          extTail = tmp[1];
          extCounter = template._ec + 1;
          cur = '$' + extCounter;
        }

        function _super(n) {
          if (blkStack.length == 0)
            throw Error("Can't call super outside of block.");
          var blk = blkStack.pop();
          blkStack.push(blk);
          function __super(prev) {
            if (prev == 0) return '"";';
            return "typeof __" + blk + "$" +  prev + "==='function'?__" + blk + "$" + prev + "():" + __super(prev - 1);
          }
          return __super(n - 1);
        }

        if (blk) {
          blkStack.push(blk);
          blkDecls += ",__" + blk + "$entry";
        }
        if (end) blkStack.pop();

        _source +=
          sup ? "__p+=" + _super(extCounter) :
          blk ? ("function __" + blk + cur +"() {with(obj || {}){\n" +
                "var __t,__p='';") :
          end ? ("}return __p;}\n" +
                 "__" + end + "$entry=!__" + end +"$entry?__" + end + cur +":__" + end + "$entry;\n" +
                 "__p+=" + extCounter + "==1?__" + end + "$entry():'';") : '';

        _index = offset + match.length;
      });
      return _source;
    }
    parse(text, function(match, cmt, esc, interp, eval, offset) {
      // ignore content outside of blocks in all but the root template
      if (extCounter < 2 || blkStack.length != 0) {
        // copy from the end of the last match up to the beginning of
        // this match, this is the static text within the template
        source += text.slice(index, offset).replace(escaper, function(m) {
          return '\\' + escapes[m];
        });
      }

      // copy the significant portion of the match (the body of the
      // tag), this is JavaScript code to be executed, or a comment
      source +=
        cmt ? '' :
        esc ? "'+\n((__t=(" + esc + "))==null?'':Die.escape(__t))+\n'" :
        interp ? "'+\n((__t=(" + interp + "))==null?'':__t)+\n'" :
        eval ? "';\n" + preprocess(eval) + "\n__p+='" : '';

      index = offset + match.length;
    });
    if (extTail) source += "';" + blkDecls + ";" + extTail;
    else source += "';\n}" + blkDecls + ";return __p;\n";
    extTail = null;

    try {
      var render = new Function('obj', "Die", source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, Die);
    };

    // Provide the compiled function source as a convenience for
    // precompilation.
    //template.source = 'function(obj){\n' + source + '}';
    template.source = source;
    template._ec = extCounter;

    if (name) {
      if (!Die.Environment) Die.Environment = {};
      Die.Environment[name] = template;
    }

    return template;
  };

  Die.template = function (name) {
    if (name in Die.Environment) return Die.Environment[name];
    // TODO: should throw error
    return false;
  };

}).call(this);
