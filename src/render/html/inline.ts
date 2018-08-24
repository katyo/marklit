import { renderNest } from '../../render';
import {
    ContextTag,
    NoMeta,
    UnknownToken
} from '../../model';
import {
    MetaLinks, MetaLink,
    MetaAbbrevs, MetaFootnotes
} from '../../block/model';
import {
    InlineTag,
    InlineLink, InlineImage,
    InlineStrong, InlineEm, InlineDel,
    InlineCode, InlineMath,
    InlineAbbrev, InlineFootnote,
    InlineBr, InlineText
} from '../../inline/model';
import {
    InlineRenderRuleStr,
    escapeCode,
    escapeAttr,
    escapeHtml,
    sanitizeUrl,
    simpleId
} from '../str';

export const LinkHtml: InlineRenderRuleStr<InlineLink<UnknownToken>, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Link,
    ($, { l, t, _ }) => {
        const href = putLinkAttr(l, l, 'l', $.m, 'href');
        const nest = renderNest($, _);
        return href == null ? nest : '<a' +
            (href || ' href=""') +
            putLinkAttr(l, t, 't', $.m, 'title') +
            '>' + nest + '</a>';
    }
];

export const ImageHtml: InlineRenderRuleStr<InlineImage, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Image,
    ($, { l, t, _ }) => {
        const src = putLinkAttr(l, l, 'l', $.m, 'src');
        return src ? '<img' +
            src +
            (_ ? ' alt="' + escapeAttr(_) + '"' : '') +
            putLinkAttr(l, t, 't', $.m, 'title') +
            '>' : escapeHtml(_);
    }
];

export const ImageXHtml: InlineRenderRuleStr<InlineImage, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Image,
    ($, { l, t, _ }) => '<img' +
        putLinkAttr(l, l, 'l', $.m, 'src') +
        ' alt="' + escapeHtml(_) + '"' +
        putLinkAttr(l, t, 't', $.m, 'title') +
        ' />'
];

function putLinkAttr(l: string, v: string | void, n: keyof MetaLink, m: MetaLinks, a: string): string | void {
    if (m.l) {
        const $ = m.l[l];
        if ($ && $[n]) {
            v = $[n] as string;
        }
    }
    if (n == 'l' && v) {
        v = sanitizeUrl(v);
        if (v == null) return;
    }
    return v ? ` ${a}="${escapeAttr(v as string)}"` : '';
}

export const StrongHtml: InlineRenderRuleStr<InlineStrong<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Strong,
    ($, { _ }) => '<strong>' + renderNest($, _) + '</strong>'
];

export const EmHtml: InlineRenderRuleStr<InlineEm<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Em,
    ($, { _ }) => '<em>' + renderNest($, _) + '</em>'
];

export const DelHtml: InlineRenderRuleStr<InlineDel<UnknownToken>, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Del,
    ($, { _ }) => '<del>' + renderNest($, _) + '</del>'
];

export const CodeSpanHtml: InlineRenderRuleStr<InlineCode, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Code,
    ({ }, { _ }) => '<code>' + escapeCode(_) + '</code>'
];

export const MathSpanHtml: InlineRenderRuleStr<InlineMath, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Math,
    ({ }, { _ }) => '<math>' + escapeCode(_) + '</math>'
];

export const AbbrevHtml: InlineRenderRuleStr<InlineAbbrev, MetaAbbrevs> = [
    ContextTag.Inline,
    InlineTag.Abbrev,
    ({ m: { a } }, { t, _ }) => '<abbr' + (t || a[_] ? ' title="' + escapeAttr(t || a[_]) + '"' : '') + '>' + escapeHtml(_) + '</abbr>'
];

export const FootnoteHtml: InlineRenderRuleStr<InlineFootnote, MetaFootnotes> = [
    ContextTag.Inline,
    InlineTag.Footnote,
    ({ m: { f } }, { l }) => {
        const id = simpleId(l);
        return '<sup class="fn-ref"><a id="fnref-' + id + '" href="#fn-' + id + '">' + escapeHtml(l) + '</a></sup>';
    }
];

export const TextHtml: InlineRenderRuleStr<InlineText, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Text,
    ({ }, { _ }) => escapeHtml(_)
];

export const BrHtml: InlineRenderRuleStr<InlineBr, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Br,
    () => '<br>'
];

export const BrXHtml: InlineRenderRuleStr<InlineBr, NoMeta> = [
    ContextTag.Inline,
    InlineTag.Br,
    () => '<br />'
];

export const InlineHtml = [LinkHtml, ImageHtml, StrongHtml, EmHtml, CodeSpanHtml, BrHtml, TextHtml];

export const InlineXHtml = [LinkHtml, ImageXHtml, StrongHtml, EmHtml, CodeSpanHtml, BrXHtml, TextHtml];

export const InlineGfmHtml = [LinkHtml, ImageHtml, StrongHtml, EmHtml, CodeSpanHtml, BrHtml, DelHtml, TextHtml];

export const InlineGfmXHtml = [LinkHtml, ImageXHtml, StrongHtml, EmHtml, CodeSpanHtml, BrXHtml, DelHtml, TextHtml];
