import { InlineTokenType } from './inline/model';
import { BlockTokenType } from './block/model';

export type AsUnion<Map> = Map extends string ? string : { [Tag in keyof Map]: { $: Tag } & Map[Tag] }[keyof Map];

export const enum ContextTag {
    Block,
    BlockNest,
    Inline,
    InlineLink,
}

export interface HasMeta<Meta> {
    _: Meta;
}

export type InitTag = 0;

export interface HasInit<Token> {
    [0]: Token;
}

export interface ContextMap<BlockTokenMap, InlineTokenMap, Meta> extends HasMeta<Meta> {
    [ContextTag.Block]: BlockTokenType<BlockTokenMap>;
    [ContextTag.BlockNest]: BlockTokenType<BlockTokenMap>;
    [ContextTag.Inline]: InlineTokenType<InlineTokenMap>;
    [ContextTag.InlineLink]: InlineTokenType<InlineTokenMap>;
}

export type ContextToken<CtxMap, Ctx extends keyof CtxMap> = CtxMap[Ctx];
export type ContextMeta<CtxMap extends HasMeta<any>> = CtxMap extends HasMeta<infer Meta> ? Meta : never;

export type ContextResult<CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap> = [ContextMeta<CtxMap>, ContextToken<CtxMap, Ctx>[]];

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
