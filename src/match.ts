import { countRe, shiftRe } from './regex';

export interface MatchState {
    s: string; // source
    r: boolean; // rejected
}

export function initMatch(source: string): MatchState {
    return { s: source, r: true };
}

export function backpedal(state: MatchState, chunk: string) {
    state.s = chunk + state.s;
}

export function reject(state: MatchState) {
    state.r = true;
}

export interface MatchFunc<Self> {
    (self: Self & MatchState, ...captures: string[]): void;
}

export type CaptureMatcher<Self> = [
    number, // match parens offset
    MatchFunc<Self> // parser to apply
];

export interface Matcher<Self> {
    /*
     *  Because any parse function can fail we need multiple regexps like this:
     *
     * [
     *   /^(rule1 regex)|(rule2 regex)|(rule3 regex)|.../,
     *   /^(rule2 regex)|(rule3 regex)|(rule4 regex)|.../,
     *   ...
     *   /^(ruleN regex)/,
     * ]
     */
    r: RegExp[];
    m: CaptureMatcher<Self>[];
}

export type MatchPath<Self> = [
    string, // regular expression to match
    MatchFunc<Self> // parser to apply
];

export function parseSeq<Type, Self>(matcher: Matcher<Self>, state: Self & MatchState) {
    for (; state.s.length > 0;) {
        doMatch(matcher, state);
        if (state.r) break;
    }
}

export function matchAny<Type, Self>(matchers: MatchPath<Self>[]): Matcher<Self> {
    let captures = 1;

    const match: CaptureMatcher<Self>[] = new Array(matchers.length);
    const exprs: string[] = new Array(matchers.length);

    for (let i = 0; i < matchers.length; i++) {
        const [regexp, parser] = matchers[i];
        const offset = captures;
        captures += countRe(regexp) + 1;
        match[i] = [offset, parser];
        exprs[i] = `(${shiftRe(regexp, offset)})`;
    }

    const regex: RegExp[] = new Array(matchers.length);

    for (let i = 0; i < matchers.length; i++) {
        regex[i] = new RegExp('^' + exprs.slice(i).join('|'));
    }

    return { r: regex, m: match };
}

export function doMatch<Type, Self>({ r: regex, m: match }: Matcher<Self>, state: Self & MatchState) {
    for (let r = 0; r < regex.length;) {
        const captures = regex[r].exec(state.s);
        const roff = match[r][0] - 1;

        if (captures == null) {
            state.r = true;
            return;
        }

        for (let m = r; m < match.length; m++) {
            let [off, fn] = match[m];
            off -= roff;

            if (captures[off] != null) {
                const s = state.s;
                const s_ = state.s = state.s.substring(captures[0].length);
                state.r = false;
                fn(state, ...captures.slice(off));
                if (!state.r) return; // successfully matched
                // re-match when rejected
                if (state.s == s_) state.s = s; // rollback
                // try next match
                r = m + 1;
                break;
            }
        }
    }
}
