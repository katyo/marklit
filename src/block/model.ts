import { TokenType } from '../model';
import { BasicInlineTokenMap } from '../inline/model';

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
        _: TokenType<InlineTokenMap>[];
    };
}

export interface BlockParagraph<InlineTokenMap> {
    [BlockTag.Paragraph]: {
        _: TokenType<InlineTokenMap>[];
    };
}

export interface BlockText<InlineTokenMap> {
    [BlockTag.Text]: {
        _: TokenType<InlineTokenMap>[];
    };
}

export interface BlockQuote<BlockTokenMap> {
    [BlockTag.Quote]: {
        _: TokenType<BlockTokenMap>[];
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
    _: TokenType<BlockTokenMap>[];
}

export interface BlockTable<BlockTokenMap> {
    [BlockTag.Table]: {
        h: BlockTableCell<BlockTokenMap>[];
        a: BlockAlign[];
        _: BlockTableRow<BlockTokenMap>[];
    };
}

export type BlockTableCell<BlockTokenMap> = TokenType<BlockTokenMap>[];

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

export type BasicBlockToken = TokenType<BasicBlockTokenMap>;
