import { MarkdownEntryOrPrimitive, tsMarkdown, getRenderers, getMarkdownString } from "ts-markdown";

export const markdown = (markdown: MarkdownEntryOrPrimitive[]) => {
    return tsMarkdown(markdown, {
        renderers: getRenderers({
            sup: (entry, options) => {
                return `^(${getMarkdownString(entry.sup, options)})`;
            }
        })
    });
};
