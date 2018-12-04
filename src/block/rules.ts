import { backpedal, reject } from '../match';
import {
    ParserHandle, ParserRule, parseNest,
    procNest, pushToken, lastToken, ProcFunc,
    dropToken,
} from '../parser';
import { substRe, shiftRe } from '../regex';
import {
    ContextTag, ContextMap,
    NoMeta, UnknownToken, TokenType
} from '../model';
import {
    BlockTag, BlockOrder, BlockPhrase,
    BlockAlign, BlockSpace,
    BlockCode, BlockMath, BlockHeading,
    BlockTable, BlockTableRow,
    BlockHr, BlockQuote, BlockFootnotes,
    BlockList, BlockListItem,
    BlockParagraph, BlockText, BlockOrdList,
    MetaLinks, MetaHeading, MetaHeadings,
    MetaAbbrevs, MetaFootnotes
} from './model';

export type BlockRule<BlockTokenMap, Meta> = ParserRule<ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block | ContextTag.BlockNest, Meta>;

export type BlockHandle<BlockTokenMap, Meta> = ParserHandle<ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block | ContextTag.BlockNest, Meta>;

/*
HTML Tags:

(replace-regexp "^const tag = .*;$"
 (concat "const tag = \""
  (replace-regexp-in-string "\\\\" ""
   (regexp-opt '(
       "address"
       "article"
       "aside"
       "base"
       "basefont"
       "blockquote"
       "body"
       "caption"
       "center"
       "col"
       "colgroup"
       "dd"
       "details"
       "dialog"
       "dir"
       "div"
       "dl"
       "dt"
       "fieldset"
       "figcaption"
       "figure"
       "footer"
       "form"
       "frame"
       "frameset"
       "h1"
       "h2"
       "h3"
       "h4"
       "h5"
       "h6"
       "head"
       "header"
       "hr"
       "html"
       "iframe"
       "legend"
       "li"
       "link"
       "main"
       "menu"
       "menuitem"
       "meta"
       "nav"
       "noframes"
       "ol"
       "optgroup"
       "option"
       "p"
       "param"
       "section"
       "source"
       "summary"
       "table"
       "tbody"
       "td"
       "tfoot"
       "th"
       "thead"
       "title"
       "tr"
       "track"
       "ul"
   ))) "\";"))
*/

const tag = "(?:a(?:ddress|(?:rticl|sid)e)|b(?:ase(?:font)?|lockquote|ody)|c(?:aption|enter|ol(?:group)?)|d(?:etails|i(?:alog|[rv])|[dlt])|f(?:i(?:eldset|g(?:caption|ure))|o(?:oter|rm)|rame(?:set)?)|h(?:ead(?:er)?|tml|[1-6r])|iframe|l(?:egend|i(?:nk)?)|m(?:ain|e(?:nu(?:item)?|ta))|n(?:av|oframes)|o(?:l|pt(?:group|ion))|p(?:aram)?|s(?:ection|ource|ummary)|t(?:able|body|foot|head|itle|rack|[dhr])|ul)";

const hr = ' {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)';

const heading = ' *(#{1,6}) *([^\\n]+?) *(?:#+ *)?(?:\\n+|$)';

const lheading = '([^\\n]+)\\n *(=|-){2,} *(?:\\n+|$)';

const paragraph = substRe('[^\\n]+(?:\\n(?!hr|heading|lheading| {0,3}>|<\\/?tag(?: +|\\n|\\/?>)|<(?:script|pre|style|!--))[^\\n]+)*', {
    lheading,
    heading,
    hr,
    tag,
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

export const Newline: BlockRule<BlockSpace, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Newline,
    // ⤶
    '\\n+',
    $ => { pushToken($, { $: BlockTag.Space }); },
    [BlockTag.Space],
    () => dropToken,
];

export const CodeBlock: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Code,
    // ␣␣␣␣some code
    '(?: {4}[^\\n]+\\n*)+',
    ($, text) => {
        pushToken($, { $: BlockTag.Code, _: text.replace(/^ {4}/gm, '').replace(/\n+$/, '\n') });
    }
];

const fences = ' *(`{3,}|~{3,})[ \\.]*(\\S+)? *\\n([\\s\\S]*?)\\n? *\\1 *(?:\\n+|$)';

export const Fences: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Fences,
    // ```language (c, c++, rust, js, typescript, ...)
    // some code
    // ```
    fences,
    ($, _, fences, lang, text) => {
        pushToken($, { $: BlockTag.Code, l: lang, _: text || '' });
    }
];

const dollars = ' *(\\${3,})[ \\.]*(\\S+)? *\\n([\\s\\S]*?)\\n? *\\1 *(?:\\n+|$)';

export const MathBlock: BlockRule<BlockMath, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Math,
    // $$$specificator (tex, latex, dot, ...)
    // some math
    // $$$
    dollars,
    ($, _, dollars, spec, text) => {
        pushToken($, { $: BlockTag.Math, s: spec, _: text || '' });
    }
];

export const Heading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    // # Heading 1 #
    // ## Heading 2 ##
    // ### Heading 3 ###
    heading,
    ($, _, sharps, text) => {
        if (text.charAt(0) == '#') {
            reject($);
        } else {
            parseHeading($, sharps.length, text);
        }
    },
    initHeading,
    [BlockTag.Heading],
    procHeading
];

export const LHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.LHeading,
    // Heading 1
    // =========
    // Heading 2
    // ---------
    lheading,
    ($, _, text, underscore) => {
        parseHeading($, underscore == '=' ? 1 : 2, text);
    },
    initHeading,
    [BlockTag.Heading],
    procHeading
];

export const GfmHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    // # Heading 1
    // ## Heading 2
    // ### Heading 3
    ' *(#{1,6}) +([^\\n]+?) *#* *(?:\\n+|$)',
    ($, _, sharps, text) => {
        parseHeading($, sharps.length, text);
    },
    initHeading,
    [BlockTag.Heading],
    procHeading
];

function initHeading(m: MetaHeadings) {
    m.h = [];
}

function parseHeading($: BlockHandle<BlockHeading<UnknownToken>, MetaHeadings>, level: number, text: string) {
    const index = $.m.h.length;
    $.m.h.push({ n: level } as MetaHeading);
    pushToken($, { $: BlockTag.Heading, i: index, n: level, _: text as any });
}

function procHeading($: BlockHandle<BlockHeading<UnknownToken>, MetaHeadings>, token: TokenType<BlockHeading<UnknownToken>>) {
    const heading = $.m.h[token.i];
    token._ = parseNest($, token._ as any, ContextTag.Inline);
    heading.t = extractText(token._);
}

export interface TokenWithNested {
    _?: string | TokenWithNested[];
}

export function extractText(tokens: TokenWithNested[]): string {
    const chunks: string[] = [];
    for (const token of tokens) {
        chunks.push(typeof token._ == 'string' ? token._ :
            token._ ? extractText(token._) : '');
    }
    return chunks.join('');
}

export const Hr: BlockRule<BlockHr, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Hr,
    // - - -
    // _ _ _
    // * * *
    hr,
    $ => { pushToken($, { $: BlockTag.Hr }); }
];

export const Quote: BlockRule<BlockQuote<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Quote,
    // > some
    // > block
    // > quote
    substRe('( {0,3}> ?(paragraph|[^\\n]*)(?:\\n|$))+', {
        paragraph
    }),
    ($, text) => {
        pushToken($, {
            $: BlockTag.Quote,
            _: parseNest($, text.replace(/^ *> ?/gm, ''), ContextTag.Block)
        });
    },
    [BlockTag.Quote],
    procBlocks
];

export function procBlocks<BlockTokenMap extends { [tag: number]: BlockPhrase<BlockTokenMap> }, Meta>($: BlockHandle<BlockTokenMap, Meta>, token: TokenType<BlockTokenMap>) {
    procNest($, token._);
}

export const Paragraph: BlockRule<BlockParagraph<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.Paragraph,
    paragraph,
    ($, text) => {
        pushToken($, {
            $: BlockTag.Paragraph,
            _: text
                //.replace(/^ +/, '')
                .replace(/\n$/, '') as any
        });
    },
    [BlockTag.Paragraph],
    procInlines
];

export function gfmParagraph([ctxs, order, regex, parse, tags, proc]: BlockRule<BlockParagraph<UnknownToken>, NoMeta>): BlockRule<BlockParagraph<UnknownToken>, NoMeta> {
    return [
        ctxs,
        order,
        substRe(regex, {
            '\\(\\?!': `(?!${shiftRe(fences, 1)}|${shiftRe(list, 2)}|`
        }),
        parse,
        tags as BlockTag.Paragraph[],
        proc as ProcFunc<ContextMap<BlockParagraph<UnknownToken>, UnknownToken, NoMeta>, ContextTag.Block, NoMeta>
    ];
}

export const GfmParagraph = gfmParagraph(Paragraph);

export const TextBlock: BlockRule<BlockText<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Text,
    '([^\\n]+)\\n?',
    ($, _, text) => {
        const token = lastToken($);
        // join with previous text token when it possible
        if (token && token.$ == BlockTag.Text) {
            (token._ as any) += (token._ ? '\n' : '') + text;
        } else {
            pushToken($, {
                $: BlockTag.Text,
                _: text as any
            });
        }
    },
    [BlockTag.Text],
    procInlines
];

export function procInlines<BlockTokenMap extends { [tag: number]: BlockPhrase<InlineTokenMap> }, InlineTokenMap, Meta>($: BlockHandle<BlockTokenMap, Meta>, token: TokenType<BlockTokenMap>) {
    token._ = parseNest($, token._ as any, ContextTag.Inline);
}

export const List: BlockRule<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.List,
    // * Item 1
    // * Item 2
    // * Item 3
    // 1. Item
    // 2. Item
    // 3. Item
    // * [ ] Incomplete task
    // * [x] Complete task
    list,
    ($, str, { }, bull) => { parseList($, str, bull, false); },
    [BlockTag.List, BlockTag.OrdList],
    procList
];

export const SmartList: BlockRule<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.List,
    // * Item 1
    // * Item 2
    // * Item 3
    // 1. Item
    // 2. Item
    // 3. Item
    // * [ ] Incomplete task
    // * [x] Complete task
    list,
    ($, str, { }, bull) => { parseList($, str, bull, true); },
    [BlockTag.List, BlockTag.OrdList],
    procList
];

function procList($: BlockHandle<BlockList<UnknownToken> | BlockOrdList<UnknownToken> | BlockFootnotes<UnknownToken>, NoMeta>, token: TokenType<BlockList<UnknownToken> | BlockOrdList<UnknownToken> | BlockFootnotes<UnknownToken>>) {
    for (const item of token._) {
        procNest($, item._, ContextTag.BlockNest);
    }
}

function parseList($: BlockHandle<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta>, str: string, bull: string, smart: boolean) {
    const ordered = bull.length > 1;
    const items: BlockListItem<UnknownToken>[] = [];

    // Get each top-level item.
    const cap = str.match(item_re);

    if (!cap) {
        reject($);
        return;
    }

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
        if (smart && i !== l - 1) {
            const b_cap = bull_re.exec(cap[i + 1]);
            if (!b_cap) {
                reject($);
                return;
            }
            const b = b_cap[0];
            if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                backpedal($, cap.slice(i + 1).join('\n'));
                i = l - 1;
            }
        }

        const item = {} as BlockListItem<UnknownToken>;

        if (!loose) {
            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            if (next || /\n\n(?!\s*$)/.test(item_src)) loose = true;

            if (i !== l - 1) {
                next = item_src.charAt(item_src.length - 1) === '\n';
                if (next) loose = true;
            }
        }

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
        for (const item of items) {
            textBlocksToParagraphs(item._);
        }
    }

    const list = {
        $: ordered ? BlockTag.OrdList : BlockTag.List,
        _: items
    } as TokenType<BlockList<UnknownToken> | BlockOrdList<UnknownToken>>;

    if (ordered && bull != '1.') (list as TokenType<BlockOrdList<UnknownToken>>).s = +bull;

    pushToken($, list);
}

export function textBlocksToParagraphs(tokens: TokenType<BlockParagraph<UnknownToken> | BlockText<UnknownToken>>[]) {
    for (const token of tokens) {
        if (token.$ == BlockTag.Text) {
            (token as any).$ = BlockTag.Paragraph;
        }
    }
}

const label = '(?!\\s*\\])(?:\\\\[\\[\\]]|[^\\[\\]])+';

export const Def: BlockRule<void, MetaLinks> = [
    [ContextTag.Block],
    BlockOrder.Def,
    // [blog](http://blog.example.com/ "My blog")
    substRe(' {0,3}\\[(label)\\]: *\\n? *<?([^\\s>]+)>?(?:(?: +\\n? *| *\\n *)(title))? *(?:\\n+|$)', {
        label,
        title: '(?:"(?:\\\\"?|[^"\\\\])*"|\'[^\'\\n]*(?:\\n[^\'\\n]+)*\\n?\'|\\([^()]*\\))'
    }),
    parseDef,
    initDef
];

export const PedanticDef: BlockRule<void, MetaLinks> = [
    [ContextTag.Block],
    BlockOrder.Def,
    // [blog](http://blog.example.com/ "My blog")
    ' *\\[([^\\]]+)\\]: *<?([^\\s>]+)>?(?: +(["(][^\\n]+[")]))? *(?:\\n+|$)',
    parseDef,
    initDef
];

function initDef(m: MetaLinks) {
    m.l = {};
}

function parseDef($: BlockHandle<void, MetaLinks>, _: string, label: string, href: string, title?: string) {
    if (title) title = title.substring(1, title.length - 1);

    label = label.toLowerCase().replace(/\s+/g, ' ');

    if (!$.m.l[label]) {
        $.m.l[label] = {
            l: href,
            t: title
        };
    }
}

export const AbbrevBlock: BlockRule<void, MetaAbbrevs> = [
    [ContextTag.Block],
    BlockOrder.Abbrev,
    // *[HTML]: Hyper Text Markup Language
    substRe(' {0,3}\\*\\[(label)\\]: *\\n? *([^\\n]+) *(?:\\n+|$)', { label }),
    ({ m: { a } }, { }, word, desc) => {
        if (!a[word]) a[word] = desc;
    },
    (m: MetaAbbrevs) => { m.a = {}; }
];

export const FootnotesBlock: BlockRule<BlockFootnotes<UnknownToken>, MetaFootnotes> = [
    [ContextTag.Block],
    BlockOrder.Footnotes,
    // [^1]: Long definition
    //     With optional
    //     indented contents
    ' {0,3}\\[\\^([^\\]]+)\\]: *([^\\n]+)? *(?:\\n+|$)((?: {4}[^\\n]+\\n*)+)?',
    ($, { }, anchor, text, block) => {
        const { m: { f } } = $;
        if (f.indexOf(anchor) < 0) {
            const nested: UnknownToken[] = parseNest($, (text || '') + (block ? block.replace(/^ {4}/gm, '') : ''), ContextTag.BlockNest);
            if (block) textBlocksToParagraphs(nested);
            let token = lastToken($);
            if (!token || token.$ != BlockTag.Footnotes) {
                // push new
                pushToken($, token = {
                    $: BlockTag.Footnotes,
                    i: f.length,
                    _: []
                });
            }
            // add note
            token._.push({ i: f.length, l: anchor, _: nested });
            f.push(anchor);
        }
    },
    (m: MetaFootnotes) => { m.f = []; },
    [BlockTag.Footnotes],
    procList
];

export const NpTable: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.NpTable,
    // Header 1 | Header 2
    // :------- | -------:
    // Cell 1:1 | Cell 1:2
    // Cell 2:1 | Cell 2:2
    ' *([^|\\n ].*\\|.*)\\n *([-:]+ *\\|[-| :]*)(?:\\n((?:.*[^>\\n ].*(?:\\n|$))*)\\n*|$)',
    parseTable,
    [BlockTag.Table],
    procTable
];

export const Table: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.Table,
    // | Header 1 | Header 2 |
    // | :------- | -------: |
    // | Cell 1:1 | Cell 1:2 |
    // | Cell 2:1 | Cell 2:2 |
    ' *\\|(.+)\\n *\\|?( *[-:]+[-| :]*)(?:\\n((?: *[^>\\n ].*(?:\\n|$))*)\\n*|$)',
    parseTable,
    [BlockTag.Table],
    procTable
];

function parseTable($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, _: string, header: string, align: string, cells: string) {
    const h = parseRow($, header.replace(/^ *| *\| *$/g, ''));
    const a = align.replace(/^ *|\| *$/g, '').split(/ *\| */)
        .map(hint => /^ *-+: *$/.test(hint) ? BlockAlign.Right :
            /^ *:-+: *$/.test(hint) ? BlockAlign.Center :
                /^ *:-+ *$/.test(hint) ? BlockAlign.Left :
                    BlockAlign.None);
    if (h.length == a.length) {
        pushToken($, {
            $: BlockTag.Table,
            h,
            a,
            _: cells ? cells.replace(/(?: *\| *)?\n$/, '').split('\n')
                .map(row => parseRow($, row.replace(/^ *\| *| *\| *$/g, ''), h.length)) : []
        });
    } else {
        reject($);
    }
}

function parseRow($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, srcRow: string, count?: number): BlockTableRow<any> {
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

function procTable($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, token: TokenType<BlockTable<UnknownToken>>) {
    for (const cell of token.h) {
        procNest($, cell, ContextTag.BlockNest);
    }
    for (const row of token._) {
        for (const cell of row) {
            procNest($, cell, ContextTag.BlockNest);
        }
    }
}

export const BlockNormal = [Newline, CodeBlock, Heading, Hr, Quote, List, Def, LHeading, Paragraph, TextBlock];

export const BlockPedantic = [Newline, CodeBlock, Heading, Hr, Quote, List, PedanticDef, LHeading, Paragraph, TextBlock];

export const BlockGfm = [Newline, CodeBlock, Fences, GfmHeading, Hr, Quote, List, Def, LHeading, GfmParagraph, TextBlock];

export const BlockGfmTables = [...BlockGfm, NpTable, Table];
