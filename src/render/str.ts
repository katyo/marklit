import { RenderRule, RenderHandle, makeRender } from '../render';
import {
    ContextTag, ContextMap,
    UnknownToken, NoMeta
} from '../model';

export type InlineRenderRuleStr<InlineTokenMap, Meta> = RenderRule<string, ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline, Meta>;

export type InlineRenderHandleStr<InlineTokenMap, Meta> = RenderHandle<string, ContextMap<UnknownToken, InlineTokenMap, any>, ContextTag.Inline, Meta>;

export type BlockRenderRuleStr<BlockTokenMap, Meta> = RenderRule<string, ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block, Meta>;

export type BlockRenderHandleStr<BlockTokenMap, Meta> = RenderHandle<string, ContextMap<BlockTokenMap, UnknownToken, any>, ContextTag.Block, Meta>;

export const initRenderHtml = makeRender(joinHtml);

export const textAlign: string[] = [
    '',
    'left',
    'center',
    'right',
];

export function wrapHtml($: RenderHandle<string, ContextMap<UnknownToken, UnknownToken, NoMeta>, ContextTag, NoMeta>, chunk: string): string {
    return escapeHtml(chunk);
}

export function joinHtml($: RenderHandle<string, ContextMap<UnknownToken, UnknownToken, NoMeta>, ContextTag, NoMeta>, chunks: string[]): string {
    return chunks.join($.c == ContextTag.Inline ? '' : '\n');
}

export function escapeCode(str: string): string {
    return escapeCommon(str
        .replace(/&/g, '&amp;')
    );
}

export function escapeHtml(str: string): string {
    return escapeCommon(str
        .replace(/&(?!#?\w+;)/g, '&amp;')
    );
}

function escapeCommon(str: string): string {
    return escapeAttr(str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    );
}

export function escapeAttr(str: string): string {
    return str
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;')
        ;
}

export function sanitizeUrl(url: string): string | void {
    let proto: string;
    try {
        proto = decodeURIComponent(unescapeHtml(escapeAttr(url)))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
    } catch (e) {
        return;
    }
    if (proto.indexOf('javascript:') == 0 ||
        proto.indexOf('vbscript:') == 0 ||
        proto.indexOf('data:') == 0) {
        return;
    }
    try {
        url = encodeURI(url).replace(/%25/g, '%');
    } catch (e) {
        return;
    }
    return url;
}

export function unescapeHtml(html: string) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
        n = n.toLowerCase();
        if (n === 'colon') return ':';
        if (n.charAt(0) === '#') {
            return n.charAt(1) === 'x'
                ? String.fromCharCode(parseInt(n.substring(2), 16))
                : String.fromCharCode(+n.substring(1));
        }
        return '';
    });
}
