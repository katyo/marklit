# Marklit modern markdown parser in TypeScript

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/marklit.svg)](https://badge.fury.io/js/marklit)
[![npm downloads](https://img.shields.io/npm/dm/marklit.svg)](https://www.npmjs.com/package/marklit)
[![Build Status](https://travis-ci.org/katyo/marklit.svg?branch=master)](https://travis-ci.org/katyo/marklit)

**WARNING**: WIP (This work in progress and not ready for production now.)

Originally this project is deeply re-engineered fork of __[marked]__ with conceptual differences.

## Key features

* Parsing result is abstract document tree what allows advanced intermediate processing and non-string rendering
* Extensible architecture which allows adding new parsing rules and document tree element types
* Strictly typed design which allows to use full power of typescript to avoid runtime errors
* Progressive parser core implementation what gives maximum possible parsing speed

### HTML support

The HTML doesn't supported at the moment, but it will be added in future.

## Basic ideas

### Abstract document tree

Traditionally markdown parsers generates HTML as result.
This is simple but not so useful in most advanced usecases.
By example, when you need intermediate processing or direct rendering to DOM tree, the ADT is much more conveniently.

The **marklit** ADT is a JSON tree of _block_ and _inline_ elements called **tokens**.
Each token is a simple object with `$` field as tag, optional `_` field with list of sub-tokens, and optionally several other token type specific fields which called properties.

__TODO__: Document tree examples.

### Extensibility

The architecture of **marked** does not allows you to add new rules. You may only modify regexps of existing rules and write your own string-based renderer.

The **[marked-ast]** partially solves the problem of renderer but still doesn't allows add new rules.

The **[simple-markdown]** from Khan academy have good extensibility but it is not so fast parser as marked.

Because one of important goal of this project is parsing speed it required solution, which gives extensibility without worsening of speed.

### Type-safety

As conceived the abstract document tree must be is strictly typed itself.
But because __TypeScript__ doesn't yet support circular type referencing, the token type infering cannot be implemented now.
So you need a little bit of handwork with types here.

### Speedup parsing

The __marked__ iterates over matching regexps for each rules until first match occured. It's not so fast as it can be because JS engine does multiple matching for multiple regexps.

The __marklit__ constructs single regexp using all rules to do matching for all rules at once. This technique moves workload from JS side to embedded RegExp engine.

#### Benchmarking

Because the operation flow of marklit includes ADT stage it is too differs from other md-to-html parsers so the benchmarking won't give comparable results.

[markdown]: https://www.markdownguide.org/
[marked]: https://marked.js.org/
[marked-ast]: https://github.com/pdubroy/marked-ast
[simple-markdown]: https://github.com/Khan/simple-markdown
