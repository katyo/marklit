import { testMarked, testSpecs } from './test';

import basicInline from './basic/inline';
import basicBlock from './basic/block';
import renderHtml from './basic/render';

import originalTests from './original-out.json';
import newTests from './new-out.json';

import commonmark_0_28 from './specs/commonmark.0.28.json';
import gfm_0_28 from './specs/gfm.0.28.json';
import marked from './specs/marked.json';

const { env: {
    TEST_BASIC,
    TEST_BASIC_PARSE,
    TEST_BASIC_PARSE_INLINE,
    TEST_BASIC_PARSE_BLOCK,
    TEST_BASIC_RENDER,
    TEST_BASIC_RENDER_HTML,

    TEST_MARKED,
    TEST_MARKED_ORIG,
    TEST_MARKED_ORIG_WL,
    TEST_MARKED_NEW,
    TEST_MARKED_NEW_WL,

    TEST_SPEC,
    TEST_SPEC_CM,
    TEST_SPEC_CM_WL,
    TEST_SPEC_GFM,
    TEST_SPEC_GFM_WL,
    TEST_SPEC_MARKED,
    TEST_SPEC_MARKED_WL,
} } = process;

const originalBlacklist = blacklist([
    'backslash_escapes',
    'code_spans',
    'inline_html_advanced',
    'inline_html_comments',
    'inline_html_simple',
    'markdown_documentation_basics',
    'markdown_documentation_syntax',
    'hard_wrapped_paragraphs_with_list_like_lines',
], TEST_MARKED_ORIG_WL);

const newBlacklist = blacklist([
    'cm_html_blocks',
    'cm_links',
    'cm_raw_html',
    'double_link',
    'html_comments',
    'main',
    'redos_html_closing',
    'redos_nolink',
    'relative_urls',
    'toplevel_paragraphs',
    'nogfm_hashtag',
], TEST_MARKED_NEW_WL);

const commonmarkBlacklist = blacklist([
    // Marked specific
    1, 2, 3, 7, // Tabs
    19, // Thematic breaks
    40, 45, 46, 49, // ATX headings
    51, 52, 56, 62, 64, // Setext headings
    82, // Indented code blocks
    93, 95, 96, 97, 101, 102, 106, 108, 112, // Fenced code blocks
    167, // Link reference definitions
    185, 186, // Paragraphs
    198, 199, 200, 201, // Block quotes
    229, 237, 236, 227, 218, 243, 259, 241, 239, 247, 246, 225, 220, 258, 260, 244, // List items
    282, 270, 280, 278, 273, 274, 264, 265, 276, 279, 267, 269, // Lists
    290, 291, 300, 301, // Backslash escapes
    311, 309, 310, // Entity and numeric character references
    330, 316, 328, 320, 323, 322, // Code spans
    334, 342, 348, 349, 352, 353, 354, 355, 356, 360, 368, 369, 371, 372, 378, 380, 381, 382, 387, 388, 392, 393, 394, 395, 396, 402, 403, 409, 416, 419, 420, 421, 422, 423, 424, 428, 431, 432, 433, 434, 435, 436, 443, 444, 445, 448, 449, 451, 453, 454, 455, 456, 457, 458, // Emphasis and strong emphasis
    474, 478, 483, 489, 490, 491, 495, 496, 497, 499, 503, 504, 507, 508, 509, 523, // Links
    544, 545, 546, 547, 548, 556, 560, // Images
    582, 573, 579, 583, // Autolinks
    597, 598, // Raw HTML
    613, // Hard line breaks
    621, // Soft line breaks

    // Marklit specific
    116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, // HTML blocks
    271, 272, // Lists (html comment)
    298, // Backslash escapes (html)
    308, // Entity and numeric character references (html)
    325, // Code spans (html)
    452, // Emphasis and strong emphasis (html)
    466, // Links (html)

    584, 585, 586, 587, 588, 594, 596, 599, 600, 601, 602, 603, // Raw HTML
    614, 615, // Hard line breaks (html)
], TEST_SPEC_CM_WL);

const gfmBlacklist = blacklist([
    // Marked specific
    607, // Autolinks
    629, // Raw HTML
], TEST_SPEC_GFM_WL);

const markedBlacklist = blacklist([
    // Marked specific
    1, // Code spans
    10, // Links
], TEST_SPEC_MARKED_WL);

if (!disabled(TEST_BASIC)) {
    describe('basic', () => {
        if (!disabled(TEST_BASIC_PARSE)) {
            if (!disabled(TEST_BASIC_PARSE_INLINE)) {
                describe('inline', basicInline);
            }

            if (!disabled(TEST_BASIC_PARSE_BLOCK)) {
                describe('block', basicBlock);
            }
        }

        if (!disabled(TEST_BASIC_RENDER)) {
            describe('render', () => {
                if (!disabled(TEST_BASIC_RENDER_HTML)) {
                    describe('html', renderHtml);
                }
            });
        }
    });
}

if (!disabled(TEST_MARKED)) {
    describe('marked', () => {
        if (!disabled(TEST_MARKED_ORIG)) {
            describe('original', () => {
                testMarked({ gfm: true, tables: true, headerIds: false, xhtml: true }, originalTests as any, originalBlacklist);
            });
        }

        if (!disabled(TEST_MARKED_NEW)) {
            describe('new', () => {
                testMarked({ gfm: true, tables: true, headerIds: true }, newTests as any, newBlacklist);
            });
        }
    });
}

if (!disabled(TEST_SPEC)) {
    describe('specs', () => {
        if (!disabled(TEST_SPEC_CM)) {
            describe('commonmark.0.28', () => {
                testSpecs({ headingId: false, gfm: true, tables: true, xhtml: true }, commonmark_0_28, commonmarkBlacklist);
            });
        }

        if (!disabled(TEST_SPEC_GFM)) {
            describe('gfm.0.28', () => {
                testSpecs({ gfm: true, breaks: false, tables: true }, gfm_0_28, gfmBlacklist);
            });
        }

        if (!disabled(TEST_SPEC_MARKED)) {
            describe('marked', () => {
                testSpecs({ gfm: true, tables: true }, marked, markedBlacklist);
            });
        }
    });
}

function disabled(value: string | void): boolean {
    return value == 'no' || value == 'off' || value == '0';
}

function blacklist<T extends string | number>(b: T[], e?: string | (string | number)[]) {
    const w = e ? (typeof e == 'string' ? e.split(/\s*[\s,:;]\s*/) : e).map(v => {
        const n = typeof v == 'string' ? parseInt(v, 10) : v;
        return isNaN(n) ? v : n;
    }) : [];
    let r = [];
    for (var i = 0; i < b.length; i++) {
        if (w.indexOf(b[i]) < 0) {
            r.push(b[i]);
        }
    }
    return r;
}
