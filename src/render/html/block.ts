import { renderNest } from '../../render';
import {
    ContextTag,
    NoMeta, MetaHeadings,
    UnknownToken
} from '../../model';
import {
    BlockTag,
    BlockCode, BlockHeading,
    BlockHr, BlockQuote,
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
    escapeAttr,
    escapeCode,
    textAlign,
} from '../str';

export const CodeBlockHtml: BlockRenderRuleStr<BlockCode, NoMeta> = [
    ContextTag.Block,
    BlockTag.Code,
    ({ }, { _ }) => '<pre><code>' + escapeCode(_) + '</code></pre>\n'
];

export const CodeBlockWithClassHtml: BlockRenderRuleStr<BlockCode, NoMeta> = [
    ContextTag.Block,
    BlockTag.Code,
    ({ }, { _, l }) => '<pre><code' + (l ? ' class="language-' + escapeAttr(l) + '"' : '') + '>' + escapeCode(_) + '</code></pre>\n'
];

export const HeadingHtml: BlockRenderRuleStr<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    ContextTag.Block,
    BlockTag.Heading,
    ($, { n, i, _ }) => `<h${n}>` + renderNest($, _, ContextTag.Inline) + `</h${n}>\n`
];

export const HeadingWithIdHtml: BlockRenderRuleStr<BlockHeading<UnknownToken>, MetaHeadings<UnknownToken>> = [
    ContextTag.Block,
    BlockTag.Heading,
    ($, { n, i, _ }) => `<h${n} id="${$.m.headings[i].t.toLowerCase().replace(/[^\w]+/g, '-')}">` +
        renderNest($, _, ContextTag.Inline) + `</h${n}>\n`
];

export const HrHtml: BlockRenderRuleStr<BlockHr, NoMeta> = [
    ContextTag.Block,
    BlockTag.Hr,
    ({ }, { }) => '<hr>\n'
];

export const HrXHtml: BlockRenderRuleStr<BlockHr, NoMeta> = [
    ContextTag.Block,
    BlockTag.Hr,
    ({ }, { }) => '<hr />\n'
];

export const QuoteHtml: BlockRenderRuleStr<BlockQuote<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Quote,
    ($, { _ }) => '<blockquote>\n' + renderNest($, _) + '</blockquote>\n'
];

export const ListHtml: BlockRenderRuleStr<BlockList<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.List,
    ($, { _ }) => '<ul>\n' +
        renderListItems($, _) +
        '</ul>\n'
];

export const OrdListHtml: BlockRenderRuleStr<BlockOrdList<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.OrdList,
    ($, { s, _ }) => '<ol' + (s != null && s != 1 ? ' start="' + s + '"' : '') + '>\n' +
        renderListItems($, _) +
        '</ol>\n'
];

function renderListItems($: BlockRenderHandleStr<BlockList<UnknownToken> | BlockOrdList<UnknownToken>, NoMeta>, items: BlockListItem<UnknownToken>[]): string {
    let out = '';
    for (const item of items) {
        out += '<li>' +
            (item.t ? '<input type="checkbox"' + (item.c ? ' checked' : '') + ' disabled> ' : '') +
            renderNest($, item._) +
            '</li>\n';
    }
    return out;
}

export const ParagraphHtml: BlockRenderRuleStr<BlockParagraph<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Paragraph,
    ($, { _ }) => '<p>' + renderNest($, _, ContextTag.Inline) + '</p>\n'
];

export const TextBlockHtml: BlockRenderRuleStr<BlockText<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Text,
    ($, { _ }) => renderNest($, _, ContextTag.Inline)
];

export const TableHtml: BlockRenderRuleStr<BlockTable<UnknownToken>, NoMeta> = [
    ContextTag.Block,
    BlockTag.Table,
    ($, { h, a, _ }) => '<table>\n<thead>\n<tr>\n' +
        renderTableCells($, h, 'th', a) +
        '</tr>\n</thead>\n' +
        (_.length ? '<tbody>\n' +
            renderTableRows($, _, a) +
            '</tbody>\n' : '') +
        '</table>'
];

function renderTableRows($: BlockRenderHandleStr<BlockTable<UnknownToken>, NoMeta>, rows: BlockTableRow<UnknownToken>[], align: BlockAlign[]): string {
    let out = '';
    for (const row of rows) {
        out += '<tr>\n' +
            renderTableCells($, row, 'td', align) +
            '</tr>\n';
    }
    return out;
}

function renderTableCells($: BlockRenderHandleStr<BlockTable<UnknownToken>, NoMeta>, cells: BlockTableCell<UnknownToken>[], tag: string, align: BlockAlign[]): string {
    let out = '';
    for (let i = 0; i < cells.length; i++) {
        const a = textAlign[align[i]];
        out += `<${tag}` +
            (a ? ` align="${a}"` : '') +
            '>' + renderNest($, cells[i]) +
            `</${tag}>\n`;
    }
    return out;
}

export const BlockHtml = [CodeBlockWithClassHtml, HeadingWithIdHtml, HrHtml, QuoteHtml, ListHtml, OrdListHtml, ParagraphHtml, TextBlockHtml];

export const BlockXHtml = [CodeBlockWithClassHtml, HeadingWithIdHtml, HrXHtml, QuoteHtml, ListHtml, OrdListHtml, ParagraphHtml, TextBlockHtml];

export const BlockTablesHtml = [CodeBlockWithClassHtml, HeadingWithIdHtml, HrHtml, QuoteHtml, ListHtml, OrdListHtml, ParagraphHtml, TextBlockHtml, TableHtml];

export const BlockTablesXHtml = [CodeBlockWithClassHtml, HeadingWithIdHtml, HrXHtml, QuoteHtml, ListHtml, OrdListHtml, ParagraphHtml, TextBlockHtml, TableHtml];
