export type UnknownToken = any;

export type TokenTypeByTag<Map, Tag extends keyof Map> = Map[Tag] extends object ? { $: Tag; } & Map[Tag] : Map[Tag];
export type TokenType<Map> = Map extends object ? { [Tag in keyof Map]: TokenTypeByTag<Map, Tag>; }[keyof Map] : Map extends string ? Map : any;
export type TokensType<Map> = TokenType<Map>[];

export interface TaggedToken<Tag extends keyof any> { $: Tag; }
export type TokenTag<Token> = Token extends TaggedToken<infer Tag> ? Tag : never;
export type TokenByTag<Token, Tag extends keyof any> = Token extends TaggedToken<Tag> ? Token : never;

export interface HasMeta { _: object; }
export interface HasContexts { $: object; }

export type InitTag = 0;
export interface HasInit { $: { [0]: any; }; }

export type ContextKey<CtxMap extends HasContexts> = keyof CtxMap['$'];
export type ContextToken<CtxMap extends HasContexts, Ctx extends ContextKey<CtxMap>> = CtxMap['$'][Ctx];
export type ContextMeta<CtxMap extends HasMeta> = CtxMap['_'];

export type ParserResult<CtxMap extends HasContexts & HasMeta, Ctx extends ContextKey<CtxMap>> = [ContextMeta<CtxMap>, ContextToken<CtxMap, Ctx>[]];

export const enum ContextTag {
    Block,
    BlockNest,
    Inline,
    InlineLink,
}

export interface ContextMap<BlockTokenMap, InlineTokenMap, Meta> {
    _: Meta;
    $: {
        [ContextTag.Block]: TokenType<BlockTokenMap>;
        [ContextTag.BlockNest]: TokenType<BlockTokenMap>;
        [ContextTag.Inline]: TokenType<InlineTokenMap>;
        [ContextTag.InlineLink]: TokenType<InlineTokenMap>;
    };
}

export interface MetaLink {
    l: string; // href
    t?: string; // title
}

export interface MetaLinks {
    links: Record<string, MetaLink>;
}

export interface MetaAbbrevs {
    abbrevs: Record<string, string>;
}

export interface MetaFootnotes<BlockTokenMap> {
    footnotes: Record<string, TokensType<BlockTokenMap>>;
}

export interface MetaHeading<InlineTokenMap> {
    t: string; // text
    n: number; // level
    _: TokensType<InlineTokenMap>;
}

export interface MetaHeadings<InlineTokenMap> {
    headings: MetaHeading<InlineTokenMap>[];
}

export interface MetaData<BlockTokenMap, InlineTokenMap> extends
    MetaLinks,
    MetaAbbrevs,
    MetaFootnotes<BlockTokenMap>,
    MetaHeadings<InlineTokenMap> { }

export interface NoMeta { }
