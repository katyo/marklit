declare module "html-differ" {
    class HtmlDiffer {
        constructor(options?: Partial<HtmlDifferOptions> | HtmlDifferPreset | { preset: HtmlDifferPreset } & Partial<HtmlDifferOptions>);
        diffHtml(a: string, b: string): HtmlDifferDifference[];
        isEqual(a: string, b: string): boolean;
    }

    interface HtmlDifferOptions {
        ignoreAttributes: string[];
        compareAttributesAsJSON: (string | { name: string, isFunction: boolean })[];
        ignoreWhitespaces: boolean;
        ignoreComments: boolean;
        ignoreEndTags: boolean;
        ignoreDuplicateAttributes: boolean;
    }

    type HtmlDifferPreset = 'bem';

    interface HtmlDifferDifference {
        value: string;
        added: boolean;
        removed: boolean;
    }
}
