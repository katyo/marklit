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

export interface MetaFootnotes<BlockToken> {
    footnotes: Record<string, BlockToken[]>;
}

export interface MetaHeadings<InlineToken> {
    headings: {
        t: string; // text
        n: number; // level
        _: InlineToken;
    }[];
}

export interface MetaData<BlockToken, InlineToken> extends
    MetaLinks,
    MetaAbbrevs,
    MetaFootnotes<BlockToken>,
    MetaHeadings<InlineToken> { }

export interface AnyMeta {
    [key: string]: any;
}
