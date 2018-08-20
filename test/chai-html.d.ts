/// <reference types="chai" />

declare namespace ChaiHtml {
    interface HtmlAssertion extends Chai.Assertion {
        valid(): HtmlAssertion;

        not: HtmlAssertion;
        to: HtmlAssertion;
        be: HtmlAssertion;
        been: HtmlAssertion;
        is: HtmlAssertion;
        that: HtmlAssertion;
        which: HtmlAssertion;
        and: HtmlAssertion;
        has: HtmlAssertion;
        have: HtmlAssertion;
        with: HtmlAssertion;
        at: HtmlAssertion;
        of: HtmlAssertion;
        same: HtmlAssertion;
    }
}

declare module "chai-html" {
    function chaiHtml(chai: any, utils: any): void;
    export default chaiHtml;
}
