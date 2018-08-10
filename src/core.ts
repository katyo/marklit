import { ParseFunc, MatchPath, Matcher, matchAny, parseSeq } from './match';

export type AsUnion<Map> = Map extends string ? string : { [Tag in keyof Map]: { $: Tag } & Map[Tag] }[keyof Map];

export type ContextToken<CtxDef> = CtxDef extends [infer Token, infer Meta] ? Token : never;
export type ContextMeta<CtxDef> = CtxDef extends [infer Token, infer Meta] ? Meta : never;

export interface ParserHandle<CtxMap, Ctx extends keyof CtxMap> {
    p: ParserMatchers<CtxMap>; // parser matchers
    c: Ctx; // current context
    m: ContextMeta<CtxMap[Ctx]>; // parser meta
}

export type ParserRule<CtxMap, Ctx extends keyof CtxMap> = [
    Ctx[], // contexts
    number, // weight
    RegExp, // regexp to match
    ParseFunc<ContextToken<CtxMap[Ctx]>, ParserHandle<CtxMap, Ctx>> // parser function
];

export type ParserRules<CtxMap> = ParserRule<CtxMap, keyof CtxMap>[];

export type ParserMatchers<CtxMap> = {
    [Ctx in keyof CtxMap]: Matcher<ContextToken<CtxMap[Ctx]>, ParserHandle<CtxMap, Ctx>>
};

function buildRules<CtxMap>(rules: ParserRules<CtxMap>): ParserMatchers<CtxMap> {
    const matchers = {} as ParserMatchers<CtxMap>;
    for (const context in listContexts(rules)) {
        type MatchPathWithWeight = [
            number, // weight
            RegExp, // regexp to match
            ParseFunc<ContextToken<CtxMap[keyof CtxMap]>, ParserHandle<CtxMap, keyof CtxMap>> // parser function
        ];
        const paths = [] as MatchPathWithWeight[];
        for (const [contexts, ...path] of rules) {
            if (contexts.indexOf(((context as number) | 0) as keyof CtxMap) > -1) {
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

type FoundContexts<CtxMap> = { [ctx in keyof CtxMap]: 1 };

function listContexts<CtxMap>(rules: ParserRules<CtxMap>): FoundContexts<CtxMap> {
    const found = {} as FoundContexts<CtxMap>;
    for (const [contexts,] of rules) {
        for (const context of contexts) {
            found[context] = 1;
        }
    }
    return found;
}

export interface Parser<CtxMap, Ctx extends keyof CtxMap> {
    p: ParserMatchers<CtxMap>; // matchers
    s: Ctx; // starting context
}

export function init<CtxMap, Ctx extends keyof CtxMap = keyof CtxMap>(start: Ctx, ...rules: ParserRules<CtxMap>): Parser<CtxMap, Ctx> {
    return {
        p: buildRules(rules),
        s: start,
    };
}

export type ParserResult<CtxMap, Ctx extends keyof CtxMap> =
    CtxMap extends { [Key in Ctx]: [infer Token, infer Meta]; } ?
    ({ $: 1, _: [Meta, Token[]]; } | { $: 0, _: string }) :
    never;

export function parse<CtxMap, Ctx extends keyof CtxMap>(parser: Parser<CtxMap, Ctx>, source: string): ParserResult<CtxMap, Ctx> {
    const handle: ParserHandle<CtxMap, typeof parser.s> = {
        p: parser.p,
        c: parser.s,
        m: {} as ContextMeta<CtxMap[typeof parser.s]>,
    };
    try {
        const tokens = parseSeq(
            handle,
            handle.p[handle.c],
            source.replace(/\r\n|\r/g, '\n') // unify line feeds
                .replace(/\t/g, '    ') // replace tabs by four spaces
                .replace(/\u00a0/g, ' ') // replace non-break space by space
                .replace(/\u2424/g, '\n') // replace unicode NL by newline
            /*.replace(/^\s+$/gm, '')*/ // replace space-only lines by empty lines
        );
        return { $: 1, _: [handle.m, tokens] } as any as ParserResult<CtxMap, Ctx>;
    } catch (e) {
        return { $: 0, _: e.message } as ParserResult<CtxMap, Ctx>;
    }
}

export function parseNest<CtxMap, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string, ctx: NestedCtx): ContextToken<CtxMap[NestedCtx]>[];
export function parseNest<CtxMap, Ctx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string): ContextToken<CtxMap[Ctx]>[];
export function parseNest<CtxMap, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: ParserHandle<CtxMap, Ctx>, src: string, ctx: Ctx | NestedCtx = $.c): ContextToken<CtxMap[Ctx | NestedCtx]>[] {
    return parseSeq($.c === ctx ? $ : { ...$, c: ctx }, $.p[ctx], src);
}
