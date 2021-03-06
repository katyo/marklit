import { backpedal, reject } from '../match';
import { ParserHandle, ParserRule, parseNest, lastToken, pushToken, pushText } from '../parser';
import { substRe } from '../regex';
import {
    ContextTag, ContextMap,
    NoMeta,
    UnknownToken, TokenType
} from '../model';
import {
    MetaLinks, MetaAbbrevs, MetaFootnotes
} from '../block/model';
import {
    InlineTag, InlineOrder,
    InlineLink, InlineImage,
    InlineAbbrev, InlineFootnote,
    InlineStrong, InlineEm, InlineDel,
    InlineCode, InlineMath,
    InlineBr, InlineText
} from './model';

export type InlineRule<InlineTokenMap, Meta> = ParserRule<ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline | ContextTag.InlineLink, Meta>;

export type InlineHandle<InlineTokenMap, Meta> = ParserHandle<ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline | ContextTag.InlineLink, Meta>;

const escape = '\\\\([!"#$%&\'()*+,\\-.\\/:;<=>?@\\[\\]\\\\^_`{|}~])';

const escape_re = new RegExp(escape, 'g');

function escapes(src: string): string {
    return src.replace(escape_re, '$1');
}

export const Escape: InlineRule<InlineText, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    escape,
    ($, _, char) => { pushText($, InlineTag.Text, char) }
];

const email = '[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])';

export const AutoLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.AutoLink,
    // <http://example.com/>
    // <mailbox@example.com>
    substRe('<(scheme:[^\\s\\x00-\\x1f<>]*|email)>', {
        scheme: '[a-zA-Z][a-zA-Z0-9+.-]{1,31}',
        email
    }),
    ($, _, url, at) => {
        pushToken($, {
            $: InlineTag.Link,
            l: (at ? 'mailto:' : '') + url,
            _: [{ $: InlineTag.Text, _: url }]
        });
    }
];

export const Url: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Url,
    // http://example.com/
    // www.example.com
    // mailbox@example.com
    substRe('((?:ftp|https?):\\/\\/|www\\.)(?:[a-zA-Z0-9\\-]+\\.?)+[^\\s<]*|email', { email }),
    ($, text, url, at) => {
        const _text = text;
        for (; ;) {
            const text_ = text;
            ([text] = /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/.exec(text) as RegExpMatchArray);
            if (text_ === text) {
                break;
            }
        }

        if (_text != text) {
            backpedal($, _text.substring(text.length));
        }

        pushToken($, {
            $: InlineTag.Link,
            l: at ? `mailto:${text}` : url == 'www.' ? `http://${text}` : text,
            _: [{ $: InlineTag.Text, _: text }]
        });
    }
];

const label = '(?:\\[[^\\[\\]]*\\]|\\\\[\\[\\]]?|`[^`]*`|[^\\[\\]\\\\])*?';

export const Link: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Link,
    // [my blog](http://blog.example.com/ "this is link to my blog")
    // ![nyan cat](/nyan-cat.gif)
    substRe('!?\\[(label)\\]\\(href(?:\\s+(title))?\\s*\\)', {
        label,
        href: '\\s*(<(?:\\\\[<>]?|[^\\s<>\\\\])*>|(?:\\\\[()]?|\\([^\\s\\x00-\\x1f\\\\]*\\)|[^\\s\\x00-\\x1f()\\\\])*?)',
        title: '"(?:\\\\"?|[^"\\\\])*"|\'(?:\\\\\'?|[^\'\\\\])*\'|\\((?:\\\\\\)?|[^)\\\\])*\\)',
    }),
    ($, link: string, text: string, href: string, title?: string) => {
        procLink($, link, text, href, title ? title.slice(1, -1) : '');
    }
];

export const PedanticLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Link,
    // [my blog](http://blog.example.com/ "this is link to my blog")
    // ![nyan cat](/nyan-cat.gif)
    substRe('!?\\[(label)\\]\\((.*?)\\)', { label }),
    ($, link: string, text: string, href: string, title?: string) => {
        const m = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

        if (m) {
            [, href, , title] = m;
        } else {
            title = '';
        }

        procLink($, link, text, href, title);
    }
];

function procLink($: InlineHandle<InlineLink<UnknownToken>, NoMeta>, link: string, text: string, href: string, title: string) {
    parseLink($, link, text, escapes(href.trim().replace(/^<([\s\S]*)>$/, '$1')), escapes(title));
}

export const RefLink: InlineRule<InlineLink<UnknownToken>, MetaLinks> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.RefLink,
    // [my blog][blog]
    // ![nyan cat][nyan-cat]
    substRe('!?\\[(label)\\]\\[(?!\\s*\\])((?:\\\\[\\[\\]]?|[^\\[\\]\\\\])+)\\]', { label }),
    procRefNoLink
];

export const PedanticRefLink: InlineRule<InlineLink<UnknownToken>, MetaLinks> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.RefLink,
    // [my blog][blog]
    // ![nyan cat][nyan-cat]
    substRe('!?\\[(label)\\]\\s*\\[([^\\]]*)\\]', { label }),
    procRefNoLink
];

export const NoLink: InlineRule<InlineLink<UnknownToken>, MetaLinks> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.NoLink,
    // [my blog]
    // ![nyan cat]
    '!?\\[(?!\\s*\\])((?:\\[[^\\[\\]]*\\]|\\\\[\\[\\]]|[^\\[\\]])*)\\](?:\\[\\])?',
    procRefNoLink
];

function procRefNoLink($: InlineHandle<InlineLink<UnknownToken> | InlineText, MetaLinks>, link: string, text: string, text2: string) {
    const id = (text2 || text).replace(/\s+/g, ' ').toLowerCase();
    const def = $.m.l[id];
    if (def && def.l) {
        parseLink($, link, text, id);
    } else {
        pushText($, InlineTag.Text, link.charAt(0));
        backpedal($, link.substring(1));
    }
}

export const Abbrev: InlineRule<InlineAbbrev, MetaAbbrevs> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Abbrev,
    // *[HTML]
    // *[HTML Hyper Text Markup Language]
    // *[HTML: Hyper Text Markup Language]
    // *[HTML|Hyper Text Markup Language]
    '\\*\\[([^ :\\|\\]]+)[ :\\|]?(?: *([^\\]]+))?\\]',
    ($, { }, word, desc) => {
        const { m: { a } } = $;
        if (a && !a[word] && desc) a[word] = desc;
        pushToken($, { $: InlineTag.Abbrev, t: desc, _: word });
    }
];

export const Footnote: InlineRule<InlineFootnote, MetaFootnotes> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Footnote,
    // Short term[^1]
    '\\[\\^([^\\]]+)\\]',
    ($, { }, anchor) => {
        pushToken($, { $: InlineTag.Footnote, l: anchor });
    }
];

export const Strong: InlineRule<InlineStrong<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    // **some important text**
    // __some important text__
    '__([^\\s])__(?!_)|^\\*\\*([^\\s])\\*\\*(?!\\*)|^__([^\\s][\\s\\S]*?[^\\s])__(?!_)|^\\*\\*([^\\s][\\s\\S]*?[^\\s])\\*\\*(?!\\*)',
    procStrong
];

export const PedanticStrong: InlineRule<InlineStrong<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    // **some important text**
    // __some important text__
    '__(?=\\S)([\\s\\S]*?\\S)__(?!_)|\\*\\*(?=\\S)([\\s\\S]*?\\S)\\*\\*(?!\\*)',
    procStrong
];

function procStrong($: InlineHandle<InlineStrong<UnknownToken>, NoMeta>, { }: string, _1: string, _2: string, _3: string, _4: string) {
    pushToken($, { $: InlineTag.Strong, _: parseNest($, _4 || _3 || _2 || _1) });
}

export const Em: InlineRule<InlineEm<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    // *some important text*
    // _some important text_
    '_([^\\s_])_(?!_)|^\\*([^\\s*"<\\[])\\*(?!\\*)|^_([^\\s][\\s\\S]*?[^\\s_])_(?!_)|^_([^\\s_][\\s\\S]*?[^\\s])_(?!_)|^\\*([^\\s"<\\[][\\s\\S]*?[^\\s*])\\*(?!\\*)|^\\*([^\\s*"<\\[][\\s\\S]*?[^\\s])\\*(?!\\*)',
    procEm
];

export const PedanticEm: InlineRule<InlineEm<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    // *some important text*
    // _some important text_
    '_(?=\\S)([\\s\\S]*?\\S)_(?!_)|\\*(?=\\S)([\\s\\S]*?\\S)\\*(?!\\*)',
    procEm
];

function procEm($: InlineHandle<InlineEm<UnknownToken>, NoMeta>, { }: string, _1: string, _2: string, _3: string, _4: string, _5: string, _6: string) {
    pushToken($, { $: InlineTag.Em, _: parseNest($, _6 || _5 || _4 || _3 || _2 || _1) });
}

export const Del: InlineRule<InlineDel<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Del,
    // ~~some striked text~~
    '~+(?=\\S)([\\s\\S]*?\\S)~+',
    ($, { }, text) => {
        pushToken($, { $: InlineTag.Del, _: parseNest($, text) });
    }
];

export const CodeSpan: InlineRule<InlineCode, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Code,
    // `some code`
    '(`+)\\s*([\\s\\S]*?[^`]?)\\s*\\1(?!`)',
    ($, { }, fences, text) => {
        pushToken($, { $: InlineTag.Code, _: text.replace(/\s+$/, '') });
    }
];

export const MathSpan: InlineRule<InlineMath, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Math,
    // $some math$
    '(\\$+)\\s*([\\s\\S]*?[^\\$]?)\\s*\\1(?!\\$)',
    ($, { }, delims, text) => {
        pushToken($, { $: InlineTag.Math, _: text.replace(/\s+$/, '') });
    }
];

export const Br: InlineRule<InlineBr, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    '(?: {2,}|\\\\)\\n(?!\\s*$)',
    $ => { pushToken($, { $: InlineTag.Br }) }
];

export function gfmBreaksBr([ctxs, order, regex, parse]: InlineRule<InlineBr, NoMeta>): InlineRule<InlineBr, NoMeta> {
    return [
        ctxs,
        order,
        substRe(regex, { '\\{2,\\}': '*' }),
        parse
    ];
}

export const GfmBreaksBr = gfmBreaksBr(Br);

export const TextSpan: InlineRule<InlineText, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    '[\\s\\S]+?(?=[\\\\<!\\[`*$]|\\b_| {2,}\\n|$)',
    ($, text) => { pushText($, InlineTag.Text, text.replace(/ +/g, ' ')); }
];

export function gfmText<Meta>([ctxs, order, regex, parse]: InlineRule<InlineText, Meta>): InlineRule<InlineText, Meta> {
    return [
        ctxs,
        order,
        substRe(regex, { '\\]\\|': '~]|https?://|ftp:\\/\\/|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|' }),
        parse
    ];
}

export const GfmTextSpan = gfmText(TextSpan);

export function gfmBreaksText<Meta>([ctxs, order, regex, parse]: InlineRule<InlineText, Meta>): InlineRule<InlineText, Meta> {
    return [
        ctxs,
        order,
        substRe(regex, { '\\{2,\\}': '*' }),
        parse
    ];
}

export const GfmBreaksTextSpan = gfmBreaksText(gfmText(TextSpan));

export function smartypants(chunk: string): string {
    return chunk
        // em-dashes
        .replace(/---/g, '\u2014')
        // en-dashes
        .replace(/--/g, '\u2013')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026');
}

export function smartyPantsText<Meta>([ctxs, order, regex, parse]: InlineRule<InlineText, Meta>): InlineRule<InlineText, Meta> {
    return [
        ctxs,
        order,
        regex,
        ($, text) => { parse($, smartypants(text)); }
    ];
}

export const SmartyPantsTextSpan = smartyPantsText(TextSpan);

export function abbrevText<Meta extends MetaAbbrevs>([ctxs, order, regex, parse]: InlineRule<InlineText, Meta>): InlineRule<InlineText & InlineAbbrev, Meta> {
    return [
        ctxs,
        order,
        regex,
        ($, text) => {
            parse($, text);
            const token = lastToken($) as TokenType<InlineText>;
            const { m: { a } } = $;
            if (a && !($ as any).a_) {
                // compile regexp using abbrevs
                ($ as any).a_ = new RegExp('(' + Object.keys(a).join('|') + ')');
            }
            const chunks = token._.split(($ as any).a_);
            if (chunks.length) {
                token._ = chunks[0];
                for (let i = 1; i < chunks.length; i++) {
                    pushToken($, i % 2 ?
                        { $: InlineTag.Abbrev, _: chunks[i] } :
                        { $: InlineTag.Text, _: chunks[i] });
                }
            }
        }
    ];
}

export const AbbrevTextSpan = abbrevText(TextSpan);

function parseLink($: InlineHandle<InlineLink<UnknownToken> | InlineImage | InlineText, NoMeta>, link: string, text: string, href: string, title?: string) {
    const islink = link.charAt(0) != '!';
    if ($.c == ContextTag.InlineLink && islink) {
        reject($);
    } else {
        const token: TokenType<InlineLink<UnknownToken> & InlineImage> = islink
            ? { $: InlineTag.Link, l: href, _: parseNest($, text, ContextTag.InlineLink) }
            : { $: InlineTag.Image, l: href, _: text };
        if (title) token.t = title;
        pushToken($, token);
    }
}

// rulesets
export const InlineNormal = [Escape, AutoLink, Link, RefLink, NoLink, Strong, Em, CodeSpan, Br, TextSpan];

export const InlinePedantic = [Escape, AutoLink, PedanticLink, PedanticRefLink, NoLink, PedanticStrong, PedanticEm, CodeSpan, Br, TextSpan];

export const InlineGfm = [Escape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, Br, GfmTextSpan];

export const InlineGfmBreaks = [Escape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, GfmBreaksBr, GfmBreaksTextSpan];
