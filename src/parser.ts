import { MatchPath, MatchState, Matcher, matchAny, parseSeq } from './match';
import {
    InitTag, HasContexts, HasMeta, HasInit,
    TaggedToken, TokenTag,
    ContextKey, ContextToken, ContextMeta, ContextResult
} from './model';

export interface ParseFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>($: ParserHandle<CtxMap, Ctx, MetaType>, ...captures: string[]): void;
}

export interface ParserHandle<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> extends MatchState {
    p: ParserMatchers<CtxMap, Meta>; // parser matchers
    a: ParserProcs<CtxMap, Meta>;
    c: Ctx; // current context
    m: Meta; // parser meta
    t: ContextToken<CtxMap, Ctx>[];
}

export interface InitFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>(m: MetaType): void;
}

export type ParserInits<CtxMap extends HasContexts, Meta> = InitFunc<CtxMap, ContextKey<CtxMap>, Meta>[];

export interface ProcFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>($: ParserHandle<CtxMap, Ctx, MetaType>, token: ContextToken<CtxMap, Ctx>): void;
}

export type ParserContextProcs<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = {
    [Tag in TokenTag<ContextToken<CtxMap, Ctx>>]: ProcFunc<CtxMap, ContextKey<CtxMap>, Meta>;
}

export type ParserProcs<CtxMap extends HasContexts, Meta> = {
    [Ctx in ContextKey<CtxMap>]: ParserContextProcs<CtxMap, Ctx, Meta>;
}

export type ParserRuleSimple<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = [
    Ctx[], // contexts
    number, // weight (order)
    string, // regexp to match
    ParseFunc<CtxMap, Ctx, Meta> // parser function
];

export type ParserRuleWithInit<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = [
    Ctx[], // contexts
    number, // weight (order)
    string, // regexp to match
    ParseFunc<CtxMap, Ctx, Meta>, // parsing function
    InitFunc<CtxMap, Ctx, Meta> // init function
];

export type ParserRuleWithPost<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = [
    Ctx[], // contexts
    number, // weight (order)
    string, // regexp to match
    ParseFunc<CtxMap, Ctx, Meta>, // parsing function
    TokenTag<ContextToken<CtxMap, Ctx>>[], // token tags
    ProcFunc<CtxMap, Ctx, Meta> // post-processing function
];

export type ParserRuleWithInitAndPost<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> = [
    Ctx[], // contexts
    number, // weight (order)
    string, // regexp to match
    ParseFunc<CtxMap, Ctx, Meta>, // parsing function
    InitFunc<CtxMap, Ctx, Meta>, // init function
    TokenTag<ContextToken<CtxMap, Ctx>>[], // token tags
    ProcFunc<CtxMap, Ctx, Meta> // post-processing function
];

export type ParserRule<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta>
    = ParserRuleSimple<CtxMap, Ctx, Meta>
    | ParserRuleWithInit<CtxMap, Ctx, Meta>
    | ParserRuleWithPost<CtxMap, Ctx, Meta>
    | ParserRuleWithInitAndPost<CtxMap, Ctx, Meta>
    ;

export type ParserRules<CtxMap extends HasContexts, Meta> = ParserRule<CtxMap, ContextKey<CtxMap>, Meta>[];

export type ParserMatchers<CtxMap extends HasContexts, Meta> = {
    [Ctx in ContextKey<CtxMap>]: Matcher<ParserHandle<CtxMap, Ctx, Meta>>
};

export interface Parser<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> {
    p: ParserMatchers<CtxMap, ContextMeta<CtxMap>>; // matchers
    m: ParserInits<CtxMap, ContextMeta<CtxMap>>; // initializers
    a: ParserProcs<CtxMap, ContextMeta<CtxMap>>; // postprocessors
    s: Ctx; // starting context
}

export function init<CtxMap extends HasContexts & HasMeta & HasInit>(...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, InitTag>;
export function init<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>(start: Ctx, ...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, Ctx>;
export function init<CtxMap extends HasContexts & HasMeta>(...rules: ParserRules<CtxMap, ContextMeta<CtxMap>>): Parser<CtxMap, any> {
    let start = typeof rules[0] == 'number' ? rules.shift() : 0;

    // aggregating matchers
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

    // aggregating init and post fns
    const inits = [] as ParserInits<CtxMap, ContextMeta<CtxMap>>;
    const procs = {} as ParserProcs<CtxMap, ContextMeta<CtxMap>>;

    for (const rule of rules) {
        if (rule.length > 4 && typeof rule[4] == 'function') {
            inits.push(rule[4] as InitFunc<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>>);
        }
        if (rule.length > 5) {
            const [ctxs,] = rule;
            const [tags, proc] = rule.slice(rule.length > 6 ? 5 : 4) as [
                TokenTag<ContextToken<CtxMap, typeof ctxs[number]>>[],
                ProcFunc<CtxMap, typeof ctxs[number], ContextMeta<CtxMap>>
            ];
            if (tags.length) {
                for (const ctx of ctxs) {
                    if (!procs[ctx]) procs[ctx] = {} as ParserContextProcs<CtxMap, typeof ctx, ContextMeta<CtxMap>>;
                    for (const tag of tags) {
                        procs[ctx][tag] = proc;
                    }
                }
            }
        }
    }

    return {
        p: matchers,
        m: inits,
        a: procs,
        s: start,
    };
}

export type ParserSuccess<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> = {
    $: 1, _: ContextResult<CtxMap, Ctx>;
};

export type ParserError = { $: 0, _: string; };

export type ParserResult<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> =
    ParserSuccess<CtxMap, Ctx> | ParserError;

export function parse<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>({ p, a, s, m }: Parser<CtxMap, Ctx>, source: string): ParserResult<CtxMap, Ctx> {
    const meta = {} as ContextMeta<CtxMap>;
    for (const init of m) {
        init(meta);
    }
    const $ = {
        p,
        a,
        m: meta,
        c: s,
    } as ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>;
    //try {
    const tokens = parseNest(
        $,
        source
            .replace(/\r\n|\r/g, '\n') // unify line feeds
            .replace(/\t/g, '    ') // replace tabs by four spaces
            .replace(/\u00a0/g, ' ') // replace non-break space by space
            .replace(/\u2424/g, '\n') // replace unicode NL by newline
    );
    procNest($, tokens);
    return { $: 1, _: [$.m, tokens] };
    //} catch (e) {
    //    return { $: 0, _: e.message };
    //}
}

export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string, ctx: NestedCtx): ContextToken<CtxMap, NestedCtx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string): ContextToken<CtxMap, Ctx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string, ctx: Ctx | NestedCtx = $.c): ContextToken<CtxMap, Ctx | NestedCtx>[] {
    const $$ = {
        ...$,
        t: [],
        c: ctx,
        s: src.replace(/^ +$/gm, ''), // remove spaces on empty lines which has spaces only
        r: true
    };
    parseSeq($$.p[$$.c], $$);
    if ($$.r && $$.s.length) throw new Error(`Unable to parse: ${$$.s}...`);
    return $$.t;
}

export function procNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, Ctx>[]): void;
export function procNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, Ctx>[], ctx: NestedCtx): void;
export function procNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, Ctx>[], ctx: Ctx | NestedCtx = $.c) {
    const posts = $.a[$.c];
    if (posts) {
        for (const token of tokens) {
            if (typeof token == 'object') {
                const proc = (posts as any)[(token as any as TaggedToken<keyof any>).$];
                if (proc) proc($, token);
            }
        }
    }
}

export function pushToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>, token: ContextToken<CtxMap, Ctx>) {
    tokens.push(token);
}

export function pushText<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta, Token extends string & ContextToken<CtxMap, Ctx>>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>, token: string) {
    if (token.length) {
        if (tokens.length &&
            typeof tokens[tokens.length - 1] == 'string') {
            (tokens[tokens.length - 1] as any as string) += token;
        } else {
            tokens.push(token as Token);
        }
    }
}
