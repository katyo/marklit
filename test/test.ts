/// <reference path="chai-html.d.ts" />
import { use, expect } from 'chai';
import chaiHtml from 'chai-html';

declare global {
    namespace Chai {
        interface Assertion {
            html: ChaiHtml.HtmlAssertion;
        }
    }
}

use(chaiHtml);

import {
    InlineTokenMap,
    BlockTokenMap,

    InlineNormal,
    InlinePedantic,
    InlineGfm,
    InlineGfmBreaks,

    BlockNormal,
    BlockPedantic,
    BlockGfm,
    BlockGfmTables,

    ContextMap,

    init, parse,
    MetaHeadings, MetaLinks,

    BlockHtml,
    BlockTablesHtml,
    InlineHtml,
    InlineGfmHtml,

    initRenderHtml, render
} from '../src/index';

interface Meta extends MetaHeadings<InlineToken>, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

export function testMarked(tests: Record<string, [Record<string, any>, string, string]>, disabled: string[] = []) {
    for (const name in tests) {
        if (disabled.indexOf(name) < 0) {
            it(name, () => {
                const [{ pedantic, gfm, breaks, tables/*, smartypants, baseUrl, xhtml, mangle, sanitize*/ }, source_md, expected_html] = tests[name];

                const parser = init<Context>(
                    ...(pedantic ? BlockPedantic : tables ? BlockGfmTables : gfm ? BlockGfm : BlockNormal),
                    ...(pedantic ? InlinePedantic : breaks ? InlineGfmBreaks : gfm ? InlineGfm : InlineNormal)
                );
                const renderer = initRenderHtml<Context>(
                    ...(tables ? BlockTablesHtml : BlockHtml),
                    ...(gfm ? InlineGfmHtml : InlineHtml)
                );

                const result = parse(parser, source_md);

                if (!result.$) throw new Error(`Parser failed: ${result._}`);

                const actual_adt = result._;

                const actual_html = render(renderer, actual_adt);

                expect(actual_html).html.to.equal(expected_html);
            });
        }
    }
}
