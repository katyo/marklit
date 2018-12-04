import { MatchPath, MatchState, Matcher, matchAny, parseSeq } from './match';
import {
    InitTag, HasContexts, HasMeta, HasInit,
    TaggedToken, TokenTag,
    ContextKey, ContextToken, ContextMeta,
    ParserResult
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

export const dropToken: any[] = [];

export interface ProcFunc<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta> {
    <MetaType extends Meta>($: ParserHandle<CtxMap, Ctx, MetaType>, token: ContextToken<CtxMap, Ctx>): ContextToken<CtxMap, Ctx>[] | void;
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
            number, // weight (order)
            string, // regexp to match
            ParseFunc<CtxMap, ContextKey<CtxMap>, ContextMeta<CtxMap>> // parser function
        ];
        const paths = [] as MatchPathWithWeight[];
        for (const [contexts, ...path] of rules) {
            if (contexts.indexOf(context as ContextKey<CtxMap>) > -1) {
                paths.push(path as MatchPathWithWeight);
            }
        }
        // sorting rules by weight
        paths.sort(([weight_a,], [weight_b,]) =>
            weight_a < weight_b ? -1 :
                weight_b < weight_a ? 1 : 0);
        // overriding duplicated rules (with same weight)
        for (let i = 1; i < paths.length;) {
            if (paths[i][0] == paths[i - 1][0]) {
                paths.splice(i - 1, 1);
            } else {
                i++;
            }
        }
        // set matcher paths
        matchers[context] = matchAny(
            paths.map(([, ...path]) =>
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

    const tokens = parseNest(
        $,
        source
            .replace(/\r\n|\r/g, '\n') // unify line feeds
            .replace(/\t/g, '    ') // replace tabs by four spaces
            .replace(/\u00a0/g, ' ') // replace non-break space by space
            .replace(/\u2424/g, '\n') // replace unicode NL by newline
    );
    procNest($, tokens);

    return [$.m, tokens];
}

export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string, ctx: NestedCtx): ContextToken<CtxMap, NestedCtx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string): ContextToken<CtxMap, Ctx>[];
export function parseNest<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>, NestedCtx extends ContextKey<CtxMap>>($: ParserHandle<CtxMap, Ctx, ContextMeta<CtxMap>>, src: string, ctx: Ctx | NestedCtx = $.c): ContextToken<CtxMap, Ctx | NestedCtx>[] {
    const $$: ParserHandle<CtxMap, NestedCtx, CtxMap["_"]> = {
        ...$,
        t: [],
        c: ctx as NestedCtx,
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
    const procs = $.a[$.c];
    if (procs) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const proc = (procs as any)[(token as any as TaggedToken<keyof any>).$];
            if (proc) {
                const tokens_ = proc($, token);
                if (tokens_) tokens.splice(i--, 1, ...tokens_);
            }
        }
    }
}

export function lastToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>): ContextToken<CtxMap, Ctx> | void {
    if (tokens.length) {
        return tokens[tokens.length - 1];
    }
}

export function pushToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta>({ t: tokens }: ParserHandle<CtxMap, Ctx, Meta>, token: ContextToken<CtxMap, Ctx>) {
    tokens.push(token);
}

export interface TextToken {
    $: keyof any;
    _: string;
}

export function pushText<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>, Meta, Token extends TextToken & ContextToken<CtxMap, Ctx>>($: ParserHandle<CtxMap, Ctx, Meta>, tag: TokenTag<Token>, chunk: string) {
    if (chunk.length) {
        const token = lastToken($) as TextToken | void;
        if (token && token.$ == tag) {
            token._ += chunk;
        } else {
            $.t.push({ $: tag, _: chunk } as any as Token);
        }
    }
}
