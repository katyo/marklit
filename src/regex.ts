export function countRe(regexp: RegExp): number {
    return ((new RegExp(unwrapRe(regexp)[0] + '|')).exec('') as RegExpExecArray).length - 1;
}

export function substRe(regexp: RegExp, substs: Record<string, RegExp | string>): RegExp {
    let [source, flags] = unwrapRe(regexp);
    for (const name in substs) {
        const val = substs[name];
        source = source.replace(new RegExp(name, 'g'),
            typeof val == 'string' ? val : unwrapRe(val)[0]
                .replace(/(^|[^\[])\^/g, '$1'));
    }
    return new RegExp(source, flags);
}

export function unwrapRe(regexp: RegExp): [string, string] {
    const strexp = regexp.toString();
    const flags = (/[gimuy]*$/.exec(strexp) as RegExpExecArray)[0];
    const source = strexp.substring(1, strexp.length - 1 - flags.length);
    return [source, flags];
}

export function shiftRe(regex: RegExp, offset: number): string {
    return unwrapRe(regex)[0]
        .replace(/\\\\|\\([1-9][0-9]*)/,
            (_, n) => n ? `\\${+n + offset}` : _);
}
