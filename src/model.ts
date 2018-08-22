import { InlineTokenType } from './inline/model';
import { BlockTokenType } from './block/model';

export type AsUnion<Map> = Map extends object ? { [Tag in keyof Map]: { $: Tag } & Map[Tag] }[keyof Map] : Map extends void ? any : Map;

export interface HasMeta { _: object; }
export interface HasContexts { $: object; }

export type InitTag = 0;
export interface HasInit { $: { [0]: any; }; }

export type ContextKey<CtxMap extends HasContexts> = keyof CtxMap['$'];
export type ContextToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>> = CtxMap['$'][Ctx];
export type ContextMeta<CtxMap extends HasMeta> = CtxMap['_'];
export type ContextResult<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> = [ContextMeta<CtxMap>, ContextToken<CtxMap, Ctx>[]];

export const enum ContextTag {
    Block,
    BlockNest,
    Inline,
    InlineLink,
}

export interface ContextMap<BlockTokenMap, InlineTokenMap, Meta> {
    _: Meta;
    $: {
        [ContextTag.Block]: BlockTokenType<BlockTokenMap>;
        [ContextTag.BlockNest]: BlockTokenType<BlockTokenMap>;
        [ContextTag.Inline]: InlineTokenType<InlineTokenMap>;
        [ContextTag.InlineLink]: InlineTokenType<InlineTokenMap>;
    };
}

export type UnknownToken = any;

export interface MetaLink {
    l: string; // href
    t?: string; // title
}

export interface MetaLinks {
    links: Record<string, MetaLink>;
}

export interface MetaAbbrevs {
    abbrevs: Record<string, string>;
}

export interface MetaFootnotes<BlockTokenMap> {
    footnotes: Record<string, BlockTokenType<BlockTokenMap>[]>;
}

export interface MetaHeadings<InlineTokenMap> {
    headings: {
        t: string; // text
        n: number; // level
        _: InlineTokenType<InlineTokenMap>[];
    }[];
}

export interface MetaData<BlockTokenMap, InlineTokenMap> extends
    MetaLinks,
    MetaAbbrevs,
    MetaFootnotes<BlockTokenMap>,
    MetaHeadings<InlineTokenMap> { }

export interface NoMeta { }
