import { renderNest } from '../../render';
import {
    ContextTag,
    AnyMeta, MetaHeadings,
    UnknownInlineToken, UnknownBlockToken
} from '../../model';
import {
    BlockTag,
    BlockCode, BlockHeading,
    BlockSpace, BlockHr, BlockQuote,
    BlockList, BlockOrdList,
    BlockParagraph, BlockText,
    BlockTable,
    BlockListItem,
    BlockTableCell,
    BlockAlign,
    BlockTableRow
} from '../../block/model';
import {
    BlockRenderRuleStr,
    BlockRenderHandleStr,
    escapeCode,
    textAlign,
} from '../str';

export const NewlineHtml: BlockRenderRuleStr<BlockSpace, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Space,
    ({ }, { }) => '\n'
];

export const CodeBlockHtml: BlockRenderRuleStr<BlockCode, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Code,
    ({ }, { _ }) => '<pre><code>' + escapeCode(_) + '</code></pre>\n'
];

export const HeadingHtml: BlockRenderRuleStr<BlockHeading<UnknownInlineToken>, MetaHeadings<UnknownInlineToken>> = [
    ContextTag.Block,
    BlockTag.Heading,
    ($, { n, _ }) => `<h${n}>` + renderNest($, _, ContextTag.Inline) + `</h${n}>\n`
];

export const HrHtml: BlockRenderRuleStr<BlockHr, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Hr,
    ({ }, { }) => '<hr/>\n'
];

export const QuoteHtml: BlockRenderRuleStr<BlockQuote<UnknownBlockToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Quote,
    ($, { _ }) => '<blockquote>\n' + renderNest($, _) + '</blockquote>\n'
];

export const ListHtml: BlockRenderRuleStr<BlockList<UnknownBlockToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.List,
    ($, { _ }) => '<ul>\n' +
        renderListItems($, _) +
        '</ul>\n'
];

export const OrdListHtml: BlockRenderRuleStr<BlockOrdList<UnknownBlockToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.OrdList,
    ($, { s, _ }) => '<ol' + (s != 1 ? 'start="' + s + '"' : '') + '>\n' +
        renderListItems($, _) +
        '</ol>\n'
];

function renderListItems($: BlockRenderHandleStr<BlockList<UnknownBlockToken> | BlockOrdList<UnknownBlockToken>, AnyMeta>, items: BlockListItem<UnknownBlockToken>[]): string {
    let out = '';
    for (const item of items) {
        out += '<li>' +
            (item.t ? '<input type="checkbox"' + (item.c ? ' checked' : '') + ' disabled> ' : '') +
            renderNest($, item._) +
            + '</li>\n';
    }
    return out;
}

export const ParagraphHtml: BlockRenderRuleStr<BlockParagraph<UnknownInlineToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Paragraph,
    ($, { _ }) => '<p>' + renderNest($, _, ContextTag.Inline) + '</p>\n'
];

export const TextBlockHtml: BlockRenderRuleStr<BlockText<UnknownInlineToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Text,
    ($, { _ }) => '<p>' + renderNest($, _, ContextTag.Inline) + '</p>\n'
];

export const TableHtml: BlockRenderRuleStr<BlockTable<UnknownBlockToken>, AnyMeta> = [
    ContextTag.Block,
    BlockTag.Table,
    ($, { h, a, _ }) => '<table>\n<thead>\n' +
        renderTableCells($, h, 'th', a) +
        '</thead>\n' +
        (_.length ? '<tbody>\n' +
            renderTableRows($, _, a) +
            '</tbody>\n' : '') +
        '</table>'
];

function renderTableRows($: BlockRenderHandleStr<BlockTable<UnknownBlockToken>, AnyMeta>, rows: BlockTableRow<UnknownBlockToken>[], align: BlockAlign[]): string {
    let out = '';
    for (const row of rows) {
        out += '<tr>\n' +
            renderTableCells($, row, 'td', align) +
            '</tr>\n';
    }
    return out;
}

function renderTableCells($: BlockRenderHandleStr<BlockTable<UnknownBlockToken>, AnyMeta>, cells: BlockTableCell<UnknownBlockToken>[], tag: string, align: BlockAlign[]): string {
    let out = '';
    for (let i = 0; i < cells.length; i++) {
        const a = textAlign[align[i]];
        out += `<${tag}` +
            (a ? ` style="text-align: ${a}"` : '') +
            '>' + renderNest($, cells[i]) +
            `</${tag}>\n`;
    }
    return out;
}

export const BlockHtml = [NewlineHtml, CodeBlockHtml, HeadingHtml, HrHtml, QuoteHtml, ListHtml, OrdListHtml, ParagraphHtml, TextBlockHtml];

export const BlockTablesHtml = [...BlockHtml, TableHtml];
