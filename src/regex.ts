export function countRe(regexp: string): number {
    return ((new RegExp(regexp + '|')).exec('') as RegExpExecArray).length - 1;
}

export function substRe(regexp: string, substs: Record<string, string>): string {
    for (const name in substs) {
        const subre = substs[name];
        regexp = regexp.replace(new RegExp(name, 'g'),
            subre.replace(/(^|[^\[])\^/g, '$1'));
    }
    return regexp;
}

export function shiftRe(regexp: string, offset: number): string {
    return regexp
        .replace(/\\\\|\\([1-9][0-9]*)/,
            (_, n) => n ? `\\${+n + offset}` : _);
}
