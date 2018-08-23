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

interface Meta extends MetaHeadings<InlineToken>, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export default function() {
    describe('normal', () => {
        const parser = init<Context>(...BlockNormal, ...InlineNormal);
        const _ = (d: string, s: string, m: Meta, r: TokenType<BlockToken>[]) => it(d, () => dse(parse(parser, s), [m, r]));

        describe('paragraph', () => {
            _('simple', `Simple and short paragraph`,
                { headings: [], links: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "Simple and short paragraph"
                        ]
                    }
                ]);
            _('simple with space', `Simple and short paragraph with space
`,
                { headings: [], links: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "Simple and short paragraph with space"
                        ]
                    }
                ]);
            _('multiline', `The first line
and the second`,
                { headings: [], links: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "The first line\nand the second"
                        ]
                    }
                ]);
            _('multiline with space', `The first line
and the second with space
`,
                { headings: [], links: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "The first line\nand the second with space"
                        ]
                    }
                ]);
            _('two paragraphs', `The first paragraph

And the second
one`,
                { headings: [], links: {} }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "The first paragraph"
                        ]
                    },
                    {
                        $: BlockTag.Paragraph, _: [
                            "And the second\none"
                        ]
                    }
                ]);
        });

        describe('headings', () => {
            _('simple h1', `# Simple heading`, {
                headings: [{
                    t: "Simple heading",
                    n: 1,
                    _: ["Simple heading"]
                }], links: {}
            }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: ["Simple heading"] }
                ]);

            _('simple h2', `## Simple heading`, {
                headings: [{
                    t: "Simple heading",
                    n: 2,
                    _: ["Simple heading"]
                }], links: {}
            }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: ["Simple heading"] }
                ]);

            _('simple line h1', `Simple heading
===`, {
                    headings: [{
                        t: "Simple heading",
                        n: 1,
                        _: ["Simple heading"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: ["Simple heading"] }
                ]);

            _('simple line h2', `Simple heading
------`, {
                    headings: [{
                        t: "Simple heading",
                        n: 2,
                        _: ["Simple heading"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: ["Simple heading"] }
                ]);

            _('multiline', `### Multiline
heading`, {
                    headings: [{
                        t: "Multiline",
                        n: 3,
                        _: ["Multiline"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 3, _: ["Multiline"] },
                    { $: BlockTag.Paragraph, _: ["heading"] }
                ]);

            _('spaced', `#### Simple heading
`, {
                    headings: [{
                        t: "Simple heading",
                        n: 4,
                        _: ["Simple heading"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 4, _: ["Simple heading"] }
                ]);

            _('multiple identical', `## First heading
## Second one`, {
                    headings: [{
                        t: "First heading",
                        n: 2,
                        _: ["First heading"]
                    }, {
                        t: "Second one",
                        n: 2,
                        _: ["Second one"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 2, _: ["First heading"] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: ["Second one"] },
                ]);

            _('multiple different', `# First heading
## Second one`, {
                    headings: [{
                        t: "First heading",
                        n: 1,
                        _: ["First heading"]
                    }, {
                        t: "Second one",
                        n: 2,
                        _: ["Second one"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: ["First heading"] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: ["Second one"] },
                ]);

            _('multiple with paragraphs', `### First heading

First paragraph

## Second one

Next
paragraph`, {
                    headings: [{
                        t: "First heading",
                        n: 3,
                        _: ["First heading"]
                    }, {
                        t: "Second one",
                        n: 2,
                        _: ["Second one"]
                    }], links: {}
                }, [
                    { $: BlockTag.Heading, i: 0, n: 3, _: ["First heading"] },
                    { $: BlockTag.Paragraph, _: ["First paragraph"] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: ["Second one"] },
                    { $: BlockTag.Paragraph, _: ["Next\nparagraph"] }
                ]);
        });

        describe('blockquote', () => {
            _('simple', `>Block quote`, { headings: [], links: {} }, [
                {
                    $: BlockTag.Quote, _: [
                        { $: BlockTag.Paragraph, _: ['Block quote'] }
                    ]
                }
            ]);

            _('spaced', `> Block quote`, { headings: [], links: {} }, [
                {
                    $: BlockTag.Quote, _: [
                        { $: BlockTag.Paragraph, _: ['Block quote'] }
                    ]
                }
            ]);

            _('multiline', `>Block quote
>next line
>and more...`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: ['Block quote\nnext line\nand more...'] }
                        ]
                    }
                ]);

            _('multiline spaced', `> Block quote
> next line
>  and more...`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: ['Block quote\nnext line\n and more...'] }
                        ]
                    }
                ]);

            _('nested', `>Block quote
>>nested block quote
>>>and next nested`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.Quote, _: [
                            { $: BlockTag.Paragraph, _: ['Block quote'] },
                            {
                                $: BlockTag.Quote, _: [
                                    { $: BlockTag.Paragraph, _: ['nested block quote'] },
                                    {
                                        $: BlockTag.Quote, _: [
                                            { $: BlockTag.Paragraph, _: ['and next nested'] }
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
                    headings: [], links: {
                        "def link": {
                            l: "http://example.com/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: ["Def Link"] }
                        ]
                    }
                ]);

            _('with title in double quotes', `[Def Link]

[Def Link]: http://example.com/ "Link title"`, {
                    headings: [], links: {
                        "def link": {
                            l: "http://example.com/",
                            t: "Link title"
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: ["Def Link"] }
                        ]
                    }
                ]);

            _('with title in paren', `[Def Link]

[Def Link]: http://example.com/ (Link title)`, {
                    headings: [], links: {
                        "def link": {
                            l: "http://example.com/",
                            t: "Link title"
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "def link", _: ["Def Link"] }
                        ]
                    }
                ]);

            _('single', `[This link][1]

[1]: http://example.com/`, {
                    headings: [], links: {
                        "1": {
                            l: "http://example.com/",
                            t: undefined
                        }
                    }
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            { $: InlineTag.Link, l: "1", _: ["This link"] }
                        ]
                    }
                ]);

            _('multiple', `[Some link][some] [Other link][-other-]

 [some]: http://somewhere.tld/path/to
 [-other-]:https://another.tld/
`, {
                    headings: [], links: {
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
                            { $: InlineTag.Link, l: "some", _: ["Some link"] },
                            " ",
                            { $: InlineTag.Link, l: "-other-", _: ["Other link"] }
                        ]
                    }
                ]);

            _('multiple same', `[Some link][some] [Other link][some]

 [some]: http://somewhere.tld/path/to
 [-other-]:https://another.tld/`, {
                    headings: [], links: {
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
                            { $: InlineTag.Link, l: "some", _: ["Some link"] },
                            " ",
                            { $: InlineTag.Link, l: "some", _: ["Other link"] }
                        ]
                    }
                ]);

            _('in blockquote', `> Link below
>[This link][ql]

[ql]: http://example.com/`, {
                    headings: [], links: {
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
                                    "Link below\n",
                                    { $: InlineTag.Link, l: "ql", _: ["This link"] }
                                ]
                            }
                        ]
                    }
                ]);

            _('in code', `Link below
[This link][ql]

    [ql]: http://example.com/
`, {
                    headings: [], links: {}
                }, [
                    {
                        $: BlockTag.Paragraph, _: [
                            "Link below\n[This link][ql]",
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
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('unordered loose item', `* Item 1

* Item 2
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 1'] }] },
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('unordered multiline', `* Item 1
  Item 1 Line 2
* Item 2
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1\nItem 1 Line 2'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('unordered multiline loose', `* Item 1
  Item 1 Line 2

* Item 2
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 1\nItem 1 Line 2'] }] },
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Paragraph, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('unordered task', `* [ ] Task 1
* [x] Task 2
* [ ] Task 3
* Item 4`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { t: 1, _: [{ $: BlockTag.Text, _: ['Task 1'] }] },
                            { t: 1, c: 1, _: [{ $: BlockTag.Text, _: ['Task 2'] }] },
                            { t: 1, _: [{ $: BlockTag.Text, _: ['Task 3'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 4'] }] }
                        ]
                    }
                ]);

            _('ordered simple', `1. Item 1
1. Item 2
1. Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('ordered with start', `2. Item 1
1. Item 2
1. Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, s: 2, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 2'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('ordered multiline', `1. Item 1
1. Item 2
   Item 2 Line 2
   Item 2 Line 3
1. Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 2\nItem 2 Line 2\nItem 2 Line 3'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('ordered task', `1. [ ] Task 1
2. [x] Task 2
3. [ ] Task 3
4. Item 4`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { t: 1, _: [{ $: BlockTag.Text, _: ['Task 1'] }] },
                            { t: 1, c: 1, _: [{ $: BlockTag.Text, _: ['Task 2'] }] },
                            { t: 1, _: [{ $: BlockTag.Text, _: ['Task 3'] }] },
                            { _: [{ $: BlockTag.Text, _: ['Item 4'] }] }
                        ]
                    }
                ]);

            _('unordered nested unordered', `* Item 1
* Item 2
  - Subitem 1
  - Subitem 2
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: ['Item 2'] },
                                    {
                                        $: BlockTag.List, _: [
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 1'] }] },
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 2'] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('unordered nested ordered', `* Item 1
* Item 2
  1. Subitem 1
  2. Subitem 2
* Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.List, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: ['Item 2'] },
                                    {
                                        $: BlockTag.OrdList, _: [
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 1'] }] },
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 2'] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('ordered nested ordered', `1. Item 1
2. Item 2
  1. Subitem 1
  2. Subitem 2
3. Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: ['Item 2'] },
                                    {
                                        $: BlockTag.OrdList, _: [
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 1'] }] },
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 2'] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);

            _('ordered nested unordered', `1. Item 1
1. Item 2
  * Subitem 1
  * Subitem 2
1. Item 3`, { headings: [], links: {} }, [
                    {
                        $: BlockTag.OrdList, _: [
                            { _: [{ $: BlockTag.Text, _: ['Item 1'] }] },
                            {
                                _: [
                                    { $: BlockTag.Text, _: ['Item 2'] },
                                    {
                                        $: BlockTag.List, _: [
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 1'] }] },
                                            { _: [{ $: BlockTag.Text, _: ['Subitem 2'] }] }
                                        ]
                                    }
                                ]
                            },
                            { _: [{ $: BlockTag.Text, _: ['Item 3'] }] },
                        ]
                    }
                ]);
        });

        describe('code', () => {
            _('empty line at end', `    code block
    
regular text`,
                { links: {}, headings: [] }, [
                    { $: BlockTag.Code, _: 'code block\n\n' },
                    { $: BlockTag.Paragraph, _: ['regular text'] }
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
| 2 1 | 2:2 | 2;3 |`, { links: {}, headings: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: ['Col 1'] }],
                            [{ $: BlockTag.Text, _: ['Col 2'] }],
                            [{ $: BlockTag.Text, _: ['Col 3'] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: ['1,1'] }],
                                [{ $: BlockTag.Text, _: ['1 2'] }],
                                [{ $: BlockTag.Text, _: ['1:3'] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: ['2 1'] }],
                                [{ $: BlockTag.Text, _: ['2:2'] }],
                                [{ $: BlockTag.Text, _: ['2;3'] }]
                            ]
                        ]
                    }
                ]);

            _('simple non-piped', `Col 1 | Col 2 | Col 3
---|----|---
1,1 | 1 2 | 1:3
2 1 | 2:2 | 2;3`, { links: {}, headings: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: ['Col 1'] }],
                            [{ $: BlockTag.Text, _: ['Col 2'] }],
                            [{ $: BlockTag.Text, _: ['Col 3'] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: ['1,1'] }],
                                [{ $: BlockTag.Text, _: ['1 2'] }],
                                [{ $: BlockTag.Text, _: ['1:3'] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: ['2 1'] }],
                                [{ $: BlockTag.Text, _: ['2:2'] }],
                                [{ $: BlockTag.Text, _: ['2;3'] }]
                            ]
                        ]
                    }
                ]);

            _('piped short', `|1|2|
|-|-|
| |2|`, { links: {}, headings: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.None, BlockAlign.None],
                        h: [
                            [{ $: BlockTag.Text, _: ['1'] }],
                            [{ $: BlockTag.Text, _: ['2'] }]
                        ],
                        _: [
                            [
                                [],
                                [{ $: BlockTag.Text, _: ['2'] }]
                            ]
                        ]
                    }
                ]);

            _('piped with align', `| Col 1 | Col 2 | Col 3 |
|:--|:--:|--:|
| 1,1 | 1 2 | 1:3 |
| 2 1 | 2:2 | 2;3 |`, { links: {}, headings: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.Left, BlockAlign.Center, BlockAlign.Right],
                        h: [
                            [{ $: BlockTag.Text, _: ['Col 1'] }],
                            [{ $: BlockTag.Text, _: ['Col 2'] }],
                            [{ $: BlockTag.Text, _: ['Col 3'] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: ['1,1'] }],
                                [{ $: BlockTag.Text, _: ['1 2'] }],
                                [{ $: BlockTag.Text, _: ['1:3'] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: ['2 1'] }],
                                [{ $: BlockTag.Text, _: ['2:2'] }],
                                [{ $: BlockTag.Text, _: ['2;3'] }]
                            ]
                        ]
                    }
                ]);

            _('non-piped with align', `Col 1 | Col 2 | Col 3
:--|:--:|--:
1,1 | 1 2 | 1:3
2 1 | 2:2 | 2;3`, { links: {}, headings: [] }, [
                    {
                        $: BlockTag.Table,
                        a: [BlockAlign.Left, BlockAlign.Center, BlockAlign.Right],
                        h: [
                            [{ $: BlockTag.Text, _: ['Col 1'] }],
                            [{ $: BlockTag.Text, _: ['Col 2'] }],
                            [{ $: BlockTag.Text, _: ['Col 3'] }]
                        ],
                        _: [
                            [
                                [{ $: BlockTag.Text, _: ['1,1'] }],
                                [{ $: BlockTag.Text, _: ['1 2'] }],
                                [{ $: BlockTag.Text, _: ['1:3'] }]
                            ],
                            [
                                [{ $: BlockTag.Text, _: ['2 1'] }],
                                [{ $: BlockTag.Text, _: ['2:2'] }],
                                [{ $: BlockTag.Text, _: ['2;3'] }]
                            ]
                        ]
                    }
                ]);
        });
    });
}
