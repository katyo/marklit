import { deepStrictEqual as dse } from 'assert';

import {
    InlineTokenMap,
    BlockTokenMap,
    BlockTokenType,

    InlineNormal,
    //InlinePedantic,
    //InlineGfm,
    //InlineGfmBreaks,

    BlockNormal,

    ContextMap,

    init, parse, MetaHeadings, MetaLinks, BlockTag, InlineTag, //InlineTag,
} from '../../src/index';

interface Meta extends MetaHeadings<InlineToken>, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export default function() {
    describe('block', () => {
        describe('normal', () => {
            const parser = init<Context>(...BlockNormal, ...InlineNormal);
            const _ = (d: string, s: string, m: Meta, r: BlockTokenType<BlockToken>[]) => it(d, () => dse(parse(parser, s), { $: 1, _: [m, r] }));

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
                        },
                        { $: BlockTag.Space }
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
                        },
                        { $: BlockTag.Space }
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
                        { $: BlockTag.Space },
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
                        { $: BlockTag.Space },
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
                                { $: BlockTag.Space },
                                {
                                    $: BlockTag.Quote, _: [
                                        { $: BlockTag.Paragraph, _: ['nested block quote'] },
                                        { $: BlockTag.Space },
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
                _('simple', `[This link][1]

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
                        },
                        { $: BlockTag.Space }
                    ]);
            });
        });
    });
}
