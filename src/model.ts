import { InlineTokenType } from './inline/model';
import { BlockTokenType } from './block/model';

export const enum ContextTag {
    BlockTop,
    BlockNest,
    InlineTop,
    InlineLink,
}

export interface ContextMap<BlockTokenMap, InlineTokenMap, Meta> {
    [ContextTag.BlockTop]: [BlockTokenType<BlockTokenMap>, Meta];
    [ContextTag.BlockNest]: [BlockTokenType<BlockTokenMap>, Meta];
    [ContextTag.InlineTop]: [InlineTokenType<InlineTokenMap>, Meta];
    [ContextTag.InlineLink]: [InlineTokenType<InlineTokenMap>, Meta];
}

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
