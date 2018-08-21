import { renderNest } from '../../render';
import {
    ContextTag,
    NoMeta, MetaLinks, MetaLink,
    UnknownToken
} from '../../model';
import {
    InlineTag,
    InlineLink, InlineImage,
    InlineStrong, InlineEm, InlineDel,
    InlineCode, InlineMath,
    InlineBr
} from '../../inline/model';
import {
    InlineRenderRuleStr,
    escapeCode,
    escapeAttr,
    escapeHtml,
    sanitizeUrl,
} from '../str';

export const LinkHtml: InlineRenderRuleStr<InlineLink<UnknownToken>, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Link,
    ($, { l, t, _ }) => {
        const href = putLinkAttr(l, l, 'l', $.m, 'href');
        const nest = renderNest($, _);
        return href ? '<a' +
            href +
            putLinkAttr(l, t, 't', $.m, 'title') +
            '>' + nest + '</a>' : nest;
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

function putLinkAttr(l: string, v: string | void, n: keyof MetaLink, m: MetaLinks, a: string): string {
    if (m.links) {
        const $ = m.links[l];
        if ($ && $[n]) {
            v = $[n] as string;
        }
    }
    if (n == 'l' && v) {
        v = sanitizeUrl(v);
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

export const InlineHtml = [LinkHtml, ImageHtml, StrongHtml, EmHtml, CodeSpanHtml, BrHtml];

export const InlineXHtml = [LinkHtml, ImageXHtml, StrongHtml, EmHtml, CodeSpanHtml, BrXHtml];

export const InlineGfmHtml = [...InlineHtml, DelHtml];

export const InlineGfmXHtml = [...InlineXHtml, DelHtml];
