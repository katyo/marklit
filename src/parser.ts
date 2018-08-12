import { ParseFunc, MatchPath, Matcher, matchAny, parseSeq } from './match';
import { ContextToken, ContextMeta } from './model';

export interface ParserHandle<CtxMap, Ctx extends keyof CtxMap> {
    p: ParserMatchers<CtxMap>; // parser matchers
    c: Ctx; // current context
    m: ContextMeta<CtxMap[Ctx]> | { [key: string]: any }; // parser meta
}

export interface InitFunc<CtxMap, Ctx extends keyof CtxMap> {
    (m: ContextMeta<CtxMap[Ctx]>): void;
}

export type ParserRule<CtxMap, Ctx extends keyof CtxMap> = [
    Ctx[], // contexts
    number, // weight
    string, // regexp to match
    ParseFunc<ContextToken<CtxMap[Ctx]>, ParserHandle<CtxMap, Ctx>> // parser function
] | [
        Ctx[], // contexts
        number, // weight
        string, // regexp to match
        ParseFunc<ContextToken<CtxMap[Ctx]>, ParserHandle<CtxMap, Ctx>>, // parser function
        InitFunc<CtxMap, Ctx>
    ];

export type ParserRules<CtxMap> = ParserRule<CtxMap, keyof CtxMap>[];

export type ParserMatchers<CtxMap> = {
    [Ctx in keyof CtxMap]: Matcher<ContextToken<CtxMap[Ctx]>, ParserHandle<CtxMap, Ctx>>
};

function buildRules<CtxMap>(rules: ParserRules<CtxMap>): ParserMatchers<CtxMap> {
    const ctxs: (keyof CtxMap)[] = [];
    for (const [ctxl] of rules) {
        for (const ctx of ctxl) {
            if (ctxs.indexOf(ctx) < 0) {
                ctxs.push(ctx);
            }
        }
    }
    const matchers = {} as ParserMatchers<CtxMap>;
    for (const context of ctxs) {
        type MatchPathWithWeight = [
            number, // weight
            string, // regexp to match
            ParseFunc<ContextToken<CtxMap[keyof CtxMap]>, ParserHandle<CtxMap, keyof CtxMap>> // parser function
        ];
        const paths = [] as MatchPathWithWeight[];
        for (const [contexts, ...path] of rules) {
            if (contexts.indexOf(context as keyof CtxMap) > -1) {
                paths.push(path as MatchPathWithWeight);
            }
        }
        matchers[context] = matchAny(paths
            .sort(([weight_a,], [weight_b,]) =>
                weight_a < weight_b ? -1 :
                    weight_b < weight_a ? 1 : 0)
            .map(([, ...path]) =>
                path as MatchPath<ContextToken<CtxMap[keyof CtxMap]>, ParserHandle<CtxMap, keyof CtxMap>>));
    }
    return matchers;
}

export type ParserInits<CtxMap> = InitFunc<CtxMap, keyof CtxMap>[];

export interface Parser<CtxMap, Ctx extends keyof CtxMap> {
    p: ParserMatchers<CtxMap>; // matchers
    m: ParserInits<CtxMap>; // initializers
    s: Ctx; // starting context
}

export function init<CtxMap extends { [0]: any }>(...rules: ParserRules<CtxMap>): Parser<CtxMap, 0>;
export function init<CtxMap, Ctx extends keyof CtxMap>(start: Ctx, ...rules: ParserRules<CtxMap>): Parser<CtxMap, Ctx>;
export function init<CtxMap>(...rules: ParserRules<CtxMap>): Parser<CtxMap, any> {
    let start = typeof rules[0] == 'number' ? rules.shift() : 0;
    return {
        p: buildRules(rules),
        m: rules.filter(rule => rule.length > 4).map(rule => rule[4] as InitFunc<CtxMap, keyof CtxMap>),
        s: start,
    };
}

export type ParserResult<CtxMap, Ctx extends keyof CtxMap> =
    CtxMap extends { [Key in Ctx]: [infer Token, infer Meta]; } ?
    ({ $: 1, _: [Meta, Token[]]; } | { $: 0, _: string }) :
    never;

export function parse<CtxMap, Ctx extends keyof CtxMap>({ p, s, m }: Parser<CtxMap, Ctx>, source: string): ParserResult<CtxMap, Ctx> {
    const meta = {} as ContextMeta<CtxMap[Ctx]>;
    for (const init of m) {
        init(meta);
    }
    const $: ParserHandle<CtxMap, Ctx> = {
        p,
        c: s,
        m: meta,
    };
    try {
        const tokens = parseNest(
            $,
            source.replace(/\r\n|\r/g, '\n') // unify line feeds
                .replace(/\t/g, '    ') // replace tabs by four spaces
                .replace(/\u00a0/g, ' ') // replace non-break space by space
                .replace(/\u2424/g, '\n') // replace unicode NL by newline
            /*.replace(/^\s+$/gm, '')*/ // replace space-only lines by empty lines
        );
        return { $: 1, _: [meta, tokens] } as any as ParserResult<CtxMap, Ctx>;
    } catch (e) {
        return { $: 0, _: e.message } as ParserResult<CtxMap, Ctx>;
    }
}

export function parseNest<CtxMap, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string, ctx: NestedCtx): ContextToken<CtxMap[NestedCtx]>[];
export function parseNest<CtxMap, Ctx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string): ContextToken<CtxMap[Ctx]>[];
export function parseNest<CtxMap, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string, ctx: Ctx | NestedCtx = $.c): ContextToken<CtxMap[Ctx | NestedCtx]>[] {
    return parseSeq($.c === ctx ? $ : { ...$, c: ctx }, $.p[ctx], src);
}
