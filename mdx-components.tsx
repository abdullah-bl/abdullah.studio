import type { MDXComponents } from 'mdx/types'
import Image, { ImageProps } from 'next/image'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Allows customizing built-in components, e.g. to add styling.
        h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-4">{children}</h1>
        ),
        img: (props: ImageProps) => (
            <Image
                sizes="100vw"
                className="w-full h-auto"
                {...(props as ImageProps)}
            />
        ),
        ...components,
    }
}