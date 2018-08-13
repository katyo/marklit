import { InlineTokenType } from './inline/model';
import { BlockTokenType } from './block/model';

export const enum ContextTag {
    Block,
    BlockNest,
    Inline,
    InlineLink,
}

export interface ContextMap<BlockTokenMap, InlineTokenMap, Meta> {
    [ContextTag.Block]: [BlockTokenType<BlockTokenMap>, Meta];
    [ContextTag.BlockNest]: [BlockTokenType<BlockTokenMap>, Meta];
    [ContextTag.Inline]: [InlineTokenType<InlineTokenMap>, Meta];
    [ContextTag.InlineLink]: [InlineTokenType<InlineTokenMap>, Meta];
}

export type AsUnion<Map> = Map extends string ? string : { [Tag in keyof Map]: { $: Tag } & Map[Tag] }[keyof Map];

export type ContextToken<CtxDef> = CtxDef extends [infer Token, infer Meta] ? Token : never;
export type ContextMeta<CtxDef> = CtxDef extends [infer Token, infer Meta] ? Meta : never;

export type ContextResult<CtxMap, Ctx extends keyof CtxMap> = [ContextMeta<CtxMap[Ctx]>, ContextToken<CtxMap[Ctx]>[]];

export type UnknownBlockToken = any;

export type UnknownInlineToken = any;

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

export interface AnyMeta {
    [key: string]: any;
}
