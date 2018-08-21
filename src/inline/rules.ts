import { backpedal } from '../match';
import { ParserHandle, ParserRule, parseNest, pushToken, pushText } from '../parser';
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

const escape = '\\\\([!"#$%&\'()*+,\\-.\\/:;<=>?@\\[\\]\\\\^_`{|}~])';

const escape_re = new RegExp(escape, 'g');

function escapes(src: string): string {
    return src.replace(escape_re, '$1');
}

export const Escape: InlineRule<string, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Escape,
    escape,
    ($, _, char) => { pushText($, char) }
];

const email = '[a-zA-Z0-9.!#$%&\'*+\\/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])';

export const AutoLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.AutoLink,
    substRe('<(scheme:[^\\s\\x00-\\x1f<>]*|email)>', {
        scheme: '[a-zA-Z][a-zA-Z0-9+.-]{1,31}',
        email
    }),
    ($, _, url, at) => {
        pushToken($, {
            $: InlineTag.Link,
            l: (at ? 'mailto:' : '') + url,
            _: [url]
        });
    }
];

export const Url: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Url,
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
            _: [text]
        });
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
    ($, link: string, text: string, href: string, title?: string) => {
        procLink($, link, text, href, title ? title.slice(1, -1) : '');
    }
];

export const PedanticLink: InlineRule<InlineLink<UnknownToken>, NoMeta> = [
    [ContextTag.Inline],
    InlineOrder.Link,
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

function procRefNoLink($: InlineHandle<InlineLink<UnknownToken>, NoMeta>, link: string, text: string, text2: string) {
    parseLink($, link, text, (text2 || text).replace(/\s+/g, ' ').toLowerCase());
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

function procStrong($: InlineHandle<InlineStrong<UnknownToken>, NoMeta>, { }: string, _1: string, _2: string, _3: string, _4: string) {
    pushToken($, { $: InlineTag.Strong, _: parseNest($, _4 || _3 || _2 || _1) });
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

function procEm($: InlineHandle<InlineEm<UnknownToken>, NoMeta>, { }: string, _1: string, _2: string, _3: string, _4: string, _5: string, _6: string) {
    pushToken($, { $: InlineTag.Em, _: parseNest($, _6 || _5 || _4 || _3 || _2 || _1) });
}

export const Del: InlineRule<InlineDel<UnknownToken>, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Del,
    '~+(?=\\S)([\\s\\S]*?\\S)~+',
    ($, { }, text) => {
        pushToken($, { $: InlineTag.Del, _: parseNest($, text) });
    }
];

export const CodeSpan: InlineRule<InlineCode, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Code,
    '(`+)\\s*([\\s\\S]*?[^`]?)\\s*\\1(?!`)',
    ($, { }, fences, text) => {
        pushToken($, { $: InlineTag.Code, _: text.replace(/\s+$/, '') });
    }
];

export const MathSpan: InlineRule<InlineMath, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Math,
    '(\\$+)\\s*([\\s\\S]*?[^\\$]?)\\s*\\1(?!\\$)',
    ($, { }, delims, text) => {
        pushToken($, { $: InlineTag.Math, _: text.replace(/\s+$/, '') });
    }
];

const br = '(?: {2,}|\\\\)\\n(?!\\s*$)';

export const Br: InlineRule<InlineBr, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    br,
    procBr
];

export const GfmBreaksBr: InlineRule<InlineBr, NoMeta> = [
    [ContextTag.Inline, ContextTag.InlineLink],
    InlineOrder.Br,
    substRe(br, { '\\{2,\\}': '*' }),
    procBr
];

function procBr($: InlineHandle<InlineBr, NoMeta>) {
    pushToken($, { $: InlineTag.Br });
}

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

function procText($: InlineHandle<string, NoMeta>, text: string) {
    pushText($, text);
}

function parseLink($: InlineHandle<InlineLink<UnknownToken> | InlineImage, NoMeta>, link: string, text: string, href: string, title?: string) {
    const token: AsUnion<InlineLink<UnknownToken> & InlineImage> = link.charAt(0) != '!'
        ? { $: InlineTag.Link, l: href, _: parseNest($, text, ContextTag.InlineLink) }
        : { $: InlineTag.Image, l: href, _: text };
    if (title) token.t = title;
    pushToken($, token);
}

// rulesets
export const InlineNormal = [Escape, AutoLink, Link, RefLink, NoLink, Strong, Em, CodeSpan, Br, TextSpan];

export const InlinePedantic = [Escape, AutoLink, PedanticLink, PedanticRefLink, NoLink, PedanticStrong, PedanticEm, CodeSpan, Br, TextSpan];

export const InlineGfm = [Escape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, Br, GfmTextSpan];

export const InlineGfmBreaks = [Escape, AutoLink, Url, Link, RefLink, NoLink, Strong, Em, Del, CodeSpan, GfmBreaksBr, GfmBreaksTextSpan];
