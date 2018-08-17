import { InitTag, HasMeta, HasInit, ContextToken, ContextResult, ContextMeta } from './model';

export interface RenderFunc<Type, CtxMap, Ctx extends keyof CtxMap, Token extends CtxMap[Ctx], Meta> {
    <MetaType extends Meta>(handle: RenderHandle<Type, CtxMap, Ctx, MetaType>, token: Exclude<Token, string>): Type;
}

export interface JoinFunc<Type> {
    (elms: Type[]): Type;
}

export interface WrapFunc<Type> {
    (str: string): Type;
}

export interface RenderHandle<Type, CtxMap, Ctx extends keyof CtxMap, Meta> {
    r: RenderMethods<Type, CtxMap, Meta>; // render methods
    w: WrapFunc<Type>; // wrap method
    j: JoinFunc<Type>; // join method
    c: Ctx; // current context
    m: Meta; // render meta
}

export interface TaggedToken<Tag extends keyof any> {
    $: Tag;
}

export type TokenTag<Token> = Token extends TaggedToken<infer Tag> ? Tag : never;

export type TokenByTag<Token, Tag extends keyof any> = Token extends TaggedToken<Tag> ? Token : never;

export type ContextRenderMethods<Type, CtxMap, Ctx extends keyof CtxMap, Meta> = {
    [Tag in TokenTag<ContextToken<CtxMap, Ctx>>]: RenderFunc<Type, CtxMap, Ctx, TokenByTag<ContextToken<CtxMap, Ctx>, Tag>, Meta>;
};

export type RenderMethods<Type, CtxMap, Meta> = {
    [Ctx in keyof CtxMap]: ContextRenderMethods<Type, CtxMap, Ctx, Meta>;
};

export type TaggedRenderRule<Type, CtxMap, Ctx extends keyof CtxMap, Tag extends TokenTag<ContextToken<CtxMap, Ctx>>, Meta> = [
    Ctx,
    Tag,
    RenderFunc<Type, CtxMap, Ctx, TokenByTag<ContextToken<CtxMap, Ctx>, Tag>, Meta>
];

export type RenderRule<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap, Meta>
    = TaggedRenderRule<Type, CtxMap, Ctx, TokenTag<ContextToken<CtxMap, Ctx>>, Meta>;

export type RenderRules<Type, CtxMap extends HasMeta<any>> = RenderRule<Type, CtxMap, keyof CtxMap, ContextMeta<CtxMap>>[];

export interface Renderer<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap> {
    r: RenderMethods<Type, CtxMap, ContextMeta<CtxMap>>;
    w: WrapFunc<Type>;
    j: JoinFunc<Type>;
    s: Ctx;
}

export interface InitRender<Type> {
    <CtxMap extends HasMeta<any> & HasInit<any>>(...rules: RenderRules<Type, CtxMap>): Renderer<Type, CtxMap, 0>;
    <CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap>(start: Ctx, ...rules: RenderRules<Type, CtxMap>): Renderer<Type, CtxMap, Ctx>;
}

export function makeRender<Type>(wrap: WrapFunc<Type>, join: JoinFunc<Type>): InitRender<Type> {
    return (...rules: any[]) => initRender(wrap, join, ...rules);
}

function initRender<Type, CtxMap extends HasMeta<any> & HasInit<any>>(wrap: WrapFunc<Type>, join: JoinFunc<Type>, ...rules: RenderRules<Type, CtxMap>): Renderer<Type, CtxMap, InitTag>;
function initRender<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap>(wrap: WrapFunc<Type>, join: JoinFunc<Type>, start: Ctx, ...rules: RenderRules<Type, CtxMap>): Renderer<Type, CtxMap, Ctx>;
function initRender<Type, CtxMap extends HasMeta<any>>(wrap: WrapFunc<Type>, join: JoinFunc<Type>, ...rules: RenderRules<Type, CtxMap>): Renderer<Type, CtxMap, any> {
    let start = typeof rules[0] == 'number' ? rules.shift() : 0;

    const ctxs: (keyof CtxMap)[] = [];
    for (const [ctx] of rules) {
        if (ctxs.indexOf(ctx) < 0) {
            ctxs.push(ctx);
        }
    }

    const renderers = {} as RenderMethods<Type, CtxMap, ContextMeta<CtxMap>>;
    for (const context of ctxs) {
        const funcs = {} as ContextRenderMethods<Type, CtxMap, typeof context, ContextMeta<CtxMap>>;

        for (const [ctx, tag, func] of rules) {
            if (ctx == context) {
                funcs[tag] = func;
            }
        }

        renderers[context] = funcs;
    }

    return { r: renderers, w: wrap, j: join, s: start };
}

export function render<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap>({ r, w, j, s }: Renderer<Type, CtxMap, Ctx>, [meta, tokens]: ContextResult<CtxMap, Ctx>): Type {
    const $: RenderHandle<Type, CtxMap, Ctx, ContextMeta<CtxMap>> = {
        r, w, j, m: meta, c: s
    };
    return renderNest($, tokens);
}

export function renderNest<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: RenderHandle<Type, CtxMap, Ctx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, NestedCtx>[], ctx: NestedCtx): Type;
export function renderNest<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap>($: RenderHandle<Type, CtxMap, Ctx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, Ctx>[]): Type;
export function renderNest<Type, CtxMap extends HasMeta<any>, Ctx extends keyof CtxMap, NestedCtx extends keyof CtxMap>($: RenderHandle<Type, CtxMap, Ctx | NestedCtx, ContextMeta<CtxMap>>, tokens: ContextToken<CtxMap, Ctx | NestedCtx>[], ctx: Ctx | NestedCtx = $.c): Type {
    const $$ = $.c === ctx ? $ : { ...$, c: ctx };
    const elms: Type[] = [];
    for (const token of tokens) {
        elms.push(typeof token == 'string' ?
            $$.w(token) :
            ($$.r[$$.c] as any)[(token as any as TaggedToken<number>).$]($$, token));
    }
    return $$.j(elms);
}