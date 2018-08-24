import { TokenType, TokensType } from '../model';
import { BasicInlineTokenMap } from '../inline/model';

export const enum BlockTag {
    Space,
    Heading,
    Paragraph,
    Quote,
    Footnote,
    List,
    OrdList,
    Table,
    Code,
    Math,
    Hr,
    Text
}

export const enum BlockOrder {
    Newline,
    Code,
    Fences,
    Math,
    Heading,
    NpTable,
    Hr,
    Quote,
    List,
    Abbrev,
    Footnote,
    Def,
    Table,
    LHeading,
    Paragraph,
    Text,
}

export const enum BlockAlign {
    None,
    Left,
    Center,
    Right,
}

export interface BlockHeading<InlineTokenMap> {
    [BlockTag.Heading]: {
        i: number; // index
        n: number; // level
        _: TokensType<InlineTokenMap>;
    };
}

export interface BlockPhrase<InlineTokenMap> {
    _: TokensType<InlineTokenMap>;
}

export interface BlockParagraph<InlineTokenMap> {
    [BlockTag.Paragraph]: BlockPhrase<InlineTokenMap>;
}

export interface BlockText<InlineTokenMap> {
    [BlockTag.Text]: BlockPhrase<InlineTokenMap>;
}

export interface BlockNested<BlockTokenMap> {
    _: TokensType<BlockTokenMap>;
}

export interface BlockQuote<BlockTokenMap> {
    [BlockTag.Quote]: BlockNested<BlockTokenMap>;
}

export interface BlockFootnote<BlockTokenMap> {
    [BlockTag.Footnote]: {
        l: string;
        _: TokensType<BlockTokenMap>;
    };
}

export interface BlockList<BlockTokenMap> {
    [BlockTag.List]: {
        _: BlockListItem<BlockTokenMap>[];
    };
}

export interface BlockOrdList<BlockTokenMap> {
    [BlockTag.OrdList]: {
        s?: number; // start number
        _: BlockListItem<BlockTokenMap>[];
    };
}

export interface BlockListItem<BlockTokenMap> {
    t?: 1; // is task item
    c?: 1; // is checked
    _: TokensType<BlockTokenMap>;
}

export interface BlockTable<BlockTokenMap> {
    [BlockTag.Table]: {
        h: BlockTableCell<BlockTokenMap>[];
        a: BlockAlign[];
        _: BlockTableRow<BlockTokenMap>[];
    };
}

export type BlockTableCell<BlockTokenMap> = TokensType<BlockTokenMap>;

export type BlockTableRow<BlockTokenMap> = BlockTableCell<BlockTokenMap>[];

export interface BlockHr {
    [BlockTag.Hr]: BlockEmpty;
}

export interface BlockEmpty { }

export interface BlockCode {
    [BlockTag.Code]: {
        l?: string; /* language */
        _: string; /* code source */
    };
}

export interface BlockMath {
    [BlockTag.Math]: {
        s?: string; /* specification */
        _: string; /* math equations */
    };
}

export interface BlockSpace {
    [BlockTag.Space]: BlockEmpty;
}

export interface BlockTokenMap<BlockTokenMap, InlineTokenMap> extends
    BlockSpace,
    BlockCode,
    //BlockMath,
    BlockHeading<InlineTokenMap>,
    BlockHr,
    BlockQuote<BlockTokenMap>,
    BlockList<BlockTokenMap>,
    BlockOrdList<BlockTokenMap>,
    BlockParagraph<InlineTokenMap>,
    BlockText<InlineTokenMap>,
    BlockTable<BlockTokenMap> { }

// Metas

export interface MetaHeading {
    t: string; // text
    n: number; // level
}

export interface MetaHeadings {
    h: MetaHeading[];
}

export interface MetaLink {
    l: string; // href
    t?: string; // title
}

export interface MetaLinks {
    l: Record<string/* link id */, MetaLink>;
}

export interface MetaAbbrevs {
    a: Record<string/* short */, string/* description */>;
}

export interface MetaFootnotes {
    f: string[]; /* note anchors */
}

export interface MetaData extends
    MetaHeadings,
    //MetaAbbrevs,
    //MetaFootnotes,
    MetaLinks { }

// Basics

export interface BasicBlockTokenMap extends BlockTokenMap<BasicBlockTokenMap, BasicInlineTokenMap> { }

export type BasicBlockToken = TokenType<BasicBlockTokenMap>;
