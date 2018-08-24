import { deepStrictEqual as dse } from 'assert';

import {
    InlineTokenMap,
    BlockTokenMap,
    TokenType,

    InlineNormal,
    BlockNormal,

    InlineGfmBreaks,
    BlockGfmTables,

    ContextMap,

    init, parse,

    MetaHeadings,
    MetaLinks,

    BlockTag,
    InlineTag,
    BlockAlign
} from '../../src/index';

interface Meta extends MetaHeadings, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export default function() {
    describe('normal', () => {
        const parser = init<Context>(...BlockNormal, ...InlineNormal);
        const _ = (d: string, s: string, m: Meta, r: TokenType<BlockToken>[]) => it(d, () => dse(parse(parser, s), [m, r]));

        describe('paragraph', () => {
            _('simple', `Simple and short paragraph`,
                { h: [], l: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "Simple and short paragraph" }
                        ]
                    }
                ]);
            _('simple with space', `Simple and short paragraph with space
`,
                { h: [], l: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "Simple and short paragraph with space" }
                        ]
                    }
                ]);
            _('multiline', `The first line
and the second`,
                { h: [], l: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "The first line\nand the second" }
                        ]
                    }
                ]);
            _('multiline with space', `The first line
and the second with space
`,
                { h: [], l: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "The first line\nand the second with space" }
                        ]
                    }
                ]);
            _('two paragraphs', `The first paragraph

And the second
one`,
                { h: [], l: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "The first paragraph" }
                        ]
                    },
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "And the second\none" }
                        ]
                    }
                ]);
        });

        describe('headings', () => {
            _('simple h1', `# Simple heading`, {
                h: [{ t: "Simple heading", n: 1 }], l: {}
            }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: [{ $: InlineTag.Text, _: "Simple heading" }] }
                ]);

            _('simple h2', `## Simple heading`, {
                h: [{ t: "Simple heading", n: 2 }], l: {}
            }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: [{ $: InlineTag.Text, _: "Simple heading" }] }
                ]);

            _('simple line h1', `Simple heading
===`, {
                    h: [{ t: "Simple heading", n: 1 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: [{ $: InlineTag.Text, _: "Simple heading" }] }
                ]);

            _('simple line h2', `Simple heading
------`, {
                    h: [{ t: "Simple heading", n: 2 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: [{ $: InlineTag.Text, _: "Simple heading" }] }
                ]);

            _('multiline', `### Multiline
heading`, {
                    h: [{ t: "Multiline", n: 3 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 3, _: [{ $: InlineTag.Text, _: "Multiline" }] },
                    { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: "heading" }] }
                ]);

            _('spaced', `#### Simple heading
`, {
                    h: [{ t: "Simple heading", n: 4 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 4, _: [{ $: InlineTag.Text, _: "Simple heading" }] }
                ]);

            _('multiple identical', `## First heading
## Second one`, {
                    h: [{ t: "First heading", n: 2 }, { t: "Second one", n: 2 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: [{ $: InlineTag.Text, _: "First heading" }] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: [{ $: InlineTag.Text, _: "Second one" }] },
                ]);

            _('multiple different', `# First heading
## Second one`, {
                    h: [{ t: "First heading", n: 1 }, { t: "Second one", n: 2 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: [{ $: InlineTag.Text, _: "First heading" }] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: [{ $: InlineTag.Text, _: "Second one" }] },
                ]);

            _('multiple with paragraphs', `### First heading

First paragraph

## Second one

Next
paragraph`, {
                    h: [{ t: "First heading", n: 3 }, { t: "Second one", n: 2 }], l: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 3, _: [{ $: InlineTag.Text, _: "First heading" }] },
                    { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: "First paragraph" }] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: [{ $: InlineTag.Text, _: "Second one" }] },
                    { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: "Next\nparagraph" }] }
                ]);
        });

        describe('blockquote', () => {
            _('simple', `>Block quote`, { h: [], l: {} }, [
                {
                    $: BlockTag.Quote, _: [
                        { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Block quote' }] }
                    ]
                }
            ]);

            _('spaced', `> Block quote`, { h: [], l: {} }, [
                {
                    $: BlockTag.Quote, _: [
                        { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Block quote' }] }
                    ]
                }
            ]);

            _('multiline', `>Block quote
>next line
>and more...`, { h: [], l: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Block quote\nnext line\nand more...' }] }
                        ]
                    }
                ]);

            _('multiline spaced', `> Block quote
> next line
>  and more...`, { h: [], l: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Block quote\nnext line\n and more...' }] }
                        ]
                    }
                ]);

            _('nested', `>Block quote
>>nested block quote
>>>and next nested`, { h: [], l: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Block quote' }] },
                            {
                                $: BlockTag.Quote, _: [
                                    { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'nested block quote' }] },
                                    {
                                        $: BlockTag.Quote, _: [
                                            { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'and next nested' }] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]);
        });

        describe('def links', () => {
            _('simple', `[Def Link]

[Def Link]: http://example.com/`, {
                    h: [], l: {
                        "def link": {
                            l: "http://example.com/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: [{ $: InlineTag.Text, _: "Def Link" }] }
                        ]
                    }
                ]);

            _('with title in double quotes', `[Def Link]

[Def Link]: http://example.com/ "Link title"`, {
                    h: [], l: {
                        "def link": {
                            l: "http://example.com/",
                            t: "Link title"
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: [{ $: InlineTag.Text, _: "Def Link" }] }
                        ]
                    }
                ]);

            _('with title in paren', `[Def Link]

[Def Link]: http://example.com/ (Link title)`, {
                    h: [], l: {
                        "def link": {
                            l: "http://example.com/",
                            t: "Link title"
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: [{ $: InlineTag.Text, _: "Def Link" }] }
                        ]
                    }
                ]);

            _('single', `[This link][1]

[1]: http://example.com/`, {
                    h: [], l: {
                        "1": {
                            l: "http://example.com/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "1", _: [{ $: InlineTag.Text, _: "This link" }] }
                        ]
                    }
                ]);

            _('multiple', `[Some link][some] [Other link][-other-]

 [some]: http://somewhere.tld/path/to
 [-other-]:https://another.tld/
`, {
                    h: [], l: {
                        some: {
                            l: "http://somewhere.tld/path/to",
                            t: undefined
                        },
                        "-other-": {
                            l: "https://another.tld/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "some", _: [{ $: InlineTag.Text, _: "Some link" }] },
                            { $: InlineTag.Text, _: " " },
                            { $: InlineTag.Link, l: "-other-", _: [{ $: InlineTag.Text, _: "Other link" }] }
                        ]
                    }
                ]);

            _('multiple same', `[Some link][some] [Other link][some]

 [some]: http://somewhere.tld/path/to
 [-other-]:https://another.tld/`, {
                    h: [], l: {
                        some: {
                            l: "http://somewhere.tld/path/to",
                            t: undefined
                        },
                        "-other-": {
                            l: "https://another.tld/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "some", _: [{ $: InlineTag.Text, _: "Some link" }] },
                            { $: InlineTag.Text, _: " " },
                            { $: InlineTag.Link, l: "some", _: [{ $: InlineTag.Text, _: "Other link" }] }
                        ]
                    }
                ]);

            _('in blockquote', `> Link below
>[This link][ql]

[ql]: http://example.com/`, {
                    h: [], l: {
                        "ql": {
                            l: "http://example.com/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Quote, _: [
                            {
                                $: BlockTag.Paragraph, _: [
                                    { $: InlineTag.Text, _: "Link below\n" },
                                    { $: InlineTag.Link, l: "ql", _: [{ $: InlineTag.Text, _: "This link" }] }
                                ]
                            }
                        ]
                    }
                ]);

            _('in code', `Link below
[This link][ql]

    [ql]: http://example.com/
`, {
                    h: [], l: {}
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Text, _: "Link below\n[This link][ql]" },
                        ]
                    },
                    {
                        $: BlockTag.Code,
                        _: "[ql]: http://example.com/\n"
                    }
                ]);
        });

        describe('list', () => {
            _('unordered simple', `* Item 1
* Item 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('unordered loose item', `* Item 1

* Item 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('unordered multiline', `* Item 1
  Item 1 Line 2
* Item 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1\nItem 1 Line 2' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('unordered multiline loose', `* Item 1
  Item 1 Line 2

* Item 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 1\nItem 1 Line 2' }] }] },
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('unordered task', `* [ ] Task 1
* [x] Task 2
* [ ] Task 3
* Item 4`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { t: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 1' }] }] },
                            { t: 1, c: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 2' }] }] },
                            { t: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 3' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 4' }] }] }
                        ]
                    }
                ]);

            _('ordered simple', `1. Item 1
1. Item 2
1. Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('ordered with start', `2. Item 1
1. Item 2
1. Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, s: 2, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('ordered multiline', `1. Item 1
1. Item 2
   Item 2 Line 2
   Item 2 Line 3
1. Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2\nItem 2 Line 2\nItem 2 Line 3' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('ordered task', `1. [ ] Task 1
2. [x] Task 2
3. [ ] Task 3
4. Item 4`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { t: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 1' }] }] },
                            { t: 1, c: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 2' }] }] },
                            { t: 1, _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Task 3' }] }] },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 4' }] }] }
                        ]
                    }
                ]);

            _('unordered nested unordered', `* Item 1
* Item 2
  - Subitem 1
  - Subitem 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] },
                                    {
                                        $: BlockTag.List, _: [
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 1' }] }] },
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 2' }] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('unordered nested ordered', `* Item 1
* Item 2
  1. Subitem 1
  2. Subitem 2
* Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] },
                                    {
                                        $: BlockTag.OrdList, _: [
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 1' }] }] },
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 2' }] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('ordered nested ordered', `1. Item 1
2. Item 2
  1. Subitem 1
  2. Subitem 2
3. Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] },
                                    {
                                        $: BlockTag.OrdList, _: [
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 1' }] }] },
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 2' }] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);

            _('ordered nested unordered', `1. Item 1
1. Item 2
  * Subitem 1
  * Subitem 2
1. Item 3`, { h: [], l: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 1' }] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 2' }] },
                                    {
                                        $: BlockTag.List, _: [
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 1' }] }] },
                                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Subitem 2' }] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Item 3' }] }] },
                        ]
                    }
                ]);
        });

        describe('code', () => {
            _('empty line at end', `    code block
    
regular text`,
                { l: {}, h: [] }, [
                    { $: BlockTag.Code, _: 'code block\n\n' },
                    { $: BlockTag.Paragraph, _: [{ $: InlineTag.Text, _: 'regular text' }] }
                ]);
        });
    });

    describe('gfm', () => {
        const parser = init<Context>(...BlockGfmTables, ...InlineGfmBreaks);
        const _ = (d: string, s: string, m: Meta, r: TokenType<BlockToken>[]) => it(d, () => dse(parse(parser, s), [m, r]));

        describe('tables', () => {
            _('simple piped', `| Col 1 | Col 2 | Col 3 |
|---|----|---|
| 1,1 | 1 2 | 1:3 |
| 2 1 | 2:2 | 2;3 |`, { l: {}, h: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 1' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 2' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 3' }] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1,1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1 2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1:3' }] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2 1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2:2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2;3' }] }]
                            ]
                        ]
                    }
                ]);

            _('simple non-piped', `Col 1 | Col 2 | Col 3
---|----|---
1,1 | 1 2 | 1:3
2 1 | 2:2 | 2;3`, { l: {}, h: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 1' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 2' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 3' }] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1,1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1 2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1:3' }] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2 1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2:2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2;3' }] }]
                            ]
                        ]
                    }
                ]);

            _('piped short', `|1|2|
|-|-|
| |2|`, { l: {}, h: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2' }] }]
                        ],
                        _: [
                            [
                                [],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2' }] }]
                            ]
                        ]
                    }
                ]);

            _('piped with align', `| Col 1 | Col 2 | Col 3 |
|:--|:--:|--:|
| 1,1 | 1 2 | 1:3 |
| 2 1 | 2:2 | 2;3 |`, { l: {}, h: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.Left, BlockAlign.Center, BlockAlign.Right],
                        h: [
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 1' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 2' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 3' }] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1,1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1 2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1:3' }] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2 1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2:2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2;3' }] }]
                            ]
                        ]
                    }
                ]);

            _('non-piped with align', `Col 1 | Col 2 | Col 3
:--|:--:|--:
1,1 | 1 2 | 1:3
2 1 | 2:2 | 2;3`, { l: {}, h: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.Left, BlockAlign.Center, BlockAlign.Right],
                        h: [
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 1' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 2' }] }],
                            [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: 'Col 3' }] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1,1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1 2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '1:3' }] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2 1' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2:2' }] }],
                                [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: '2;3' }] }]
                            ]
                        ]
                    }
                ]);
        });
    });
}
