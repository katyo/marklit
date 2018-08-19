declare module "html-normalizer" {
    export default function Normalizer(): {
        domString(html: string): string
    }
}
