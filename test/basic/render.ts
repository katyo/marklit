import { htmlEq } from '../test';
import {
    TokenType,

    InlineTag, BlockTag,

    MetaLinks, MetaHeadings, MetaAbbrevs,

    ContextMap, InlineTokenMap, BlockTokenMap,

    InlineHtml, BlockHtml,

    InlineAbbrev, AbbrevHtml,

    initRenderHtml,
    render
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

        interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

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
}
