import { htmlEq } from '../test';
import {
    TokenType,

    InlineTag, BlockTag,

    MetaLinks, MetaHeadings,

    ContextMap, InlineTokenMap, BlockTokenMap,

    InlineHtml, BlockHtml,

    initRenderHtml,
    render
} from '../../src/index';

interface Meta extends MetaHeadings<InlineToken>, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export default function() {
    const renderer = initRenderHtml<Context>(...BlockHtml, ...InlineHtml);
    const _ = (test: string, meta: Meta, tokens: TokenType<BlockToken>[], html: string) => it(test, () => htmlEq(render(renderer, [meta, tokens]), html));

    describe('block', () => {
        _('headings', {
            links: {}, headings: [
                { t: "Heading 1", n: 1, _: [{ $: InlineTag.Text, _: "Heading 1" }] },
                { t: "Heading 2", n: 2, _: [{ $: InlineTag.Text, _: "Heading 2" }] }
            ]
        }, [
                { $: BlockTag.Heading, i: 0, n: 1, _: [{ $: InlineTag.Text, _: "Heading 1" }] },
                { $: BlockTag.Heading, i: 1, n: 2, _: [{ $: InlineTag.Text, _: "Heading 2" }] }
            ], `<h1 id="heading-1">Heading 1</h1>

<h2 id="heading-2">Heading 2</h2>
`);
    });

    describe('inline', () => {
        _('phrases', { links: {}, headings: [] }, [
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
}
