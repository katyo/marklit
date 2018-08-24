# Marklit modern markdown parser in TypeScript

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/marklit.svg)](https://badge.fury.io/js/marklit)
[![npm downloads](https://img.shields.io/npm/dm/marklit.svg)](https://www.npmjs.com/package/marklit)
[![Build Status](https://travis-ci.org/katyo/marklit.svg?branch=master)](https://travis-ci.org/katyo/marklit)

**WARNING**: Ready for use with exceptions (missing HTML parsing rules)

Originally this project is deeply re-engineered fork of __[marked]__ with conceptual differences.

## Design goals

* Deep customizability
* Compile-time configuration
* Compact code size

## Key features

* Parsing result is abstract document tree what allows advanced intermediate processing and non-string rendering
* Extensible architecture which allows adding new parsing rules and document tree element types
* Strictly typed design which allows to use full power of typescript to avoid runtime errors
* Progressive parser core implementation what gives maximum possible parsing speed

### HTML support

The HTML doesn't supported at the moment, but it will be added in future.

## Usage tips

### Basic setup

Basically you need to do several things to get type-safe markdown parser and renderer.

#### Define types

First, you need define some types:

* Meta-data type
* Block token types map
* Inline token types map
* Context mapping type

See example below:

```typescript
import {
  MetaData,
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
} from 'marklit';

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, MetaData> { }
```

#### Init parser

Next, you can initialize parser:

```typescript
import {
  BlockNormal,
  InlineNormal,
  init,
  parse
} from 'marklit';

// initialize parser using normal parsing rules
const parser = init<Context>(...BlockNormal, ...InlineNormal);

// parse markdown to get abstract document tree
const adt = parse(parser, "markdown source string");
```

...and renderer:

```typescript
import {
  BlockHtml,
  InlineHtml,
  initRenderHtml,
  render
} from 'marklit';

// initialize renderer using basic HTML render rules
const renderer = initRenderHtml<Context>(...BlockHtml, ...InlineHtml);

// render abstract document tree to get HTML string
const html = render(renderer, adt);
```

#### All together

The example below shows complete configuration:

```typescript
import {
  MetaData,
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
  
  BlockNormal,
  InlineNormal,
  init,
  parse,
  
  BlockHtml,
  InlineHtml,
  initRenderHtml,
  render
} from 'marklit';

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, MetaData> { }

// initialize parser using normal parsing rules
const parser = init<Context>(...BlockNormal, ...InlineNormal);

// initialize renderer using basic HTML render rules
const renderer = initRenderHtml<Context>(...BlockHtml, ...InlineHtml);

// parse markdown to get abstract document tree
const adt = parse(parser, "markdown source string");

// render abstract document tree to get HTML string
const html = render(renderer, adt);
```

#### Github-flavored markdown

The next example shows configuration which uses GFM rules instead of normal:

```typescript
import {
  MetaData,
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
  
  BlockGfm,
  InlineGfm,
  init,
  parse,
  
  BlockTablesHtml,
  InlineGfmHtml,
  initRenderHtml,
  render
} from 'marklit';

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, MetaData> { }

// initialize parser using normal parsing rules
const parser = init<Context>(...BlockGfm, ...InlineGfm);

// initialize renderer using basic HTML render rules
const renderer = initRenderHtml<Context>(...BlockTablesHtml, ...InlineGfmHtml);

// parse markdown to get abstract document tree
const adt = parse(parser, "markdown source string");

// render abstract document tree to get HTML string
const html = render(renderer, adt);
```

### Using extensions

The programming design of __marklit__ allows to modify the behavior of any rules in order to extend parser and renderer.

An extensions includes rules and rule modifiers which allows deep customization.

#### Writing rulesets

You can override existing rules in rulesets like `BlockNormal`, `InlineNormal`, `BlockGfm` by appending modified rules.
Or you can create your own rulesets using existing or new rules.

The topics below shows how to customize behavior by using extensions:

#### GFM breaks

You can extend normal text rule to _GFM_ or _GFM with breaks_:

```typescript
import {
  TextSpan,
  gfmText,
  gfmBreaks,
} from 'marklit';

const GfmTextSpan = gfmText(TextSpan);
const GfmBreaksTextSpan = gfmBreaks(gfmText(TextSpan));
```

Or simply use existing GFM text rules:

```typescriot
import {
  GfmTextSpan,
  GfmBreaksTextSpan
} from 'marklit';
```

#### SmartyPants

You can add [smartypants] support to any text rule like this:

```typescript
import {
  BlockNormal,
  InlineNormal,
  
  BlockGfmTables,
  InlineGfm,

  TextSpan,
  GfmTextSpan,
  smartypantsText,
  
  init
} from 'marklit';

const SmartypantsTextSpan = smartypantsText(TextSpan);
const SmartypantsGfmTextSpan = smartypantsText(GfmTextSpan);

// Custom SmartypantsTextSpan rule overrides default TextSpan rule which comes from InlineNormal ruleset
const parser = init<Context>(...BlockNormal, ...InlineNormal, ...SmartypantsTextSpan);

// Custom SmartypantsGfmTextSpan rule overrides default GfmTextSpan rule which comes from InlineGfm ruleset
const parser = init<Context>(...BlockGfmTables, ...InlineGfm, ...SmartypantsGfmTextSpan);
```

#### Math extension

The mathematic extension includes two rules:

1. Inline math enclosed by `$` signs like an inline code (`MathSpan`)
2. Block math enclosed by series of `$` signs like a fenced code blocks (`MathBlock`)

You can use one of this rules or both together.

```typescript
import {
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
  
  BlockMath,
  InlineMath,
  
  BlockNormal,
  InlineNormal,
  
  MathBlock,
  MathSpan,
  
  init,
  parse,
  
  BlockHtml,
  InlineHtml,
  MathBlockHtml,
  MathSpanHtml,
  
  initHtmlRender,
  render
} from 'marklit';

// inline token with math
interface InlineToken extends InlineTokenMap<InlineToken>, InlineMath { }

// block token with math
interface BlockToken extends BlockTokenMap<BlockToken, InlineToken>, BlockMath { }

// inline context with math
interface InlineContext extends ContextMap<BlockToken, InlineToken, NoMeta> { }

// append math rules to normal rules
const parser = init<Context>(...BlockNormal, MathBlock, ...InlineNormal, MathSpan);

// append math rules to normal rules
const renderer = initRenderHtml<Context>(...BlockHtml, MathBlockHtml, InlineHtml, MathSpanHtml);

const adt = parse(parser, `
Inline formula $E = mc^2$

Block equation:

$$$.dot
graph {
    a -- b;
    b -- c;
    a -- c;
}
$$$
`);

const html = render(renderer, adt);
```

#### Abbreviations

The abbrevs extension consists of three parts:

1. Block rule (`AbbrevBlock`)
2. Text rule modifier (`abbrevText`)
3. Inline rule (`Abbrev`)

Usually you need first two rules to get automatic abbreviations.
The third rule adds extra forced abbreviations into inline context.

```typescript
import {
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
  
  InlineAbbrev,
  
  BlockNormal,
  InlineNormal,
  AbbrevBlock,
  Abbrev,
  TextSpan,
  abbrevText,
  
  init,
  parse,
  
  BlockHtml,
  InlineHtml,
  AbbrevHtml,
  
  initHtmlRender,
  render
} from 'marklit';

// inline token with abbrev
interface InlineToken extends InlineTokenMap<InlineToken>, InlineAbbrev { }

// normal block token
interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

// inline context with abbrev
interface InlineContext extends ContextMap<BlockToken, InlineToken, NoMeta> { }

// append abbrev rules to normal rules
const parser = init<Context>(...BlockNormal, AbbrevBlock, ...InlineNormal, Abbrev, abbrevText(TextSpan));

// append abbrev rules to normal rules
const renderer = initRenderHtml<Context>(...BlockHtml, InlineHtml, AbbrevHtml);

const adt = parse(parser, `The HTML specification
is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]:  World Wide Web Consortium
`);

const html = render(renderer, adt);
```

#### Footnotes

The footnotes extension includes two rules:

1. Inline footnote reference rule (`Footnote`)
2. Block footnotes block rule (`FootnotesBlock`)

You need use both rules to get working footnotes:

```typescript
import {
  InlineTokenMap,
  BlockTokenMap,
  ContextMap,
  
  InlineFootnote,
  BlockFootnotes,
  
  BlockNormal,
  InlineNormal,
  FootnotesBlock,
  Footnote,
  
  init,
  parse,
  
  BlockHtml,
  InlineHtml,
  FootnoteHtml,
  FootnotesBlockHtml,
  
  initHtmlRender,
  render
} from 'marklit';

// inline token with footnote refs
interface InlineToken extends InlineTokenMap<InlineToken>, InlineFootnote { }

// block token with footnotes list
interface BlockToken extends BlockTokenMap<BlockToken, InlineToken>, BlockFootnotes { }

// inline context with footnotes
interface InlineContext extends ContextMap<BlockToken, InlineToken, NoMeta> { }

// append footnote rules to normal rules
const parser = init<Context>(...BlockNormal, FootnotesBlock, ...InlineNormal, Footnote);

// append footnote rules to normal rules
const renderer = initRenderHtml<Context>(...BlockHtml, FootnotesBlockHtml, InlineHtml, FootnoteHtml);

const adt = parse(parser, `Footnotes[^1] have a label[^@#$%] and the footnote's content.

[^1]: This is a footnote content.
[^@#$%]: A footnote on the label: "@#$%".`);

const html = render(renderer, adt);
```

#### Inline footnotes

*TODO*:

#### Table of contents

*TODO*:

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
[smartypants]: https://daringfireball.net/projects/smartypants
