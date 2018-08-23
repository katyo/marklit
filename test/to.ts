import { join } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';

const { stringify: tojs } = JSON;

const { argv } = process;

if (argv.length != 4) {
    console.log('Usage: to <dir-with-tests> <output-ts-file>');
    process.exit(-1);
}

const [, , input, output] = argv;

writeFileSync(
    output,
    convdir(input)
);

function convdir(path: string) {
    const ents = readdirSync(path)
        .filter(ent => /\.(?:md|html)$/.test(ent));
    const tests = ents
        .map(ent => ent.replace(/\.(?:md|html)$/, ''))
        .filter((ent, idx, arr) => arr.indexOf(ent) == idx)
        .filter(ent => ents.indexOf(`${ent}.md`) != -1 &&
            ents.indexOf(`${ent}.html`) != -1);
    let src = `{\n`;
    for (const test of tests) {
        const html = readFileSync(join(path, `${test}.html`), 'utf8');
        let md = readFileSync(join(path, `${test}.md`), 'utf8');
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
        src += `    "${test}": [\n`;
        src += `        ${tojs(opts)},\n`;
        src += `        ${tojs(md)},\n`;
        src += `        ${tojs(html)}\n`;
        src += `    ]${test != tests[tests.length - 1] ? ',' : ''}\n`;
    }
    src += `}\n`;
    return src;
}
