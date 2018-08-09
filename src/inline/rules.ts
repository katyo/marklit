import { ParserHandle, ParserRule, AsUnion, parseNest } from '../core';
import { substRe } from '../match';
import {
    InlineTag, InlineOrder, InlineTokenType,
    InlineLink, InlineImage, InlineStrong, InlineEm, InlineDel, InlineCode, InlineMath, InlineBr
} from './model';

export const enum InlineContext {
    Top = 5,
    Link = 6,
}

export interface InlineContextMap<InlineToken, InlineMeta> {
    [InlineContext.Top]: [InlineTokenType<InlineToken>, InlineMeta];
    [InlineContext.Link]: [InlineTokenType<InlineToken>, InlineMeta];
}

export type InlineRule<InlineToken, InlineMeta> = ParserRule<InlineContextMap<InlineToken, InlineMeta>, InlineContext>;

export type InlineHandle<InlineToken, InlineMeta> = ParserHandle<InlineContextMap<InlineToken, InlineMeta>, InlineContext>;

const escape = /\\([!"#$%&'()*+,\-.\/:;<=>?@\[\]\\^_`{}])/;

export const Escape: InlineRule<string, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Escape,
    escape,
    procEscape
];

export const GfmEscape: InlineRule<string, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Escape,
    substRe(escape, { '\\]\\)': '~|])' }),
    procEscape
];

const email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;

export const AutoLink: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.AutoLink,
    substRe(/<(scheme:[^\s\x00-\x1f<>]*|email)>/, { scheme: /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/, email }),
    ({ }, src, { }, url, at) => [{ $: InlineTag.Link, l: (at ? 'mailto:' : '') + url, _: [url] }, src]
];

export const Url: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.Url,
    substRe(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, { email }),
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

const label = /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?/;

export const Link: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.Link,
    substRe(/^!?\[(label)\]\(href(?:\s+(title))?\s*\)/, {
        label,
        href: /\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f()\\]*\)|[^\s\x00-\x1f()\\])*?)/,
        title: /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/,
    }),
    procLink
];

export const PedanticLink: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.Link,
    substRe(/^!?\[(label)\]\((.*?)\)/, { label }),
    procLink
];

export const RefLink: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.RefLink,
    substRe(/^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/, { label }),
    procRefNoLink
];

export const PedanticRefLink: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.RefLink,
    substRe(/^!?\[(label)\]\s*\[([^\]]*)\]/, { label }),
    procRefNoLink
];

export const NoLink: InlineRule<InlineLink<any>, {}> = [
    [InlineContext.Top],
    InlineOrder.NoLink,
    /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    procRefNoLink
];

export const Strong: InlineRule<InlineStrong<any>, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Strong,
    /^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)|^__([^\s])__(?!_)|^\*\*([^\s])\*\*(?!\*)/,
    procStrong
];

export const PedanticStrong: InlineRule<InlineStrong<any>, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Strong,
    /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    procStrong
];

export const Em: InlineRule<InlineEm<any>, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Em,
    /^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s_][\s\S]*?[^\s])_(?!_)|^\*([^\s][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*][\s\S]*?[^\s])\*(?!\*)|^_([^\s_])_(?!_)|^\*([^\s*])\*(?!\*)/,
    procEm
];

export const PedanticEm: InlineRule<InlineEm<any>, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Em,
    /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
    procEm
];

export const Del: InlineRule<InlineDel<any>, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Del,
    /^~+(?=\S)([\s\S]*?\S)~+/,
    ($, src, { }, text) => [{ $: InlineTag.Del, _: parseNest($, text) }, src]
];

export const CodeSpan: InlineRule<InlineCode, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Code,
    /^(`+)\s*([\s\S]*?[^`]?)\s*\1(?!`)/,
    ({ }, src, { }, fences, text) => [{ $: InlineTag.Code, _: text.replace(/\s+$/, '') }, src]
];

export const MathSpan: InlineRule<InlineMath, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Math,
    /^(\$+)\s*([\s\S]*?[^\$]?)\s*\1(?!\$)/,
    ({ }, src, { }, delims, text) => [{ $: InlineTag.Math, _: text.replace(/\s+$/, '') }, src]
];

const br = /^(?: {2,}|\\)\n(?!\s*$)/;

export const Br: InlineRule<InlineBr, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Br,
    br,
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

export const GfmBreaksBr: InlineRule<InlineBr, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Br,
    substRe(br, { '\\{2,\\}': '*' }),
    ({ }, src) => [{ $: InlineTag.Br }, src]
];

const text = /^[\s\S]+?(?=[\\<!\[`*$]|\b_| {2,}\n|$)/;

export const Text: InlineRule<string, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Text,
    text,
    procText
];

const gfm_text = substRe(text, { '\\]\\|': '~]|https?://|ftp:\\/\\/|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|' });

export const GfmText: InlineRule<string, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Text,
    gfm_text,
    procText
];

export const GfmBreaksText: InlineRule<string, {}> = [
    [InlineContext.Top, InlineContext.Link],
    InlineOrder.Text,
    substRe(gfm_text, { '\\{2,\\}': '*' }),
    procText
];

function procEscape({ }: InlineHandle<string, {}>, src: string, { }: string, char: string): [string, string] {
    return [char, src];
}

function procText({ }: InlineHandle<string, {}>, src: string, text: string): [string, string] {
    return [text, src];
}

function procStrong($: InlineHandle<InlineStrong<any>, {}>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string): [AsUnion<InlineStrong<any>>, string] {
    return [{ $: InlineTag.Strong, _: parseNest($, _4 || _3 || _2 || _1) }, src];
}

function procEm($: InlineHandle<InlineEm<any>, {}>, src: string, { }: string, _1: string, _2: string, _3: string, _4: string, _5: string, _6: string): [AsUnion<InlineEm<any>>, string] {
    return [{ $: InlineTag.Em, _: parseNest($, _6 || _5 || _4 || _3 || _2 || _1) }, src];
}

function procLink($: InlineHandle<InlineLink<any>, {}>, src: string, link: string, text: string, href: string, title?: string): [AsUnion<InlineLink<any>>, string] {
    return [
        parseLink($, link, text, href.trim().replace(/^<([\s\S]*)>$/, '$1'), title ? title.slice(1, -1) : '') as AsUnion<InlineLink<any>>,
        src
    ];
}

function procRefNoLink($: InlineHandle<InlineLink<any>, {}>, src: string, link: string, text: string, text2: string): [AsUnion<InlineLink<any>>, string] {
    const ref = (text2 || text).replace(/\s+/g, ' ').toLowerCase();
    return [
        parseLink($, link, text, ref) as AsUnion<InlineLink<any>>,
        src
    ];
}

function parseLink($: InlineHandle<InlineLink<any> | InlineImage, {}>, link: string, text: string, href: string, title?: string): AsUnion<InlineLink<any> & InlineImage> {
    const token: AsUnion<InlineLink<any> & InlineImage> = link.charAt(0) != '!'
        ? { $: InlineTag.Link, l: href, _: parseNest({ ...$, c: InlineContext.Link }, text, InlineContext.Link) }
        : { $: InlineTag.Image, l: href, _: text };
    if (title) (token as AsUnion<InlineLink<any>>).t = title;
    return token;
}

// rulesets
export const InlineNormal = [Escape, AutoLink, Link, RefLink, NoLink, Strong, Em, CodeSpan, Br, Text];

export const InlinePedantic = [Escape, AutoLink, PedanticLink, PedanticRefLink, NoLink, PedanticStrong, PedanticEm, CodeSpan, Br, Text];

export const InlineGfm = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, Br, GfmText];

export const InlineGfmBreaks = [GfmEscape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, GfmBreaksBr, GfmBreaksText];
