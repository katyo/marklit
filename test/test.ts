/// <reference path="html-differ.d.ts" />
import { HtmlDiffer } from 'html-differ';
import { inspect } from 'util';

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
    BlockXHtml,
    BlockTablesHtml,
    BlockTablesXHtml,
    HeadingHtml,
    InlineHtml,
    InlineXHtml,
    InlineGfmHtml,
    InlineGfmXHtml,

    initRenderHtml, render, TextSpanSmartyPants
} from '../src/index';

interface Meta extends MetaHeadings<InlineToken>, MetaLinks { }

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface BlockToken extends BlockTokenMap<BlockToken, InlineToken> { }

interface Context extends ContextMap<BlockToken, InlineToken, Meta> { }

/*
export interface Options {
    pedantic: boolean;
    gfm: boolean;
    breaks: boolean;
    tables: boolean;
    smatrypants: boolean;
    baseUrl: string;
    xhtml: boolean;
    mangle: boolean;
    sanitize: boolean;
}
*/

export type Options = Record<string, any>;

const htmlDiffer = new HtmlDiffer();

const enum HL {
    Def = '\x1b[0m', // default
    Err = '\x1b[31m', // red
    Ok = '\x1b[32m', // green
    Pre = '\x1b[36m', // preformatted
    Cap = '\x1b[4m', // caption
}

export function htmlEq(actual_html: string, expected_html: string, actual_adt?: any[], source_md?: string) {
    if (!htmlDiffer.isEqual(actual_html, expected_html)) {
        const diffs = htmlDiffer.diffHtml(actual_html, expected_html);

        throw {
            message: 'Result error: \n' + HL.Def +
                (source_md ? HL.Cap + 'Source' + HL.Def + ':   ' + HL.Pre + prettyPrint(source_md) + HL.Def + '\n' : '') +
                (actual_adt ? HL.Cap + 'ADT' + HL.Def + ':      ' + inspect(actual_adt, { depth: 10, colors: true }) + HL.Def + '\n' : '') +
                HL.Cap + 'Actual' + HL.Def + ':   ' + HL.Err + prettyPrint(actual_html) + HL.Def + '\n' +
                HL.Cap + 'Expected' + HL.Def + ': ' + HL.Ok + prettyPrint(expected_html) + HL.Def + '\n' +
                HL.Cap + 'Diffs' + HL.Def + ':    ' + diffs.map(({ value, added, removed }) =>
                    (added ? HL.Ok : removed ? HL.Err : HL.Def) + prettyPrint(value)
                ).join('') + HL.Def
        };
    }
}

function doTest({ pedantic, gfm, breaks, tables, headerIds, xhtml, smartypants/*, baseUrl, mangle, sanitize*/ }: Options, source_md: string, expected_html: string) {
    const parser = init<Context>(
        ...(pedantic ? BlockPedantic : tables ? BlockGfmTables : gfm ? BlockGfm : BlockNormal),
        ...(pedantic ? InlinePedantic : breaks ? InlineGfmBreaks : gfm ? InlineGfm : InlineNormal),
        ...(smartypants ? [TextSpanSmartyPants] : [])
    );

    const render_rules = [
        ...(tables ? (xhtml ? BlockTablesXHtml : BlockTablesHtml) : (xhtml ? BlockXHtml : BlockHtml)),
        ...(headerIds ? [] : [HeadingHtml]),
        ...(gfm ? (xhtml ? InlineGfmXHtml : InlineGfmHtml) : (xhtml ? InlineXHtml : InlineHtml)),
    ];

    const renderer = initRenderHtml<Context>(...render_rules);

    const actual_adt = parse(parser, source_md);

    const actual_html = render(renderer, actual_adt);

    htmlEq(actual_html, expected_html, actual_adt, source_md);
}

function prettyPrint(str: string): string {
    return str ? str
        .replace(/ /g, '␣') // highlight spaces
        .replace(/\t/g, '→') // highlight tabs
        .replace(/\n/g, '⤶\n') // highlight line-feeds
        .replace(/\r/g, '⇠') // highlight carriage returns
        : '∅'; // highlight empty contents
}

export function testMarked(options: Options, tests: Record<string, [Options, string, string]>, blacklist: string[] = []) {
    for (const name in tests) {
        if (blacklist.indexOf(name) < 0) {
            it(name, () => {
                const test = tests[name];
                const [opts,] = test;
                for (const key in options) {
                    if (!(key in opts)) {
                        opts[key] = options[key];
                    }
                }
                doTest(...test);
            });
        }
    }
}

export function testSpecs(options: Options, specs: { section: string, html: string, markdown: string, example: number }[], blacklist: number[] = []) {
    const sections: string[] = [];

    for (const { section, example } of specs) {
        if (blacklist.indexOf(example) < 0 &&
            sections.indexOf(section) < 0)
            sections.push(section);
    }

    for (const section_ of sections) {
        describe(section_, () => {
            for (const { section, html, markdown, example } of specs) {
                if (section == section_ &&
                    blacklist.indexOf(example) < 0) {
                    it(`example ${example}`, () => {
                        doTest(options, markdown, html);
                    });
                }
            }
        });
    }
}
