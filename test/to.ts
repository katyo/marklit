import { join } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';

const { stringify: tojs } = JSON;

function convdir(base: string, name: string) {
    const ents = readdirSync(join(base, name))
        .filter(ent => /\.(?:md|html)$/.test(ent));
    const tests = ents
        .map(ent => ent.replace(/\.(?:md|html)$/, ''))
        .filter((ent, idx, arr) => arr.indexOf(ent) == idx)
        .filter(ent => ents.indexOf(`${ent}.md`) != -1 &&
            ents.indexOf(`${ent}.html`) != -1);
    let src = `export const ${name}Tests: Record<string, [Record<string, any>, string, string]> = {\n`;
    for (const test of tests) {
        const html = readFileSync(join(base, name, `${test}.html`), 'utf8');
        let md = readFileSync(join(base, name, `${test}.md`), 'utf8');
        const opts_match = md.match(/^(-{3,}\n)((?:[0-9a-zA-Z_]+\s*:\s*[^\n]+\n)*)\1\n*/);
        const opts: Record<string, any> = {};
        if (opts_match) {
            for (const opt of opts_match[2].split(/\n/)) {
                if (opt) {
                    const [key, val] = opt.split(/\s*:\s*/);
                    opts[key] = val == 'true' ? true : val == 'false' ? false : !isNaN(parseFloat(val)) ? parseFloat(val) : val;
                }
            }
            md = md.slice(opts_match[0].length);
        }
        src += `    ${test}: [\n`;
        src += `        ${tojs(opts)},\n`;
        src += `        ${tojs(md)},\n`;
        src += `        ${tojs(html)},\n`;
        src += '    ],\n';
    }
    src += '};\n';
    return src;
}

writeFileSync(
    join('./test', 'marked.ts'),
    [
        convdir('./test', 'original'),
        convdir('./test', 'new')
    ].join('\n')
);
