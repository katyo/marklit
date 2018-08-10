import { countRe, shiftRe } from './regex';

export interface ParseFunc<Type, Self> {
    (ctx: Self, source: string, ...captures: string[]): [Type | void, string];
}

export type CaptureMatcher<Type, Self> = [
    number, // starting of match parens
    ParseFunc<Type, Self> // parser to apply
];

export interface Matcher<Type, Self> {
    r: RegExp;
    m: CaptureMatcher<Type, Self>[];
}

export type MatchPath<Type, Self> = [
    string, // regular expression to match
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
    const exprs: string[] = new Array(matchers.length);

    for (let i = 0; i < matchers.length; i++) {
        const [regexp, parser] = matchers[i];
        const offset = captures + 1;
        captures += countRe(regexp) + 1;
        match[i] = [offset, parser];
        exprs[i] = `(${shiftRe(regexp, offset)})`;
    }

    return { r: new RegExp(`^${exprs.join('|')}`), m: match };
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
