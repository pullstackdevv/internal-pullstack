import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

function slugifyHeading(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
}

function CodeBlock({ children }: { children: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className="group relative">
            <pre className="not-prose overflow-x-auto overflow-y-hidden rounded-md border border-border bg-background p-4 font-mono text-sm leading-relaxed text-foreground">
                <code>{children}</code>
            </pre>
            <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-2 max-lg:opacity-100 lg:opacity-0 lg:transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={copy}
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
        </div>
    );
}

export interface Heading {
    depth: number;
    text: string;
    id: string;
}

export function extractHeadings(markdown: string): Heading[] {
    const lines = markdown.split('\n');
    const headings: Heading[] = [];

    for (const line of lines) {
        const match = /^(#{1,3})\s+(.+)$/.exec(line);
        if (match) {
            const text = match[2].trim();
            headings.push({ depth: match[1].length, text, id: slugifyHeading(text) });
        }
    }

    return headings;
}

export function MarkdownContent({ markdown }: { markdown: string }) {
    return (
        <div className="prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 id={slugifyHeading(String(children))}>{children}</h1>,
                    h2: ({ children }) => <h2 id={slugifyHeading(String(children))}>{children}</h2>,
                    h3: ({ children }) => <h3 id={slugifyHeading(String(children))}>{children}</h3>,
                    code({ className, children }) {
                        const isBlock = /language-/.test(className ?? '');
                        const text = String(children).replace(/\n$/, '');

                        if (!isBlock && !text.includes('\n')) {
                            return <code className="rounded border border-border bg-background px-1 py-0.5 font-mono text-sm text-foreground">{text}</code>;
                        }

                        return <CodeBlock>{text}</CodeBlock>;
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
