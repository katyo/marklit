import { ParserHandle, ParserRule, parseNest } from '../parser';
import { substRe, shiftRe } from '../regex';
import {
    ContextTag, ContextMap, AsUnion,
    NoMeta, MetaLinks, MetaHeadings,
    UnknownToken
} from '../model';
import {
    BlockTag, BlockOrder, BlockTokenType,
    BlockAlign,
    BlockCode, BlockHeading,
    BlockTable, BlockTableRow,
    BlockHr, BlockQuote,
    BlockList, BlockListItem,
    BlockParagraph, BlockText, BlockOrdList
} from './model';

export type BlockRule<BlockTokenMap, Meta> = ParserRule<ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block | ContextTag.BlockNest, Meta>;

export type BlockHandle<BlockTokenMap, Meta> = ParserHandle<ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block | ContextTag.BlockNest, Meta>;

const hr = ' {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)';

const heading = ' *(#{1,6}) *([^\\n]+?) *(?:#+ *)?(?:\\n+|$)';

const lheading = '([^\\n]+)\\n *(=|-){2,} *(?:\\n+|$)';

const paragraph = substRe('([^\\n]+(?:\\n(?!hr|heading|lheading| {0,3}>|<\\/?(?:tag)(?: +|\\n|\\/?>)|<(?:script|pre|style|!--))[^\\n]+)*)', {
    hr,
    heading,
    lheading,
    tag: '[a-z]+[0-9]?'
});

const bull = '(?:[*+-]|\\d+\\.)';

const bull_re = new RegExp(bull);

const item_re = new RegExp(substRe('( *)(bull) [^\\n]*(?:\\n(?!\\1bull )[^\\n]*)*', {
    bull
}), 'gm');

const def = substRe(' {0,3}\\[(label)\\]: *\\n? *<?([^\\s>]+)>?(?:(?: +\\n? *| *\\n *)(title))? *(?:\\n+|$)', {
    label: '(?!\\s*\\])(?:\\\\[\\[\\]]|[^\\[\\]])+',
    title: '(?:"(?:\\\\"?|[^"\\\\])*"|\'[^\'\\n]*(?:\\n[^\'\\n]+)*\\n?\'|\\([^()]*\\))',
});

const list = substRe('( *)(bull) [\\s\\S]+?(?:hr|def|\\n{2,}(?! )(?!\\1bull )\\n*|\\s*$)', {
    bull,
    hr: '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))',
    def: '\\n+(?=' + def + ')'
});

export const Newline: BlockRule<void, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Newline,
    '\\n+',
    ({ }, src) => [undefined, src]
];

export const CodeBlock: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Code,
    '( {4}[^\\n]+\\n*)+',
    ({ }, src, text) => [{ $: BlockTag.Code, _: text.replace(/^ {4}/gm, '') }, src]
];

const fences = ' *(`{3,}|~{3,})[ \\.]*(\\S+)? *\\n([\\s\\S]*?)\\n? *\\1 *(?:\\n+|$)';

export const Fences: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Code,
    fences,
    ({ }, src, { }, lang, text) => [{ $: BlockTag.Code, _: text ? text.replace(/^ {4}/gm, '') : '' }, src]
];

export const Heading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    heading,
    ($, src, _, sharps, text) => [procHeading($, sharps.length, text), src],
    initHeading
];

export const LHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.LHeading,
    lheading,
    ($, src, _, text, underscore) => [procHeading($, underscore === '=' ? 1 : 2, text), src],
    initHeading
];

export const GfmHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    ' *(#{1,6}) +([^\\n]+?) *#* *(?:\\n+|$)',
    ($, src, _, sharps, text) => [procHeading($, sharps.length, text), src],
    initHeading
];

function initHeading(m: MetaHeadings<UnknownToken>) {
    m.headings = [];
}

function procHeading($: BlockHandle<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>>, level: number, text: string): AsUnion<BlockHeading<UnknownToken>> {
    const index = $.m.headings.length;
    const content = parseNest({ ...$ }, text, ContextTag.Inline);
    $.m.headings.push({ t: text, n: level, _: content });
    return { $: BlockTag.Heading, i: index, n: level, _: content };
}

export const Hr: BlockRule<BlockHr, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Hr,
    hr,
    ({ }, src) => [{ $: BlockTag.Hr }, src]
];

export const Quote: BlockRule<BlockQuote<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Quote,
    substRe('( {0,3}> ?(paragraph|[^\\n]*)(?:\\n|$))+', {
        paragraph
    }),
    ($, src, text) => [{
        $: BlockTag.Quote,
        _: parseNest($, text.replace(/^ *> ?/gm, ''))
    }, src]
];

export const Paragraph: BlockRule<BlockParagraph<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.Paragraph,
    paragraph,
    procParagraph
];

export const GfmParagraph: BlockRule<BlockParagraph<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.Paragraph,
    substRe(paragraph, {
        '\\(\\?!': `(?!${shiftRe(fences, 1)}|${shiftRe(list, 2)}|`
    }),
    procParagraph
];

function procParagraph($: BlockHandle<BlockParagraph<UnknownToken>, NoMeta>, src: string, { }: string, text: string): [AsUnion<BlockParagraph<any>>, string] {
    return [{
        $: BlockTag.Paragraph,
        _: parseNest($,
            text.charAt(text.length - 1) === '\n'
                ? text.slice(0, -1)
                : text,
            ContextTag.Inline)
    }, src];
}

export const TextBlock: BlockRule<BlockText<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Text,
    '[^\\n]+',
    ($, src, text) => [{ $: BlockTag.Text, _: parseNest($, text, ContextTag.Inline) }, src]
];

export const List: BlockRule<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.List,
    list,
    ($, src, str, { }, bull) => {
        const ordered = bull.length > 1;
        const items: BlockListItem<UnknownToken>[] = [];

        // Get each top-level item.
        const cap = str.match(item_re);

        if (!cap) return [undefined, str + src];

        let loose: true | undefined;
        let next = false;
        const l = cap.length;

        for (let i = 0; i < l; i++) {
            let item_src = cap[i];

            // Remove the list item's bullet
            // so it is seen as the next token.
            let space = item_src.length;
            item_src = item_src.replace(/^ *([*+-]|\d+\.) +/, '');

            // Outdent whatever the
            // list item contains. Hacky.
            if (~item_src.indexOf('\n ')) {
                space -= item_src.length;
                item_src = //!this.options.pedantic
                    //?
                    item_src.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                    //: item_src.replace(/^ {1,4}/gm, '')
                    ;
            }

            // Determine whether the next list item belongs here.
            // Backpedal if it does not belong in this list.
            if (/* smartLists && */i !== l - 1) {
                const b_cap = bull_re.exec(cap[i + 1]);
                if (!b_cap) return [undefined, str + src];

                const b = b_cap[0];
                if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                    src = cap.slice(i + 1).join('\n') + src;
                    i = l - 1;
                }
            }

            const item = {} as BlockListItem<UnknownToken>;

            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            if (next || /\n\n(?!\s*$)/.test(item_src)) item.l = 1;

            if (i !== l - 1) {
                next = item_src.charAt(item_src.length - 1) === '\n';
                if (!item.l && next) item.l = 1;
            }

            if (item.l) loose = true;

            // Check for task list items
            if (/^\[[ xX]\] /.test(item_src)) {
                item.t = 1;
                if (item_src.charAt(1) !== ' ') item.c = 1;
                item_src = item_src.replace(/^\[[ xX]\] +/, '');
            }

            item._ = parseNest($, item_src, ContextTag.BlockNest);

            items.push(item);
        }

        if (loose) {
            for (let i = 0; i < items.length; i++) {
                items[i].l = 1;
            }
        }

        const list = {
            $: ordered ? BlockTag.OrdList : BlockTag.List,
            _: items
        } as BlockTokenType<BlockList<UnknownToken> | BlockOrdList<UnknownToken>>;

        if (ordered && bull != '1.') (list as BlockTokenType<BlockOrdList<UnknownToken>>).s = +bull;

        if (loose) list.l = 1;

        return [list, src];
    }
];

export const Def: BlockRule<void, MetaLinks> = [
    [ContextTag.Block],
    BlockOrder.Def,
    substRe(' {0,3}\\[(label)\\]: *\\n? *<?([^\\s>]+)>?(?:(?: +\\n? *| *\\n *)(title))? *(?:\\n+|$)', {
        label: '(?!\\s*\\])(?:\\\\[\\[\\]]|[^\\[\\]])+',
        title: '(?:"(?:\\\\"?|[^"\\\\])*"|\'[^\'\\n]*(?:\\n[^\'\\n]+)*\\n?\'|\\([^()]*\\))'
    }),
    procDef,
    initDef
];

export const PedanticDef: BlockRule<void, MetaLinks> = [
    [ContextTag.Block],
    BlockOrder.Def,
    ' *\\[([^\\]]+)\\]: *<?([^\\s>]+)>?(?: +(["(][^\\n]+[")]))? *(?:\\n+|$)',
    procDef,
    initDef
];

function initDef(m: MetaLinks) {
    m.links = {};
}

function procDef($: BlockHandle<void, MetaLinks>, src: string, { }: string, label: string, href: string, title?: string): [void, string] {
    if (title) title = title.substring(1, title.length - 1);
    $.m.links[label.toLowerCase().replace(/\s+/g, ' ')] = {
        l: href,
        t: title
    };
    return [undefined, src];
}

export const NpTable: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.List,
    '( *([^|\\n ].*\\|.*)\\n *([-:]+ *\\|[-| :]*)(?:\\n((?:.*[^>\\n ].*(?:\\n|$))*)\\n*|$))',
    procTable,
];

export const Table: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.List,
    '( *\\|(.+)\\n *\\|?( *[-:]+[-| :]*)(?:\\n((?: *[^>\\n ].*(?:\\n|$))*)\\n*|$))',
    procTable,
];

function procTable($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, src: string, str: string, header: string, align: string, cells: string): [AsUnion<BlockTable<any>> | undefined, string] {
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

function procRow($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, srcRow: string, count?: number): BlockTableRow<any> {
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
        ContextTag.BlockNest));
}

export const BlockNormal = [Newline, CodeBlock, Heading, Hr, Quote, List, Def, LHeading, Paragraph, TextBlock];

export const BlockPedantic = [Newline, CodeBlock, Heading, Hr, Quote, List, PedanticDef, LHeading, Paragraph, TextBlock];

export const BlockGfm = [Newline, CodeBlock, Fences, GfmHeading, Hr, Quote, List, Def, LHeading, GfmParagraph, TextBlock];

export const BlockGfmTables = [...BlockGfm, NpTable, Table];
