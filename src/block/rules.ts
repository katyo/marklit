import { ParserHandle, ParserRule, AsUnion, parseNest } from '../core';
import { MetaLinks, MetaHeadings } from '../meta';
import { substRe, unwrapRe, shiftRe } from '../match';
import {
    BlockTag, BlockOrder, BlockTokenType,
    BlockAlign,
    BlockSpace, BlockCode, BlockHeading,
    BlockTable, BlockTableRow,
    BlockHr, BlockQuote,
    BlockList, BlockListItem,
    BlockParagraph, BlockText, BlockOrdList,
} from './model';
import { InlineContext, InlineContextMap } from '../inline/rules';

export const enum BlockContext {
    Top = 1,
    Nest,
}

export interface BlockContextMap<BlockToken, BlockMeta, InlineToken, InlineMeta> extends InlineContextMap<InlineToken, InlineMeta> {
    [BlockContext.Top]: [BlockTokenType<BlockToken>, BlockMeta];
    [BlockContext.Nest]: [BlockTokenType<BlockToken>, BlockMeta];
}

export type BlockRule<BlockTokenMap, BlockMeta, InlineToken, InlineMeta> = ParserRule<BlockContextMap<BlockTokenMap, BlockMeta, InlineToken, InlineMeta>, BlockContext>;

export type BlockHandle<BlockTokenMap, BlockMeta, InlineToken, InlineMeta> = ParserHandle<BlockContextMap<BlockTokenMap, BlockMeta, InlineToken, InlineMeta>, BlockContext>;

const hr = /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/;

const heading = /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/;

const lheading = /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/;

const paragraph = substRe(/^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/, {
    hr,
    heading,
    lheading,
    tag: '[a-z]+[0-9]?'
});

const bullet = /(?:[*+-]|\d+\.)/;

const item = substRe(/^( *)(bullet) [^\n]*(?:\n(?!\1bullet )[^\n]*)*/gm, {
    bullet
});

const def = substRe(/^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/, {
    label: /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
    title: /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
});

const list = substRe(/^( *)(bullet) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bullet )\n*|\s*$)/, {
    bullet,
    hr: '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))',
    def: '\\n+(?=' + unwrapRe(def)[0] + ')'
});

export const Newline: BlockRule<BlockSpace, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Newline,
    /^\n+/,
    ({ }, src) => [{ $: BlockTag.Space }, src]
];

export const CodeBlock: BlockRule<BlockCode, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Code,
    /^( {4}[^\n]+\n*)+/,
    ({ }, src, text) => [{ $: BlockTag.Code, _: text.replace(/^ {4}/gm, '').replace(/\n$/, '') }, src]
];

const fences = /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/;

export const Fences: BlockRule<BlockCode, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Code,
    fences,
    ({ }, src, { }, lang, text) => [{ $: BlockTag.Code, _: text ? text.replace(/^ {4}/gm, '') : '' }, src]
];

export const Heading: BlockRule<BlockHeading<any>, MetaHeadings<any>, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Heading,
    heading,
    ($, src, _, sharps, text) => [procHeading($, sharps.length, text), src]
];

export const LHeading: BlockRule<BlockHeading<any>, MetaHeadings<any>, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.LHeading,
    lheading,
    ($, src, _, text, underscore) => [procHeading($, underscore === '=' ? 1 : 2, text), src]
];

export const GfmHeading: BlockRule<BlockHeading<any>, MetaHeadings<any>, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Heading,
    /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/,
    ($, src, _, sharps, text) => [procHeading($, sharps.length, text), src]
];

function procHeading($: BlockHandle<BlockHeading<any>, MetaHeadings<any>, any, {}>, level: number, text: string): AsUnion<BlockHeading<any>> {
    const index = $.m.headings.length;
    const content = parseNest({ ...$ }, text, InlineContext.Top);
    $.m.headings.push({ t: text, n: level, _: content });
    return { $: BlockTag.Heading, i: index, n: level, _: content };
}

export const Hr: BlockRule<BlockHr, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Hr,
    hr,
    ({ }, src) => [{ $: BlockTag.Hr }, src]
];

export const Quote: BlockRule<BlockQuote<any>, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Quote,
    substRe(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/, {
        paragraph
    }),
    ($, src, text) => [{
        $: BlockTag.Quote,
        _: parseNest($, text.replace(/^ *> ?/gm, ''))
    }, src]
];

export const Paragraph: BlockRule<BlockParagraph<any>, {}, any, {}> = [
    [BlockContext.Top],
    BlockOrder.Paragraph,
    paragraph,
    procParagraph
];

export const GfmParagraph: BlockRule<BlockParagraph<any>, {}, any, {}> = [
    [BlockContext.Top],
    BlockOrder.Paragraph,
    substRe(paragraph, {
        '(?!': `(?!${shiftRe(fences, 1)}|${shiftRe(list, 2)}|`
    }),
    procParagraph
];

function procParagraph($: BlockHandle<BlockParagraph<any>, {}, any, {}>, src: string, { }: string, text: string): [AsUnion<BlockParagraph<any>>, string] {
    return [{
        $: BlockTag.Paragraph,
        _: parseNest($,
            text.charAt(text.length - 1) === '\n'
                ? text.slice(0, -1)
                : text,
            InlineContext.Top)
    }, src];
}

export const Text: BlockRule<BlockText<any>, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.Text,
    /^[^\n]+/,
    ($, src, text) => [{ $: BlockTag.Text, _: parseNest($, text, InlineContext.Top) }, src]
];

export const List: BlockRule<BlockList<any> | BlockOrdList<any>, {}, any, {}> = [
    [BlockContext.Top, BlockContext.Nest],
    BlockOrder.List,
    list,
    ($, src, str, { }, bull) => {
        const ordered = bull.length > 1;
        const items: BlockListItem<any>[] = [];

        // Get each top-level item.
        const cap = str.match(item);

        if (!cap) return [undefined, str + src];

        let loose: true | undefined;
        let next = false;
        const l = cap.length;

        for (let i = 0; i < l; i++) {
            let item = cap[i];

            // Remove the list item's bullet
            // so it is seen as the next token.
            let space = item.length;
            item = item.replace(/^ *([*+-]|\d+\.) +/, '');

            // Outdent whatever the
            // list item contains. Hacky.
            if (~item.indexOf('\n ')) {
                space -= item.length;
                item = !this.options.pedantic
                    ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                    : item.replace(/^ {1,4}/gm, '');
            }

            // Determine whether the next list item belongs here.
            // Backpedal if it does not belong in this list.
            if (/* smartLists && */i !== l - 1) {
                const b_cap = bullet.exec(cap[i + 1]);
                if (!b_cap) return [undefined, str + src];

                const b = b_cap[0];
                if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                    src = cap.slice(i + 1).join('\n') + src;
                    i = l - 1;
                }
            }

            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            let item_loose: true | undefined = next || /\n\n(?!\s*$)/.test(item) || undefined;

            if (i !== l - 1) {
                next = item.charAt(item.length - 1) === '\n';
                if (!item_loose && next) item_loose = true;
            }

            if (item_loose) {
                loose = true;
            }

            // Check for task list items
            const is_task: true | undefined = /^\[[ xX]\] /.test(item) || undefined;
            let is_checked: true | undefined = undefined;
            if (is_task) {
                if (item[1] !== ' ') is_checked = true;
                item = item.replace(/^\[[ xX]\] +/, '');
            }

            items.push({
                t: is_task,
                c: is_checked,
                l: item_loose,
                _: parseNest($, item, BlockContext.Nest)
            });
        }

        if (loose) {
            for (let i = 0; i < items.length; i++) {
                items[i].l = true;
            }
        }

        return [
            ordered ? {
                $: BlockTag.OrdList,
                s: +bull,
                l: loose,
                _: items,
            } : {
                    $: BlockTag.List,
                    l: loose,
                    _: items,
                }, src
        ];
    }
];

export const Def: BlockRule<void, MetaLinks, any, {}> = [
    [BlockContext.Top],
    BlockOrder.Def,
    substRe(/^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/, {
        label: /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
        title: /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/
    }),
    procDef,
];

export const PedanticDef: BlockRule<void, MetaLinks, any, {}> = [
    [BlockContext.Top],
    BlockOrder.Def,
    /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    procDef,
];

function procDef($: BlockHandle<void, MetaLinks, any, {}>, src: string, tag: string, href: string, title?: string): [void, string] {
    if (title) title = title.substring(1, title.length - 1);
    $.m.links[tag.toLowerCase().replace(/\s+/g, ' ')] = {
        l: href,
        t: title
    };
    return [undefined, src];
}

export const NpTable: BlockRule<BlockTable<any>, {}, any, {}> = [
    [BlockContext.Top],
    BlockOrder.List,
    /^( *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$))/,
    procTable,
];

export const Table: BlockRule<BlockTable<any>, {}, any, {}> = [
    [BlockContext.Top],
    BlockOrder.List,
    /^( *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$))/,
    procTable,
];

function procTable($: BlockHandle<BlockTable<any>, {}, any, {}>, src: string, str: string, header: string, align: string, cells: string): [AsUnion<BlockTable<any>> | undefined, string] {
    const h = procRow($, header.replace(/^ *| *\| *$/g, ''));
    const a = align.replace(/^ *|\| *$/g, '').split(/ *\| */)
        .map(hint => /^ *-+: *$/.test(hint) ? BlockAlign.Right :
            /^ *:-+: *$/.test(hint) ? BlockAlign.Center :
                /^ *:-+ *$/.test(hint) ? BlockAlign.Left :
                    BlockAlign.None);
    return h.length === a.length ? [{
        $: BlockTag.Table,
        h,
        a,
        _: cells ? cells.replace(/(?: *\| *)?\n$/, '').split('\n')
            .map(row => procRow($, row.replace(/^ *\| *| *\| *$/g, ''), h.length)) : []
    }, src] : [undefined, str + src];
}

function procRow($: BlockHandle<BlockTable<any>, {}, any, {}>, srcRow: string, count?: number): BlockTableRow<any> {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    const cells = srcRow.replace(/\|/g, (match, offset, str) => {
        let escaped = false;
        for (; --offset >= 0 && str[offset] === '\\';
            escaped = !escaped);
        return escaped ?
            // odd number of slashes means | is escaped
            // so we leave it alone
            '|' :
            // add space before unescaped |
            ' |';
    }).split(/ \|/);

    if (count) {
        if (cells.length > count) {
            cells.splice(count);
        } else {
            for (; cells.length < count; cells.push(''));
        }
    }

    return cells.map(cell => parseNest($,
        // leading or trailing whitespace is ignored per the gfm spec
        cell.trim().replace(/\\\|/g, '|'),
        BlockContext.Nest));
}

export const BlockNormal = [Newline, CodeBlock, Heading, Hr, Quote, List, Def, LHeading, Paragraph, Text];

export const BlockPedantic = [Newline, CodeBlock, Heading, Hr, Quote, List, PedanticDef, LHeading, Paragraph, Text];

export const BlockGfm = [Newline, CodeBlock, Fences, GfmHeading, Hr, Quote, List, Def, LHeading, GfmParagraph, Text];

export const BlockGfmTables = [...BlockGfm, NpTable, Table];
