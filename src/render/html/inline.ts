import { renderNest } from '../../render';
import {
    ContextTag,
    AnyMeta, MetaLinks,
    UnknownInlineToken
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

export const LinkHtml: InlineRenderRuleStr<InlineLink<UnknownInlineToken>, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Link,
    ($, { l, t, _ }) => '<a href="' +
        escapeAttr(l || $.m.links[l]) +
        '"' +
        (t ? ' title="' + escapeAttr(t) + '"' : '') +
        '>' + renderNest($, _) + '</a>'
];

export const ImageHtml: InlineRenderRuleStr<InlineImage, MetaLinks> = [
    ContextTag.Inline,
    InlineTag.Image,
    ($, { l, t, _ }) => '<img src="' +
        escapeAttr(l || $.m.links[l]) +
        '"' +
        (_ ? ' alt="' + escapeHtml(_) + '"' : '') +
        (t ? ' title="' + escapeAttr(t) + '"' : '') +
        '>'
];

export const StrongHtml: InlineRenderRuleStr<InlineStrong<UnknownInlineToken>, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Strong,
    ($, { _ }) => '<strong>' + renderNest($, _) + '</strong>'
];

export const EmHtml: InlineRenderRuleStr<InlineEm<UnknownInlineToken>, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Em,
    ($, { _ }) => '<em>' + renderNest($, _) + '</em>'
];

export const DelHtml: InlineRenderRuleStr<InlineDel<UnknownInlineToken>, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Del,
    ($, { _ }) => '<del>' + renderNest($, _) + '</del>'
];

export const CodeSpanHtml: InlineRenderRuleStr<InlineCode, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Code,
    ({ }, { _ }) => '<code>' + escapeCode(_) + '</code>'
];

export const MathSpanHtml: InlineRenderRuleStr<InlineMath, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Math,
    ({ }, { _ }) => '<math>' + escapeCode(_) + '</math>'
];

export const BrHtml: InlineRenderRuleStr<InlineBr, AnyMeta> = [
    ContextTag.Inline,
    InlineTag.Br,
    () => '<br>'
];

export const InlineHtml = [LinkHtml, ImageHtml, StrongHtml, EmHtml, CodeSpanHtml, BrHtml];

export const InlineGfmHtml = [...InlineHtml, DelHtml];
