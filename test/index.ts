import basicInline from './basic/inline';
import basicBlock from './basic/block';
import renderHtml from './basic/render';
import { testMarked } from './test';
import originalTests from './original-out';
import newTests from './new-out';

describe('basic', () => {
    basicInline();
    basicBlock();
    renderHtml();
});

describe('marked', () => {
    describe('original', () => {
        testMarked(originalTests, [
            'backslash_escapes',
            'code_blocks',
            'code_spans',
            'horizontal_rules',
            'inline_html_advanced',
            'inline_html_comments',
            'inline_html_simple',
            'links_reference_style',
            'markdown_documentation_basics',
            'markdown_documentation_syntax',
            'ordered_and_unordered_lists',
            'tabs',
        ]);
    });

    describe('new', () => {
        testMarked(newTests, [
            'blockquote_list_item',
            'cm_blockquotes',
            'cm_html_blocks',
            'cm_link_defs',
            'cm_links',
            'cm_raw_html',
            'def_blocks',
            'double_link',
            'gfm_autolinks',
            'gfm_code',
            'gfm_code_hr_list',
            'gfm_del',
            'gfm_tables',
            'headings_id',
            'hr_list_break',
            'html_comments',
            'links',
            'list_item_text',
            'main',
            'redos_html_closing',
            'redos_nolink',
            'relative_urls',
            'same_bullet',
            'smartypants',
            'toplevel_paragraphs',
            'uppercase_hex',
        ]);
    });
});
