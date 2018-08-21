import { backpedal, reject } from '../match';
import { ParserHandle, ParserRule, parseNest, pushToken } from '../parser';
import { substRe, shiftRe } from '../regex';
import {
    ContextTag, ContextMap,
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

export const Newline: BlockRule<void, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Newline,
    '\\n+',
    () => { }
];

export const CodeBlock: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Code,
    '( {4}[^\\n]+\\n*)+',
    ($, text) => {
        pushToken($, { $: BlockTag.Code, _: text.replace(/^ {4}/gm, '') });
    }
];

const fences = ' *(`{3,}|~{3,})[ \\.]*(\\S+)? *\\n([\\s\\S]*?)\\n? *\\1 *(?:\\n+|$)';

export const Fences: BlockRule<BlockCode, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Code,
    fences,
    ($, _, lang, text) => {
        pushToken($, { $: BlockTag.Code, _: text ? text.replace(/^ {4}/gm, '') : '' });
    }
];

export const Heading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    heading,
    ($, _, sharps, text) => {
        if (text.charAt(0) == '#') {
            reject($);
        } else {
            procHeading($, sharps.length, text);
        }
    },
    initHeading
];

export const LHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.LHeading,
    lheading,
    ($, _, text, underscore) => {
        procHeading($, underscore == '=' ? 1 : 2, text);
    },
    initHeading
];

export const GfmHeading: BlockRule<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Heading,
    ' *(#{1,6}) +([^\\n]+?) *#* *(?:\\n+|$)',
    ($, _, sharps, text) => {
        procHeading($, sharps.length, text);
    },
    initHeading
];

function initHeading(m: MetaHeadings<UnknownToken>) {
    m.headings = [];
}

function procHeading($: BlockHandle<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>>, level: number, text: string) {
    const index = $.m.headings.length;
    const content = parseNest({ ...$ }, text, ContextTag.Inline);
    $.m.headings.push({ t: extractText(content), n: level, _: content });
    pushToken($, { $: BlockTag.Heading, i: index, n: level, _: content });
}

interface TokenWithNested {
    _?: string | (TokenWithNested | string)[];
}

function extractText(tokens: (TokenWithNested | string)[]): string {
    const chunks: string[] = [];
    for (const token of tokens) {
        chunks.push(typeof token == 'string' ? token :
            typeof token._ == 'string' ? token._ :
                token._ ? extractText(token._) : '');
    }
    return chunks.join('');
}

export const Hr: BlockRule<BlockHr, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Hr,
    hr,
    $ => {
        pushToken($, { $: BlockTag.Hr });
    }
];

export const Quote: BlockRule<BlockQuote<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Quote,
    substRe('( {0,3}> ?(paragraph|[^\\n]*)(?:\\n|$))+', {
        paragraph
    }),
    ($, text) => {
        pushToken($, {
            $: BlockTag.Quote,
            _: parseNest($, text.replace(/^ *> ?/gm, ''))
        });
    }
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

function procParagraph($: BlockHandle<BlockParagraph<UnknownToken>, NoMeta>, text: string) {
    const contents = parseNest($,
        text
            //.replace(/^ +/, '')
            .replace(/\n$/, ''),
        ContextTag.Inline);
    if (contents.length) pushToken($, {
        $: BlockTag.Paragraph,
        _: contents
    });
}

export const TextBlock: BlockRule<BlockText<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.Text,
    '[^\\n]+',
    ($, text) => {
        pushToken($, {
            $: BlockTag.Text,
            _: parseNest($, text, ContextTag.Inline)
        });
    }
];

export const List: BlockRule<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta> = [
    [ContextTag.Block, ContextTag.BlockNest],
    BlockOrder.List,
    list,
    ($, str, { }, bull) => {
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
            if (/* smartLists && */i !== l - 1) {
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

        pushToken($, list);
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

function procDef($: BlockHandle<void, MetaLinks>, _: string, label: string, href: string, title?: string) {
    if (title) title = title.substring(1, title.length - 1);

    $.m.links[label.toLowerCase().replace(/\s+/g, ' ')] = {
        l: href,
        t: title
    };
}

export const NpTable: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.List,
    ' *([^|\\n ].*\\|.*)\\n *([-:]+ *\\|[-| :]*)(?:\\n((?:.*[^>\\n ].*(?:\\n|$))*)\\n*|$)',
    procTable,
];

export const Table: BlockRule<BlockTable<UnknownToken>, NoMeta> = [
    [ContextTag.Block],
    BlockOrder.List,
    ' *\\|(.+)\\n *\\|?( *[-:]+[-| :]*)(?:\\n((?: *[^>\\n ].*(?:\\n|$))*)\\n*|$)',
    procTable,
];

function procTable($: BlockHandle<BlockTable<UnknownToken>, NoMeta>, _: string, header: string, align: string, cells: string) {
    const h = procRow($, header.replace(/^ *| *\| *$/g, ''));
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
                .map(row => procRow($, row.replace(/^ *\| *| *\| *$/g, ''), h.length)) : []
        });
    } else {
        reject($);
    }
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
