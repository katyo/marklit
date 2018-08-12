import { ParserHandle, ParserRule, parseNest } from '../parser';
import { substRe } from '../regex';
import {
    ContextTag, ContextMap,
    AnyMeta, AsUnion
} from '../model';
import {
    InlineTag, InlineOrder,
    InlineLink, InlineImage, InlineStrong, InlineEm, InlineDel, InlineCode, InlineMath, InlineBr
} from './model';

export type UnknownInlineToken = any;

export type InlineRule<InlineTokenMap, Meta> = ParserRule<ContextMap<UnknownInlineToken, InlineTokenMap, Meta>, ContextTag>;

export type InlineHandle<InlineTokenMap, Meta> = ParserHandle<ContextMap<UnknownInlineToken, InlineTokenMap, Meta>, ContextTag>;

const escape = '\\\\([!"#$%&\'()*+,\\-.\\/:;<=>?@\\[\\]\\\\^_`{}])';

export const Escape: InlineRule<string, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    escape,
    procEscape
];

export const GfmEscape: InlineRule<string, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    substRe(escape, { '\\]\\)': '~|])' }),
    procEscape
];

function procEscape({ }: InlineHandle<string, AnyMeta>, src: string, { }: string, char: string): [string, string] {
    return [char, src];
}

const email = '[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])';

export const AutoLink: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.AutoLink,
    substRe('<(scheme:[^\\s\\x00-\\x1f<>]*|email)>', {
        scheme: '[a-zA-Z][a-zA-Z0-9+.-]{1,31}',
        email
    }),
    ({ }, src, { }, url, at) => [{ $: InlineTag.Link, l: (at ? 'mailto:' : '') + url, _: [url] }, src]
];

export const Url: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
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

export const Link: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.Link,
    substRe('!?\\[(label)\\]\\(href(?:\\s+(title))?\\s*\\)', {
        label,
        href: '\\s*(<(?:\\\\[<>]?|[^\\s<>\\\\])*>|(?:\\\\[()]?|\\([^\\s\\x00-\\x1f()\\\\]*\\)|[^\\s\\x00-\\x1f()\\\\])*?)',
        title: '"(?:\\\\"?|[^"\\\\])*"|\'(?:\\\\\'?|[^\'\\\\])*\'|\\((?:\\\\\\)?|[^)\\\\])*\\)',
    }),
    procLink
];

export const PedanticLink: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.Link,
    substRe('!?\\[(label)\\]\\((.*?)\\)', { label }),
    procLink
];

function procLink($: InlineHandle<InlineLink<UnknownInlineToken>, AnyMeta>, src: string, link: string, text: string, href: string, title?: string): [AsUnion<InlineLink<UnknownInlineToken>>, string] {
    return [
        parseLink($, link, text, href.trim().replace(/^<([\s\S]*)>$/, '$1'), title ? title.slice(1, -1) : '') as AsUnion<InlineLink<UnknownInlineToken>>,
        src
    ];
}

export const RefLink: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.RefLink,
    substRe('!?\\[(label)\\]\\[(?!\\s*\\])((?:\\\\[\\[\\]]?|[^\\[\\]\\\\])+)\\]', { label }),
    procRefNoLink
];

export const PedanticRefLink: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.RefLink,
    substRe('!?\\[(label)\\]\\s*\\[([^\\]]*)\\]', { label }),
    procRefNoLink
];

export const NoLink: InlineRule<InlineLink<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline],
    InlineOrder.NoLink,
    '!?\\[(?!\\s*\\])((?:\\[[^\\[\\]]*\\]|\\\\[\\[\\]]|[^\\[\\]])*)\\](?:\\[\\])?',
    procRefNoLink
];

function procRefNoLink($: InlineHandle<InlineLink<UnknownInlineToken>, AnyMeta>, src: string, link: string, text: string, text2: string): [AsUnion<InlineLink<UnknownInlineToken>>, string] {
    const ref = (text2 || text).replace(/\s+/g, ' ').toLowerCase();
    return [
        parseLink($, link, text, ref) as AsUnion<InlineLink<UnknownInlineToken>>,
        src
    ];
}

export const Strong: InlineRule<InlineStrong<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    '__([^\\s][\\s\\S]*?[^\\s])__(?!_)|\\*\\*([^\\s][\\s\\S]*?[^\\s])\\*\\*(?!\\*)|__([^\\s])__(?!_)|\\*\\*([^\\s])\\*\\*(?!\\*)',
    procStrong
];

export const PedanticStrong: InlineRule<InlineStrong<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Strong,
    '__(?=\\S)([\\s\\S]*?\\S)__(?!_)|\\*\\*(?=\\S)([\\s\\S]*?\\S)\\*\\*(?!\\*)',
    procStrong
];

function procStrong($: InlineHandle<InlineStrong<UnknownInlineToken>, AnyMeta>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string): [AsUnion<InlineStrong<UnknownInlineToken>>, string] {
    return [{ $: InlineTag.Strong, _: parseNest($, _4 || _3 || _2 || _1) }, src];
}

export const Em: InlineRule<InlineEm<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    '_([^\\s][\\s\\S]*?[^\\s_])_(?!_)|_([^\\s_][\\s\\S]*?[^\\s])_(?!_)|\\*([^\\s][\\s\\S]*?[^\\s*])\\*(?!\\*)|\\*([^\\s*][\\s\\S]*?[^\\s])\\*(?!\\*)|_([^\\s_])_(?!_)|\\*([^\\s*])\\*(?!\\*)',
    procEm
];

export const PedanticEm: InlineRule<InlineEm<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Em,
    '_(?=\\S)([\\s\\S]*?\\S)_(?!_)|\\*(?=\\S)([\\s\\S]*?\\S)\\*(?!\\*)',
    procEm
];

function procEm($: InlineHandle<InlineEm<UnknownInlineToken>, AnyMeta>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string, _5: string, _6: string): [AsUnion<InlineEm<UnknownInlineToken>>, string] {
    return [{ $: InlineTag.Em, _: parseNest($, _6 || _5 || _4 || _3 || _2 || _1) }, src];
}

export const Del: InlineRule<InlineDel<UnknownInlineToken>, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Del,
    '~+(?=\\S)([\\s\\S]*?\\S)~+',
    ($, src, { }, text) => [{ $: InlineTag.Del, _: parseNest($, text) }, src]
];

export const CodeSpan: InlineRule<InlineCode, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Code,
    '(`+)\\s*([\\s\\S]*?[^`]?)\\s*\\1(?!`)',
    ({ }, src, { }, fences, text) => [{ $: InlineTag.Code, _: text.replace(/\s+$/, '') }, src]
];

export const MathSpan: InlineRule<InlineMath, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Math,
    '(\\$+)\\s*([\\s\\S]*?[^\\$]?)\\s*\\1(?!\\$)',
    ({ }, src, { }, delims, text) => [{ $: InlineTag.Math, _: text.replace(/\s+$/, '') }, src]
];

const br = '(?: {2,}|\\\\)\\n(?!\\s*$)';

export const Br: InlineRule<InlineBr, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    br,
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

export const GfmBreaksBr: InlineRule<InlineBr, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    substRe(br, { '\\{2,\\}': '*' }),
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

const text = '[\\s\\S]+?(?=[\\\\<!\\[`*$]|\\b_| {2,}\\n|$)';

export const TextSpan: InlineRule<string, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    text,
    procText
];

const gfm_text = substRe(text, { '\\]\\|': '~]|https?://|ftp:\\/\\/|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|' });

export const GfmTextSpan: InlineRule<string, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    gfm_text,
    procText
];

export const GfmBreaksTextSpan: InlineRule<string, AnyMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Text,
    substRe(gfm_text, { '\\{2,\\}': '*' }),
    procText
];

function procText({ }: InlineHandle<string, AnyMeta>, src: string, text: string): [string, string] {
    return [text, src];
}

function parseLink($: InlineHandle<InlineLink<UnknownInlineToken> | InlineImage, AnyMeta>, link: string, text: string, href: string, title?: string): AsUnion<InlineLink<UnknownInlineToken> & InlineImage> {
    const token: AsUnion<InlineLink<UnknownInlineToken> & InlineImage> = link.charAt(0) != '!'
        ? { $: InlineTag.Link, l: href, _: parseNest($, text, ContextTag.InlineLink) }
        : { $: InlineTag.Image, l: href, _: text };
    if (title) (token as AsUnion<InlineLink<UnknownInlineToken>>).t = title;
    return token;
}

// rulesets
export const InlineNormal = [Escape, AutoLink, Link, RefLink, NoLink, Strong, Em, CodeSpan, Br, TextSpan];

export const InlinePedantic = [Escape, AutoLink, PedanticLink, PedanticRefLink, NoLink, PedanticStrong, PedanticEm, CodeSpan, Br, TextSpan];

export const InlineGfm = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, Br, GfmTextSpan];

export const InlineGfmBreaks = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, GfmBreaksBr, GfmBreaksTextSpan];
