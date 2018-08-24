import { deepStrictEqual as dse } from 'assert';

import {
    InlineTag,
    InlineTokenMap,
    TokenType,

    InlineNormal,
    InlinePedantic,
    InlineGfm,
    //InlineGfmBreaks,

    ContextTag,
    ContextMap,
    NoMeta,
    UnknownToken,

    init, parse,

    InlineMath, MathSpan,

    MetaAbbrevs, InlineAbbrev, Abbrev
} from '../../src/index';

interface InlineToken extends InlineTokenMap<InlineToken> { }

interface InlineContext extends ContextMap<UnknownToken, InlineToken, NoMeta> { }

export default function() {
    describe('normal', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineNormal);
        const _ = (s: string, r: TokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), [{}, r]));

        describe('escape', () => {
            _('Backslash: \\\\', [{ $: InlineTag.Text, _: 'Backslash: \\' }]);
            _('Backtick: \\\`', [{ $: InlineTag.Text, _: 'Backtick: `' }]);
            _('Asterisk: \*', [{ $: InlineTag.Text, _: 'Asterisk: *' }]);
            _('Underscore: \\_', [{ $: InlineTag.Text, _: 'Underscore: _' }]);
            _('Left brace: \\{', [{ $: InlineTag.Text, _: 'Left brace: {' }]);
            _('Right brace: \\}', [{ $: InlineTag.Text, _: 'Right brace: }' }]);
            _('Left bracket: \\[', [{ $: InlineTag.Text, _: 'Left bracket: [' }]);
            _('Right bracket: \\]', [{ $: InlineTag.Text, _: 'Right bracket: ]' }]);
            _('Left paren: \\(', [{ $: InlineTag.Text, _: 'Left paren: (' }]);
            _('Right paren: \\)', [{ $: InlineTag.Text, _: 'Right paren: )' }]);
            _('Greater-than: \\>', [{ $: InlineTag.Text, _: 'Greater-than: >' }]);
            _('Hash: \\#', [{ $: InlineTag.Text, _: 'Hash: #' }]);
            _('Period: \\.', [{ $: InlineTag.Text, _: 'Period: .' }]);
            _('Bang: \\!', [{ $: InlineTag.Text, _: 'Bang: !' }]);
            _('Plus: \\+', [{ $: InlineTag.Text, _: 'Plus: +' }]);
            _('Minus: \\-', [{ $: InlineTag.Text, _: 'Minus: -' }]);
            _('Tube: \\|', [{ $: InlineTag.Text, _: 'Tube: |' }]);
            _('Tilde: \\~', [{ $: InlineTag.Text, _: 'Tilde: ~' }]);
        });

        describe('auto link', () => {
            _('Link: <http://example.com/>.', [
                { $: InlineTag.Text, _: 'Link: ' },
                { $: InlineTag.Link, l: 'http://example.com/', _: [{ $: InlineTag.Text, _: 'http://example.com/' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('With an ampersand: <http://example.com/?foo=1&bar=2>', [
                { $: InlineTag.Text, _: 'With an ampersand: ' },
                { $: InlineTag.Link, l: 'http://example.com/?foo=1&bar=2', _: [{ $: InlineTag.Text, _: 'http://example.com/?foo=1&bar=2' }] }
            ]);
            _('Auto-links should not occur here: `<http://example.com/>`', [
                { $: InlineTag.Text, _: 'Auto-links should not occur here: ' },
                { $: InlineTag.Code, _: '<http://example.com/>' }
            ]);
        });

        describe('link', () => {
            _('Just a [URL](/url/).', [
                { $: InlineTag.Text, _: 'Just a ' },
                { $: InlineTag.Link, l: '/url/', _: [{ $: InlineTag.Text, _: 'URL' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('[URL and title](/url/ "title").', [
                { $: InlineTag.Link, l: '/url/', t: 'title', _: [{ $: InlineTag.Text, _: 'URL and title' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('[URL and title](/url/  "title preceded by two spaces").', [
                { $: InlineTag.Link, l: '/url/', t: 'title preceded by two spaces', _: [{ $: InlineTag.Text, _: 'URL and title' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('[URL and title](/url/	"title preceded by a tab").', [
                { $: InlineTag.Link, l: '/url/', t: 'title preceded by a tab', _: [{ $: InlineTag.Text, _: 'URL and title' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('[URL and title](/url/ "title has spaces afterward"  ).', [
                { $: InlineTag.Link, l: '/url/', t: 'title has spaces afterward', _: [{ $: InlineTag.Text, _: 'URL and title' }] },
                { $: InlineTag.Text, _: '.' }
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
                { $: InlineTag.Link, l: '', _: [{ $: InlineTag.Text, _: 'Empty' }] },
                { $: InlineTag.Text, _: '.' }
            ])
        });

        describe('strong', () => {
            _('Strong **phrase**.', [{ $: InlineTag.Text, _: 'Strong ' }, { $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: 'phrase' }] }, { $: InlineTag.Text, _: '.' }]);
            _('Strong **phrase with spaces**', [{ $: InlineTag.Text, _: 'Strong ' }, { $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: 'phrase with spaces' }] }]);
            _('Underscored strong __phrase__', [{ $: InlineTag.Text, _: 'Underscored strong ' }, { $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: 'phrase' }] }]);
            _('Underscored strong __phrase with spaces__.', [{ $: InlineTag.Text, _: 'Underscored strong ' }, { $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: 'phrase with spaces' }] }, { $: InlineTag.Text, _: '.' }]);
            _('_**Strong** in emphased_', [{ $: InlineTag.Em, _: [{ $: InlineTag.Strong, _: [{ $: InlineTag.Text, _: 'Strong' }] }, { $: InlineTag.Text, _: ' in emphased' }] }]);
        });

        describe('em', () => {
            _('Emphased *phrase*.', [{ $: InlineTag.Text, _: 'Emphased ' }, { $: InlineTag.Em, _: [{ $: InlineTag.Text, _: 'phrase' }] }, { $: InlineTag.Text, _: '.' }]);
            _('Emphased *phrase with spaces*', [{ $: InlineTag.Text, _: 'Emphased ' }, { $: InlineTag.Em, _: [{ $: InlineTag.Text, _: 'phrase with spaces' }] }]);
            _('Underscored emphased _phrase_', [{ $: InlineTag.Text, _: 'Underscored emphased ' }, { $: InlineTag.Em, _: [{ $: InlineTag.Text, _: 'phrase' }] }]);
            _('Underscored emphased _phrase with spaces_.', [{ $: InlineTag.Text, _: 'Underscored emphased ' }, { $: InlineTag.Em, _: [{ $: InlineTag.Text, _: 'phrase with spaces' }] }, { $: InlineTag.Text, _: '.' }]);
            _('__*Emphased* in strong__', [{ $: InlineTag.Strong, _: [{ $: InlineTag.Em, _: [{ $: InlineTag.Text, _: 'Emphased' }] }, { $: InlineTag.Text, _: ' in strong' }] }]);
        });

        describe('del', () => {
            _('Deleted ~phrase~', [{ $: InlineTag.Text, _: 'Deleted ~phrase~' }]);
            _('Deleted ~phrase with spaces~.', [{ $: InlineTag.Text, _: 'Deleted ~phrase with spaces~.' }]);
        });

        describe('code', () => {
            _('Inline `code`', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Code, _: 'code' }]);
            _('Inline ` code with spaces `', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Code, _: 'code with spaces' }]);
            _('Inline ``code with ` char``', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Code, _: 'code with ` char' }]);
        });
    });

    describe('pedantic', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlinePedantic);
        const _ = (s: string, r: TokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), [{}, r]));

        describe('link', () => {
            _('Just a [URL](/url/).', [
                { $: InlineTag.Text, _: 'Just a ' },
                { $: InlineTag.Link, l: '/url/', _: [{ $: InlineTag.Text, _: 'URL' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
            _('[URL and title]( /url/has space ).', [
                { $: InlineTag.Link, l: '/url/has space', _: [{ $: InlineTag.Text, _: 'URL and title' }] },
                { $: InlineTag.Text, _: '.' }
            ]);
        });
    });

    describe('gfm', () => {
        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineGfm);
        const _ = (s: string, r: TokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), [{}, r]));

        describe('del', () => {
            _('Deleted ~phrase~', [{ $: InlineTag.Text, _: 'Deleted ' }, { $: InlineTag.Del, _: [{ $: InlineTag.Text, _: 'phrase' }] }]);
            _('Deleted ~phrase with spaces~.', [{ $: InlineTag.Text, _: 'Deleted ' }, { $: InlineTag.Del, _: [{ $: InlineTag.Text, _: 'phrase with spaces' }] }, { $: InlineTag.Text, _: '.' }]);
        });
    });

    describe('math', () => {
        // inline token with math
        interface InlineToken extends InlineTokenMap<InlineToken>, InlineMath { }
        // inline context with math
        interface InlineContext extends ContextMap<any, InlineToken, NoMeta> { }

        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineNormal, MathSpan);
        const _ = (s: string, r: TokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), [{}, r]));

        _('Inline $math$', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Math, _: 'math' }]);
        _('Inline $ math with spaces $', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Math, _: 'math with spaces' }]);
        _('Inline $$math with $ char$$.', [{ $: InlineTag.Text, _: 'Inline ' }, { $: InlineTag.Math, _: 'math with $ char' }, { $: InlineTag.Text, _: '.' }]);
    });

    describe('abbrevs', () => {
        // metadata with abbrevs
        interface Meta extends MetaAbbrevs { }
        // block token with abbrevs
        interface InlineToken extends InlineTokenMap<InlineToken>, InlineAbbrev { }
        // context with abbrevs
        interface InlineContext extends ContextMap<UnknownToken, InlineToken, Meta> { }

        const parser = init<InlineContext, ContextTag.Inline>(ContextTag.Inline, ...InlineNormal, Abbrev);
        const _ = (s: string, r: TokenType<InlineToken>[]) => it(s, () => dse(parse(parser, s), [{}, r]));

        _(`*[HTTP Hyper Text Transfer Protocol]`, [
            { $: InlineTag.Abbrev, t: 'Hyper Text Transfer Protocol', _: "HTTP" },
        ]);

        _(`*[HTTP: Hyper Text Transfer Protocol]`, [
            { $: InlineTag.Abbrev, t: 'Hyper Text Transfer Protocol', _: "HTTP" },
        ]);

        _(`*[HTTP|Hyper Text Transfer Protocol]`, [
            { $: InlineTag.Abbrev, t: 'Hyper Text Transfer Protocol', _: "HTTP" },
        ]);

        _(`*[HTTP]`, [
            { $: InlineTag.Abbrev, t: undefined, _: "HTTP" },
        ]);
    });
}
