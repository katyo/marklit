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
    escapeHtml
} from '../str';

export const LinkHtml: InlineRenderRuleStr<InlineLink<UnknownToken>, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Link,
    ($, { l, t, _ }) => '<a href="' +
        getLinkProp(l, l, 'l', $.m) +
        '"' +
        (t ? ' title="' + getLinkProp(l, t, 't', $.m) + '"' : '') +
        '>' + renderNest($, _) + '</a>'
];

export const ImageHtml: InlineRenderRuleStr<InlineImage, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Image,
    ($, { l, t, _ }) => '<img src="' +
        getLinkProp(l, l, 'l', $.m) +
        '"' +
        (_ ? ' alt="' + escapeHtml(_) + '"' : '') +
        (t ? ' title="' + getLinkProp(l, t, 't', $.m) + '"' : '') +
        '>'
];

function getLinkProp(l: string, v: string | undefined, n: keyof MetaLink, m: MetaLinks): string | undefined {
    if (v) return escapeAttr(v);
    if (m.links) {
        const $ = m.links[l];
        if ($ && $[n]) {
            return escapeAttr($[n] as string);
        }
    }
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

export const InlineHtml = [LinkHtml, ImageHtml, StrongHtml, EmHtml, CodeSpanHtml, BrHtml];

export const InlineGfmHtml = [...InlineHtml, DelHtml];
