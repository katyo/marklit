import { MatchPath, MatchState, Matcher, matchAny, parseSeq } from './match';
import { InitTag, HasContexts, HasMeta, HasInit, ContextKey, ContextToken, ContextMeta, ContextResult } from './model';

export interface ParseFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>(ctx: ParserHandle<CtxMap, Ctx, MetaType>, ...captures: string[]): void;
}

export interface ParserHandle<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> extends MatchState {
    p: ParserMatchers<CtxMap, Meta>; // parser matchers
    c: Ctx; // current context
    m: Meta; // parser meta
    t: ContextToken<CtxMap, Ctx>[];
}

export function pushToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>, token: ContextToken<CtxMap, Ctx>) {
    tokens.push(token);
}

export function pushText<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta, Token extends string & ContextToken<CtxMap, Ctx>>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>, token: Token) {
    if (token.length) {
        if (tokens.length &&
            typeof tokens[tokens.length - 1] == 'string') {
            (tokens[tokens.length - 1] as any as string) += token;
        } else {
            tokens.push(token as Token);
        }
    }
}

export interface InitFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>(m: MetaType): void;
}

export type ParserRule<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = [
    Ctx[], // contexts
    number, // weight
    string, // regexp to match
    ParseFunc<CtxMap, Ctx, Meta> // parser function
] | [
        Ctx[], // contexts
        number, // weight
        string, // regexp to match
        ParseFunc<CtxMap, Ctx, Meta>, // parser function
        InitFunc<CtxMap, Ctx, Meta>
    ];

export type ParserRules<CtxMap extends HasContexts, Meta> = ParserRule<CtxMap, ContextKey<CtxMap>, Meta>[];

export type ParserMatchers<CtxMap extends HasContexts, Meta> = {
    [Ctx in ContextKey<CtxMap>]: Matcher<ParserHandle<CtxMap, Ctx, Meta>>
};

function buildRules<CtxMap extends HasContexts & HasMeta>(rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): ParserMatchers<CtxMap, ContextMeta<CtxMap>> {
    const ctxs: (ContextKey<CtxMap>)[] = [];
    for (const [ctxl] of rules) {
        for (const ctx of ctxl) {
            if (ctxs.indexOf(ctx) < 0) {
                ctxs.push(ctx);
            }
        }
    }
    const matchers = {} as ParserMatchers<CtxMap, ContextMeta<CtxMap>>;
    for (const context of ctxs) {
        type MatchPathWithWeight = [
            number, // weight
            string, // regexp to match
            ParseFunc<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>> // parser function
        ];
        const paths = [] as MatchPathWithWeight[];
        for (const [contexts, ...path] of rules) {
            if (contexts.indexOf(context as ContextKey<CtxMap>) > -1) {
                paths.push(path as MatchPathWithWeight);
            }
        }
        matchers[context] = matchAny(paths
            .sort(([weight_a,], [weight_b,]) =>
                weight_a < weight_b ? -1 :
                    weight_b < weight_a ? 1 : 0)
            .map(([, ...path]) =>
                path as MatchPath<ParserHandle<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>>>));
    }
    return matchers;
}

export type ParserInits<CtxMap extends HasContexts & HasMeta> = InitFunc<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>>[];

export interface Parser<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> {
    p: ParserMatchers<CtxMap, ContextMeta<CtxMap>>; // matchers
    m: ParserInits<CtxMap>; // initializers
    s: Ctx; // starting context
}

export function init<CtxMap extends HasContexts & HasMeta & HasInit>(...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, InitTag>;
export function init<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>(start: Ctx, ...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, Ctx>;
export function init<CtxMap extends HasContexts & HasMeta>(...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, any> {
    let start = typeof rules[0] == 'number' ? rules.shift() : 0;
    return {
        p: buildRules(rules),
        m: rules.filter(rule => rule.length > 4).map(rule => rule[4] as InitFunc<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>>),
        s: start,
    };
}

export type ParserSuccess<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> = {
    $: 1, _: ContextResult<CtxMap, Ctx>;
};

export type ParserError = { $: 0, _: string; };

export type ParserResult<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> =
    ParserSuccess<CtxMap, Ctx> | ParserError;

export function parse<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>({ p, s, m }: Parser<CtxMap, Ctx>, source: string): ParserResult<CtxMap, Ctx> {
    const meta = {} as ContextMeta<CtxMap>;
    for (const init of m) {
        init(meta);
    }
    const $ = {
        p,
        m: meta,
    } as ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>;
    try {
        return {
            $: 1, _: [$.m, parseNest(
                $,
                source
                    .replace(/\r\n|\r/g, '\n') // unify line feeds
                    .replace(/\t/g, '    ') // replace tabs by four spaces
                    .replace(/\u00a0/g, ' ') // replace non-break space by space
                    .replace(/\u2424/g, '\n'), // replace unicode NL by newline
                s
            )]
        };
    } catch (e) {
        return { $: 0, _: e.message };
    }
}

export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx | NestedCtx, ContextMeta<CtxMap>>, src: string, ctx: NestedCtx): ContextToken<CtxMap, NestedCtx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string): ContextToken<CtxMap, Ctx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx | NestedCtx, ContextMeta<CtxMap>>, src: string, ctx: Ctx | NestedCtx = $.c): ContextToken<CtxMap, Ctx | NestedCtx>[] {
    const $$ = {
        ...$,
        t: [],
        c: ctx,
        s: src.replace(/^ +$/gm, ''), // remove spaces on empty lines which has spaces only
        r: true
    };
    parseSeq($$, $.p[ctx]);
    if ($$.r && $$.s.length) throw new Error(`Unable to parse: ${$$.s}...`);
    return $$.t;
}
