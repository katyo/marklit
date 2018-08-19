import { AsUnion } from '../model';
import { InlineTokenType, BasicInlineTokenMap } from '../inline/model';

export type BlockTokenType<BlockTokenMap> = AsUnion<BlockTokenMap>;

export const enum BlockTag {
    Heading,
    Paragraph,
    Quote,
    List,
    OrdList,
    Table,
    Code,
    Hr,
    Text
}

export const enum BlockOrder {
    Newline,
    Code,
    Fences,
    Heading,
    NpTable,
    Hr,
    Quote,
    List,
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
        _: InlineTokenType<InlineTokenMap>[];
    };
}

export interface BlockParagraph<InlineTokenMap> {
    [BlockTag.Paragraph]: {
        _: InlineTokenType<InlineTokenMap>[];
    };
}

export interface BlockText<InlineTokenMap> {
    [BlockTag.Text]: {
        _: InlineTokenType<InlineTokenMap>[];
    };
}

export interface BlockQuote<BlockTokenMap> {
    [BlockTag.Quote]: {
        _: BlockTokenType<BlockTokenMap>[];
    };
}

export interface BlockList<BlockTokenMap> {
    [BlockTag.List]: {
        l?: 1; // loose list
        _: BlockListItem<BlockTokenMap>[];
    };
}

export interface BlockOrdList<BlockTokenMap> {
    [BlockTag.OrdList]: {
        s?: number; // start number
        l?: 1; // loose list
        _: BlockListItem<BlockTokenMap>[];
    };
}

export interface BlockListItem<BlockTokenMap> {
    t?: 1; // is task item
    c?: 1; // is checked
    l?: 1; // loose item
    _: BlockTokenType<BlockTokenMap>[];
}

export interface BlockTable<BlockTokenMap> {
    [BlockTag.Table]: {
        h: BlockTableCell<BlockTokenMap>[];
        a: BlockAlign[];
        _: BlockTableRow<BlockTokenMap>[];
    };
}

export type BlockTableCell<BlockTokenMap> = BlockTokenType<BlockTokenMap>[];

export type BlockTableRow<BlockTokenMap> = BlockTableCell<BlockTokenMap>[];

export interface BlockHr {
    [BlockTag.Hr]: BlockEmpty;
}

export interface BlockEmpty { }

export interface BlockCode {
    [BlockTag.Code]: {
        l?: string;
        _: string;
    };
}

export interface BlockTokenMap<BlockTokenMap, InlineTokenMap> extends
    BlockCode,
    BlockHeading<InlineTokenMap>,
    BlockHr,
    BlockQuote<BlockTokenMap>,
    BlockList<BlockTokenMap>,
    BlockOrdList<BlockTokenMap>,
    BlockParagraph<InlineTokenMap>,
    BlockText<InlineTokenMap>,
    BlockTable<BlockTokenMap> { }

// Basics

export interface BasicBlockTokenMap extends BlockTokenMap<BasicBlockTokenMap, BasicInlineTokenMap> { }

export type BasicBlockToken = BlockTokenType<BasicBlockTokenMap>;
