import { strictEqual as se } from 'assert';
import {
    BlockTokenType,

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
    const _ = (test: string, meta: Meta, tokens: BlockTokenType<BlockToken>[], html: string) => it(test, () => se(render(renderer, [meta, tokens]), html));

    describe('render html', () => {
        describe('block', () => {
            _('headings', {
                links: {}, headings: [
                    { t: "Heading1", n: 1, _: ["Heading1"] },
                    { t: "Heading2", n: 2, _: ["Heading2"] }
                ]
            }, [
                    { $: BlockTag.Heading, i: 0, n: 1, _: ["Heading1"] },
                    { $: BlockTag.Heading, i: 1, n: 2, _: ["Heading2"] }
                ], `<h1>Heading1</h1>
<h2>Heading2</h2>
`);
        });

        describe('inline', () => {
            _('phrases', { links: {}, headings: [] }, [
                {
                    $: BlockTag.Paragraph, _: [
                        "This is example of ",
                        { $: InlineTag.Strong, _: ["strong"] },
                        ", ",
                        { $: InlineTag.Em, _: ["em"] },
                        " and ",
                        { $: InlineTag.Code, _: "inline code" },
                        "."
                    ]
                }
            ], `<p>This is example of <strong>strong</strong>, <em>em</em> and <code>inline code</code>.</p>
`);
        });
    });
}
