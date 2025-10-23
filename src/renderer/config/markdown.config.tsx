/**
 * Markdown Rendering Configuration
 * Centralized configuration for ReactMarkdown and syntax highlighting
 */

import type { Components } from 'react-markdown'
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/light'
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'

// Import specific languages we want to support
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml'
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust'
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go'

// Register languages
SyntaxHighlighter.registerLanguage('javascript', javascript)
SyntaxHighlighter.registerLanguage('js', javascript)
SyntaxHighlighter.registerLanguage('jsx', javascript)
SyntaxHighlighter.registerLanguage('typescript', typescript)
SyntaxHighlighter.registerLanguage('ts', typescript)
SyntaxHighlighter.registerLanguage('tsx', typescript)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('py', python)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('shell', bash)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('html', html)
SyntaxHighlighter.registerLanguage('xml', html)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)
SyntaxHighlighter.registerLanguage('markdown', markdown)
SyntaxHighlighter.registerLanguage('md', markdown)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('c++', cpp)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('rs', rust)
SyntaxHighlighter.registerLanguage('go', go)
SyntaxHighlighter.registerLanguage('golang', go)

/**
 * Get syntax highlighter theme based on system preference
 */
export function getSyntaxTheme() {
  // Check if user prefers dark mode
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  return isDark ? atomOneDark : atomOneLight
}

/**
 * Code block component with syntax highlighting and copy button
 */
export function CodeBlock({ node, inline, className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '')
  const codeString = String(children).replace(/\n$/, '')

  if (!inline && match) {
    return (
      <div className="relative group my-4">
        <SyntaxHighlighter
          style={getSyntaxTheme()}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    )
  }

  // Inline code
  return (
    <code
      className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  )
}

/**
 * Pre block wrapper (for code blocks)
 */
export function Pre({ children }: any) {
  return <>{children}</>
}

/**
 * Default markdown component overrides
 * Provides consistent styling for all markdown elements
 */
export const markdownComponents: Components = {
  // Code blocks
  code: CodeBlock,
  pre: Pre,

  // Headings with consistent styling
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-bold mt-5 mb-3 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="text-base font-semibold mt-3 mb-2 first:mt-0" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="my-3 leading-relaxed first:mt-0 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Lists
  ul: ({ children, ...props }) => (
    <ul className="my-3 ml-6 list-disc space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-3 ml-6 list-decimal space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 pl-4 border-l-4 border-muted-foreground/30 italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody {...props}>{children}</tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2" {...props}>
      {children}
    </td>
  ),

  // Horizontal rule
  hr: (props) => (
    <hr className="my-6 border-border" {...props} />
  ),

  // Strong/Bold
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),

  // Emphasis/Italic
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Delete/Strikethrough (requires remark-gfm)
  del: ({ children, ...props }) => (
    <del className="line-through opacity-70" {...props}>
      {children}
    </del>
  ),
}

/**
 * Remark plugins to enable
 */
export { default as remarkGfm } from 'remark-gfm'
export { default as remarkMath } from 'remark-math'

/**
 * Rehype plugins to enable
 */
export { default as rehypeRaw } from 'rehype-raw'
export { default as rehypeSanitize } from 'rehype-sanitize'
export { default as rehypeKatex } from 'rehype-katex'

/**
 * Default remark plugins array
 */
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
export const defaultRemarkPlugins = [remarkGfm, remarkMath]

/**
 * Default rehype plugins array
 */
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'
export const defaultRehypePlugins = [rehypeRaw, rehypeSanitize, rehypeKatex]
