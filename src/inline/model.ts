export const enum InlineTag {
    Link,
    Image,
    Strong,
    Em,
    Code,
    Math,
    Del,
    Br,
}

export const enum InlineOrder {
    Escape,
    AutoLink,
    Url,
    Link,
    RefLink,
    NoLink,
    Strong,
    Em,
    Code,
    Math,
    Del,
    Br,
    Text,
}

export interface InlineLink<InlineToken> {
    [InlineTag.Link]: {
        l: string;
        t?: string;
    } & InlinePhrase<InlineToken>;
}

export interface InlineImage {
    [InlineTag.Image]: {
        l: string;
        t?: string;
        _: string;
    };
}

export interface InlineStrong<InlineToken> {
    [InlineTag.Strong]: InlinePhrase<InlineToken>;
}

export interface InlineEm<InlineToken> {
    [InlineTag.Em]: InlinePhrase<InlineToken>;
}

export interface InlineDel<InlineToken> {
    [InlineTag.Del]: InlinePhrase<InlineToken>;
}

export interface InlineBr {
    [InlineTag.Br]: {};
}

export interface InlineCode {
    [InlineTag.Code]: {
        _: string;
    };
}

export interface InlineMath {
    [InlineTag.Math]: {
        _: string;
    };
}

export interface InlinePhrase<InlineToken> {
    _: InlineTokenType<InlineToken>[];
}

export interface InlineTokenMap<InlineToken> extends
    InlineLink<InlineToken>,
    InlineImage,
    InlineStrong<InlineToken>,
    InlineEm<InlineToken>,
    InlineDel<InlineToken>,
    InlineCode,
    InlineMath,
    InlineBr { }

export interface InlineToken extends InlineTokenMap<InlineToken> { }

import { AsUnion } from '../core';

export type InlineTokenType<InlineTokenMap> = AsUnion<InlineTokenMap> | string;
