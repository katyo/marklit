export interface ParseFunc<Type, Self> {
    (ctx: Self, source: string, ...captures: string[]): [Type | void, string];
}

export type CaptureMatcher<Type, Self> = [
    number, // starting of match parens
    ParseFunc<Type, Self> // parser to apply
];

export interface Matcher<Type, Self> {
    //(self: Self, source: string): [Type | void, string];
    r: RegExp;
    m: CaptureMatcher<Type, Self>[];
}

export type MatchPath<Type, Self> = [
    RegExp, // regular expression to match
    ParseFunc<Type, Self> // parser to apply
];

export function parseSeq<Type, Self>(self: Self, matcher: Matcher<Type, Self>, source: string): Type[] {
    const tokens: Type[] = [];

    for (; source.length > 0;) {
        const [token, rest] = doMatch(matcher, self, source);

        if (typeof token == 'string' &&
            tokens.length > 0 &&
            typeof tokens[tokens.length - 1] == 'string') {
            (tokens[tokens.length - 1] as any as string) += token;
        } else if (token != null) {
            tokens.push(token as Type);
        }

        source = rest;
    }

    return tokens;
}

export function matchAny<Type, Self>(matchers: MatchPath<Type, Self>[]): Matcher<Type, Self> {
    let captures = 0;

    const match: CaptureMatcher<Type, Self>[] = new Array(matchers.length);

    for (let i = 0; i < matchers.length; i++) {
        const p = matchers[i];
        const offset = captures + 1;
        captures += countCaptures(p[0]) + 1;
        match[i] = [offset, p[1]];
    }

    const regex = new RegExp(matchers
        .map(([r,], i) => `^(${shiftRe(r, match[i][0])})`)
        .join('|'));

    return { r: regex, m: match };
}

export function doMatch<Type, Self>({ r: regex, m: match }: Matcher<Type, Self>, self: Self, source: string): [Type | void, string] {
    const captures = regex.exec(source);

    if (captures != null) {
        for (const [off, fn] of match) {
            if (captures[off] != null) {
                source = source.substring(captures[0].length);
                return fn(self, source, ...captures.slice(off));
            }
        }
    }

    throw `Unable to parse: "${source.substr(0, 80)}"`;
}

function countCaptures(regexp: RegExp): number {
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
