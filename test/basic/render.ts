import { htmlEq } from '../test';
import {
    TokenType,

    InlineTag, BlockTag,

    MetaLinks, MetaHeadings, MetaAbbrevs, MetaFootnotes,

    ContextMap, InlineTokenMap, BlockTokenMap,

    InlineHtml, BlockHtml,

    InlineAbbrev, AbbrevHtml,

    initRenderHtml,
    render,

    InlineFootnote, BlockFootnotes, FootnoteHtml, FootnotesBlockHtml
} from '../../src/index';

interface Meta extends MetaHeadings, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export default function() {
    const renderer = initRenderHtml<Context>(...BlockHtml, ...InlineHtml);
    const _ = (test: string, meta: Meta, tokens: TokenType<BlockToken>[], html: string) => it(test, () => htmlEq(render(renderer, [meta, tokens]), html));

    describe('block', () => {
        _('headings', {
            l: {}, h: [
                { t: "Heading 1", n: 1 },
                { t: "Heading 2", n: 2 }
            ]
        }, [
                { $: BlockTag.Heading, i: 0, n: 1, _: [{ $: InlineTag.Text, _: "Heading 1" }] },
                { $: BlockTag.Heading, i: 1, n: 2, _: [{ $: InlineTag.Text, _: "Heading 2" }] }
            ], `<h1 id="heading-1">Heading 1</h1>

<h2 id="heading-2">Heading 2</h2>
`);

    });

    describe('inline', () => {
        _('phrases', { l: {}, h: [] }, [
            {
                $: BlockTag.Paragraph, _: [
                    { $: InlineTag.Text, _: "This is example of " },
                    { $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: "strong" }] },
                    { $: InlineTag.Text, _: ", " },
                    { $: InlineTag.Em, _: [{ $: InlineTag.Text, _: "em" }] },
                    { $: InlineTag.Text, _: " and " },
                    { $: InlineTag.Code, _: "inline code" },
                    { $: InlineTag.Text, _: "." }
                ]
            }
        ], `<p>This is example of <strong>strong</strong>, <em>em</em> and <code>inline code</code>.</p>
`);
    });

    describe('abbrev', () => {
        interface Meta extends MetaHeadings, MetaLinks, MetaAbbrevs { }

        interface InlineToken extends InlineTokenMap<InlineToken>, InlineAbbrev { }

        interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

        const renderer = initRenderHtml<Context>(...BlockHtml, ...InlineHtml, AbbrevHtml);
        const _ = (test: string, meta: Meta, tokens: TokenType<BlockToken>[], html: string) => it(test, () => htmlEq(render(renderer, [meta, tokens]), html));

        _("inline", { l: {}, h: [], a: {} }, [
            {
                $: BlockTag.Text, _: [
                    { $: InlineTag.Abbrev, t: "Hyper Text Transfer Protocol", _: "HTTP" }
                ]
            }
        ], `<abbr title="Hyper Text Transfer Protocol">HTTP</abbr>`);

        _("block", {
            l: {}, h: [], a: {
                HTTP: "Hyper Text Transfer Protocol"
            }
        }, [
                {
                    $: BlockTag.Paragraph, _: [
                        { $: InlineTag.Abbrev, _: "HTTP" }
                    ]
                }
            ], `<p><abbr title="Hyper Text Transfer Protocol">HTTP</abbr></p>`);

        _("without title", {
            l: {}, h: [], a: {}
        }, [
                {
                    $: BlockTag.Paragraph, _: [
                        { $: InlineTag.Abbrev, _: "HTTP" }
                    ]
                }
            ], `<p><abbr>HTTP</abbr></p>`);
    });

    describe('abbrev', () => {
        interface Meta extends MetaHeadings, MetaLinks, MetaFootnotes { }

        interface InlineToken extends InlineTokenMap<InlineToken>, InlineFootnote { }

        interface BlockToken extends BlockTokenMap<BlockToken, InlineToken>, BlockFootnotes<BlockToken> { }

        interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

        const renderer = initRenderHtml<Context>(...BlockHtml, FootnotesBlockHtml, ...InlineHtml, FootnoteHtml);
        const _ = (test: string, meta: Meta, tokens: TokenType<BlockToken>[], html: string) => it(test, () => htmlEq(render(renderer, [meta, tokens]), html));

        _("simple", { l: {}, h: [], f: ['1', '@#$%'] }, [
            {
                $: BlockTag.Paragraph,
                _: [
                    { $: InlineTag.Text, _: "Footnotes" },
                    { $: InlineTag.Footnote, l: "1" },
                    { $: InlineTag.Text, _: " have a label" },
                    { $: InlineTag.Footnote, l: "@#$%" },
                    { $: InlineTag.Text, _: " and the footnote's content." }
                ]
            },
            {
                $: BlockTag.Footnotes,
                i: 0,
                _: [
                    {
                        i: 0,
                        l: '1',
                        _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: "This is a footnote content." }] }]
                    },
                    {
                        i: 1,
                        l: '@#$%',
                        _: [{ $: BlockTag.Text, _: [{ $: InlineTag.Text, _: `A footnote on the label: "@#$%".` }] }]
                    }
                ]
            }
        ], `<p>Footnotes<sup class="fn-ref"><a id="fnref-1" href="#fn-1">1</a></sup> have a label<sup class="fn-ref"><a id="fnref--" href="#fn--">@#$%</a></sup> and the footnote&#39;s content.</p>

<ol class="fn-list">
<li id="fn-1">
This is a footnote content.<a href="#fnref-1">↩</a>
</li>
<li id="fn--">
A footnote on the label: &quot;@#$%&quot;.<a href="#fnref--">↩</a>
</li>
</ol>`);
    });
}
