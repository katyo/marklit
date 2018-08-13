import { RenderRule, RenderHandle, makeRender } from '../render';
import {
    ContextTag, ContextMap,
    UnknownInlineToken, UnknownBlockToken
} from '../model';

export type InlineRenderRuleStr<InlineTokenMap, Meta> = RenderRule<string, ContextMap<UnknownBlockToken, InlineTokenMap, Meta>, ContextTag.Inline>;

export type InlineRenderHandleStr<InlineTokenMap, Meta> = RenderHandle<string, ContextMap<UnknownBlockToken, InlineTokenMap, Meta>, ContextTag.Inline>;

export type BlockRenderRuleStr<BlockTokenMap, Meta> = RenderRule<string, ContextMap<BlockTokenMap, UnknownInlineToken, Meta>, ContextTag.Block>;

export type BlockRenderHandleStr<BlockTokenMap, Meta> = RenderHandle<string, ContextMap<BlockTokenMap, UnknownInlineToken, Meta>, ContextTag.Block>;

export const initRenderHtml = makeRender(escapeHtml, joinStrings);

export const textAlign: string[] = [
    '',
    'left',
    'center',
    'right',
];

export function joinStrings(strs: string[]): string {
    return strs.join('');
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
