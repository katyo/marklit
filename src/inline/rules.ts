import { ParserHandle, ParserRule, parseNest } from '../parser';
import { substRe } from '../regex';
import {
    ContextTag, ContextMap,
    NoMeta, AsUnion,
    UnknownToken
} from '../model';
import {
    InlineTag, InlineOrder,
    InlineLink, InlineImage, InlineStrong, InlineEm, InlineDel, InlineCode, InlineMath, InlineBr
} from './model';

export type InlineRule<InlineTokenMap, Meta> = ParserRule<ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline | ContextTag.InlineLink, Meta>;

export type InlineHandle<InlineTokenMap, Meta> = ParserHandle<ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline | ContextTag.InlineLink, Meta>;

const escape = '\\\\([!"#$%&\'()*+,\\-.\\/:;<=>?@\\[\\]\\\\^_`{}])';

export const Escape: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    escape,
    procEscape
];

export const GfmEscape: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    substRe(escape, { '\\]\\)': '~|])' }),
    procEscape
];

function procEscape({ }: InlineHandle<string, NoMeta>, src: string, { }: string, char: string): [string, string] {
    return [char, src];
}

const email = '[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])';

export const AutoLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.AutoLink,
    substRe('<(scheme:[^\\s\\x00-\\x1f<>]*|email)>', {
        scheme: '[a-zA-Z][a-zA-Z0-9+.-]{1,31}',
        email
    }),
    ({ }, src, { }, url, at) => [{ $: InlineTag.Link, l: (at ? 'mailto:' : '') + url, _: [url] }, src]
];

export const Url: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Url,
    substRe('((?:ftp|https?):\\/\\/|www\\.)(?:[a-zA-Z0-9\\-]+\\.?)+[^\\s<]*|email', { email }),
    ({ }, src, text, url, at) => {
        src = `${text}${src}`;
        let prev_text;
        do {
            prev_text = text;
            ([text] = /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/.exec(text) as RegExpMatchArray);
        } while (prev_text !== text);
        return [{ $: InlineTag.Link, l: at ? `mailto:${text}` : url == 'www.' ? `http://${text}` : text, _: [text] }, src.substring(text.length)];
    }
];

const label = '(?:\\[[^\\[\\]]*\\]|\\\\[\\[\\]]?|`[^`]*`|[^\\[\\]\\\\])*?';

export const Link: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Link,
    substRe('!?\\[(label)\\]\\(href(?:\\s+(title))?\\s*\\)', {
        label,
        href: '\\s*(<(?:\\\\[<>]?|[^\\s<>\\\\])*>|(?:\\\\[()]?|\\([^\\s\\x00-\\x1f\\\\]*\\)|[^\\s\\x00-\\x1f()\\\\])*?)',
        title: '"(?:\\\\"?|[^"\\\\])*"|\'(?:\\\\\'?|[^\'\\\\])*\'|\\((?:\\\\\\)?|[^)\\\\])*\\)',
    }),
    procLink
];

export const PedanticLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Link,
    substRe('!?\\[(label)\\]\\((.*?)\\)', { label }),
    procLink
];

function procLink($: InlineHandle<InlineLink<UnknownToken>, NoMeta>, src: string, link: string, text: string, href: string, title?: string): [AsUnion<InlineLink<UnknownToken>>, string] {
    return [
        parseLink($, link, text, href.trim().replace(/^<([\s\S]*)>$/, '$1'), title ? title.slice(1, -1) : '') as AsUnion<InlineLink<UnknownToken>>,
        src
    ];
}

export const RefLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.RefLink,
    substRe('!?\\[(label)\\]\\[(?!\\s*\\])((?:\\\\[\\[\\]]?|[^\\[\\]\\\\])+)\\]', { label }),
    procRefNoLink
];

export const PedanticRefLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.RefLink,
    substRe('!?\\[(label)\\]\\s*\\[([^\\]]*)\\]', { label }),
    procRefNoLink
];

export const NoLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.NoLink,
    '!?\\[(?!\\s*\\])((?:\\[[^\\[\\]]*\\]|\\\\[\\[\\]]|[^\\[\\]])*)\\](?:\\[\\])?',
    procRefNoLink
];

function procRefNoLink($: InlineHandle<InlineLink<UnknownToken>, NoMeta>, src: string, link: string, text: string, text2: string): [AsUnion<InlineLink<UnknownToken>>, string] {
    const ref = (text2 || text).replace(/\s+/g, ' ').toLowerCase();
    return [
        parseLink($, link, text, ref) as AsUnion<InlineLink<UnknownToken>>,
        src
    ];
}

export const Strong: InlineRule<InlineStrong<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    '__([^\\s])__(?!_)|^\\*\\*([^\\s])\\*\\*(?!\\*)|^__([^\\s][\\s\\S]*?[^\\s])__(?!_)|^\\*\\*([^\\s][\\s\\S]*?[^\\s])\\*\\*(?!\\*)',
    procStrong
];

export const PedanticStrong: InlineRule<InlineStrong<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    '__(?=\\S)([\\s\\S]*?\\S)__(?!_)|\\*\\*(?=\\S)([\\s\\S]*?\\S)\\*\\*(?!\\*)',
    procStrong
];

function procStrong($: InlineHandle<InlineStrong<UnknownToken>, NoMeta>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string): [AsUnion<InlineStrong<UnknownToken>>, string] {
    return [{ $: InlineTag.Strong, _: parseNest($, _4 || _3 || _2 || _1) }, src];
}

export const Em: InlineRule<InlineEm<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    '_([^\\s_])_(?!_)|^\\*([^\\s*"<\\[])\\*(?!\\*)|^_([^\\s][\\s\\S]*?[^\\s_])_(?!_)|^_([^\\s_][\\s\\S]*?[^\\s])_(?!_)|^\\*([^\\s"<\\[][\\s\\S]*?[^\\s*])\\*(?!\\*)|^\\*([^\\s*"<\\[][\\s\\S]*?[^\\s])\\*(?!\\*)',
    procEm
];

export const PedanticEm: InlineRule<InlineEm<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    '_(?=\\S)([\\s\\S]*?\\S)_(?!_)|\\*(?=\\S)([\\s\\S]*?\\S)\\*(?!\\*)',
    procEm
];

function procEm($: InlineHandle<InlineEm<UnknownToken>, NoMeta>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string, _5: string, _6: string): [AsUnion<InlineEm<UnknownToken>>, string] {
    return [{ $: InlineTag.Em, _: parseNest($, _6 || _5 || _4 || _3 || _2 || _1) }, src];
}

export const Del: InlineRule<InlineDel<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Del,
    '~+(?=\\S)([\\s\\S]*?\\S)~+',
    ($, src, { }, text) => [{ $: InlineTag.Del, _: parseNest($, text) }, src]
];

export const CodeSpan: InlineRule<InlineCode, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Code,
    '(`+)\\s*([\\s\\S]*?[^`]?)\\s*\\1(?!`)',
    ({ }, src, { }, fences, text) => [{ $: InlineTag.Code, _: text.replace(/\s+$/, '') }, src]
];

export const MathSpan: InlineRule<InlineMath, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Math,
    '(\\$+)\\s*([\\s\\S]*?[^\\$]?)\\s*\\1(?!\\$)',
    ({ }, src, { }, delims, text) => [{ $: InlineTag.Math, _: text.replace(/\s+$/, '') }, src]
];

const br = '(?: {2,}|\\\\)\\n(?!\\s*$)';

export const Br: InlineRule<InlineBr, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    br,
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

export const GfmBreaksBr: InlineRule<InlineBr, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    substRe(br, { '\\{2,\\}': '*' }),
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

const text = '[\\s\\S]+?(?=[\\\\<!\\[`*$]|\\b_| {2,}\\n|$)';

export const TextSpan: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    text,
    procText
];

const gfm_text = substRe(text, { '\\]\\|': '~]|https?://|ftp:\\/\\/|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|' });

export const GfmTextSpan: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    gfm_text,
    procText
];

export const GfmBreaksTextSpan: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    substRe(gfm_text, { '\\{2,\\}': '*' }),
    procText
];

function procText({ }: InlineHandle<string, NoMeta>, src: string, text: string): [string, string] {
    return [text, src];
}

function parseLink($: InlineHandle<InlineLink<UnknownToken> | InlineImage, NoMeta>, link: string, text: string, href: string, title?: string): AsUnion<InlineLink<UnknownToken> & InlineImage> {
    const token: AsUnion<InlineLink<UnknownToken> & InlineImage> = link.charAt(0) != '!'
        ? { $: InlineTag.Link, l: href, _: parseNest($, text, ContextTag.InlineLink) }
        : { $: InlineTag.Image, l: href, _: text };
    if (title) (token as AsUnion<InlineLink<UnknownToken>>).t = title;
    return token;
}

// rulesets
export const InlineNormal = [Escape, AutoLink, Link, RefLink, NoLink, Strong, Em, CodeSpan, Br, TextSpan];

export const InlinePedantic = [Escape, AutoLink, PedanticLink, PedanticRefLink, NoLink, PedanticStrong, PedanticEm, CodeSpan, Br, TextSpan];

export const InlineGfm = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, Br, GfmTextSpan];

export const InlineGfmBreaks = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, GfmBreaksBr, GfmBreaksTextSpan];
