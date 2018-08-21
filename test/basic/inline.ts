import { deepStrictEqual as dse } from 'assert';

import {
    InlineTag,
    InlineTokenType,
    InlineTokenMap,

    InlineNormal,
    InlinePedantic,
    InlineGfm,
    //InlineGfmBreaks,

    ContextTag,
    ContextMap,
    NoMeta,

    init, parse,

    MathSpan
} from '../../src/index';

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface InlineContext extends ContextMap<any, InlineToken, NoMeta> { }

export default function() {
    describe('normal', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineNormal);
        const _ = (s: string, r: InlineTokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), { $: 1, _: [{}, r] }));

        describe('escape', () => {
            _('Backslash: \\\\', ['Backslash: \\']);
            _('Backtick: \\\`', ['Backtick: `']);
            _('Asterisk: \*', ['Asterisk: *']);
            _('Underscore: \\_', ['Underscore: _']);
            _('Left brace: \\{', ['Left brace: {']);
            _('Right brace: \\}', ['Right brace: }']);
            _('Left bracket: \\[', ['Left bracket: [']);
            _('Right bracket: \\]', ['Right bracket: ]']);
            _('Left paren: \\(', ['Left paren: (']);
            _('Right paren: \\)', ['Right paren: )']);
            _('Greater-than: \\>', ['Greater-than: >']);
            _('Hash: \\#', ['Hash: #']);
            _('Period: \\.', ['Period: .']);
            _('Bang: \\!', ['Bang: !']);
            _('Plus: \\+', ['Plus: +']);
            _('Minus: \\-', ['Minus: -']);
            _('Tube: \\|', ['Tube: |']);
            _('Tilde: \\~', ['Tilde: ~']);
        });

        describe('auto link', () => {
            _('Link: <http://example.com/>.', [
                'Link: ',
                { $: InlineTag.Link, l: 'http://example.com/', _: ['http://example.com/'] },
                '.'
            ]);
            _('With an ampersand: <http://example.com/?foo=1&bar=2>', [
                'With an ampersand: ',
                { $: InlineTag.Link, l: 'http://example.com/?foo=1&bar=2', _: ['http://example.com/?foo=1&bar=2'] }
            ]);
            _('Auto-links should not occur here: `<http://example.com/>`', [
                'Auto-links should not occur here: ',
                { $: InlineTag.Code, _: '<http://example.com/>' }
            ]);
        });

        describe('link', () => {
            _('Just a [URL](/url/).', [
                'Just a ',
                { $: InlineTag.Link, l: '/url/', _: ['URL'] },
                '.'
            ]);
            _('[URL and title](/url/ "title").', [
                { $: InlineTag.Link, l: '/url/', t: 'title', _: ['URL and title'] },
                '.'
            ]);
            _('[URL and title](/url/  "title preceded by two spaces").', [
                { $: InlineTag.Link, l: '/url/', t: 'title preceded by two spaces', _: ['URL and title'] },
                '.'
            ]);
            _('[URL and title](/url/	"title preceded by a tab").', [
                { $: InlineTag.Link, l: '/url/', t: 'title preceded by a tab', _: ['URL and title'] },
                '.'
            ]);
            _('[URL and title](/url/ "title has spaces afterward"  ).', [
                { $: InlineTag.Link, l: '/url/', t: 'title has spaces afterward', _: ['URL and title'] },
                '.'
            ]);
            /*
            _('[URL and title]( /url/has space ).', [
                { $: InlineTag.Link, l: '/url/has space', _: ['URL and title'] },
                '.'
            ]);
            _('[URL and title]( /url/has space/ "and title").', [

            ]);
            */
            _('[Empty]().', [
                { $: InlineTag.Link, l: '', _: ['Empty'] },
                '.'
            ])
        });

        describe('strong', () => {
            _('Strong **phrase**.', ['Strong ', { $: InlineTag.Strong, _: ['phrase'] }, '.']);
            _('Strong **phrase with spaces**', ['Strong ', { $: InlineTag.Strong, _: ['phrase with spaces'] }]);
            _('Underscored strong __phrase__', ['Underscored strong ', { $: InlineTag.Strong, _: ['phrase'] }]);
            _('Underscored strong __phrase with spaces__.', ['Underscored strong ', { $: InlineTag.Strong, _: ['phrase with spaces'] }, '.']);
            _('_**Strong** in emphased_', [{ $: InlineTag.Em, _: [{ $: InlineTag.Strong, _: ['Strong'] }, ' in emphased'] }]);
        });

        describe('em', () => {
            _('Emphased *phrase*.', ['Emphased ', { $: InlineTag.Em, _: ['phrase'] }, '.']);
            _('Emphased *phrase with spaces*', ['Emphased ', { $: InlineTag.Em, _: ['phrase with spaces'] }]);
            _('Underscored emphased _phrase_', ['Underscored emphased ', { $: InlineTag.Em, _: ['phrase'] }]);
            _('Underscored emphased _phrase with spaces_.', ['Underscored emphased ', { $: InlineTag.Em, _: ['phrase with spaces'] }, '.']);
            _('__*Emphased* in strong__', [{ $: InlineTag.Strong, _: [{ $: InlineTag.Em, _: ['Emphased'] }, ' in strong'] }]);
        });

        describe('del', () => {
            _('Deleted ~phrase~', ['Deleted ~phrase~']);
            _('Deleted ~phrase with spaces~.', ['Deleted ~phrase with spaces~.']);
        });

        describe('code', () => {
            _('Inline `code`', ['Inline ', { $: InlineTag.Code, _: 'code' }]);
            _('Inline ` code with spaces `', ['Inline ', { $: InlineTag.Code, _: 'code with spaces' }]);
            _('Inline ``code with ` char``', ['Inline ', { $: InlineTag.Code, _: 'code with ` char' }]);
        });
    });

    describe('pedantic', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlinePedantic);
        const _ = (s: string, r: InlineTokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), { $: 1, _: [{}, r] }));

        describe('link', () => {
            _('Just a [URL](/url/).', [
                'Just a ',
                { $: InlineTag.Link, l: '/url/', _: ['URL'] },
                '.'
            ]);
            _('[URL and title]( /url/has space ).', [
                { $: InlineTag.Link, l: '/url/has space', _: ['URL and title'] },
                '.'
            ]);
        });
    });

    describe('gfm', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineGfm);
        const _ = (s: string, r: InlineTokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), { $: 1, _: [{}, r] }));

        describe('del', () => {
            _('Deleted ~phrase~', ['Deleted ', { $: InlineTag.Del, _: ['phrase'] }]);
            _('Deleted ~phrase with spaces~.', ['Deleted ', { $: InlineTag.Del, _: ['phrase with spaces'] }, '.']);
        });
    });

    describe('math', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineNormal, MathSpan);
        const _ = (s: string, r: InlineTokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), { $: 1, _: [{}, r] }));

        _('Inline $math$', ['Inline ', { $: InlineTag.Math, _: 'math' }]);
        _('Inline $ math with spaces $', ['Inline ', { $: InlineTag.Math, _: 'math with spaces' }]);
        _('Inline $$math with $ char$$.', ['Inline ', { $: InlineTag.Math, _: 'math with $ char' }, '.']);
    });
}
