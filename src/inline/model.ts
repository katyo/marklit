import { TokenType, TokensType } from '../model';

export const enum InlineTag {
    Text,
    Link,
    Image,
    Strong,
    Em,
    Code,
    Math,
    Del,
    Br,
    Abbrev,
}

export const enum InlineOrder {
    Escape,
    AutoLink,
    Url,
    Link,
    RefLink,
    NoLink,
    Abbrev,
    Strong,
    Em,
    Code,
    Math,
    Del,
    Br,
    Text,
}

export interface InlineLink<InlineTokenMap> {
    [InlineTag.Link]: {
        l: string;
        t?: string;
    } & InlinePhrase<InlineTokenMap>;
}

export interface InlineImage {
    [InlineTag.Image]: {
        l: string;
        t?: string;
        _: string;
    };
}

export interface InlineStrong<InlineTokenMap> {
    [InlineTag.Strong]: InlinePhrase<InlineTokenMap>;
}

export interface InlineEm<InlineTokenMap> {
    [InlineTag.Em]: InlinePhrase<InlineTokenMap>;
}

export interface InlineDel<InlineTokenMap> {
    [InlineTag.Del]: InlinePhrase<InlineTokenMap>;
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

export interface InlineAbbrev {
    [InlineTag.Abbrev]: {
        t?: string;
        _: string;
    };
}

export interface InlinePhrase<InlineTokenMap> {
    _: TokensType<InlineTokenMap>;
}

export interface InlineText {
    [InlineTag.Text]: {
        _: string;
    };
}

export interface InlineTokenMap<InlineTokenMap> extends
    InlineLink<InlineTokenMap>,
    InlineImage,
    InlineStrong<InlineTokenMap>,
    InlineEm<InlineTokenMap>,
    InlineDel<InlineTokenMap>,
    InlineCode,
    //InlineMath,
    InlineAbbrev,
    InlineBr,
    InlineText { }

// Basics

export interface BasicInlineTokenMap extends InlineTokenMap<BasicInlineTokenMap> { }

export type BasicInlineToken = TokenType<BasicInlineTokenMap>;
