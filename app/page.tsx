import Link from 'next/link'

import { BlogPosts } from '@/components/posts'
import Footer from '@/components/footer'
import { Navbar } from '@/components/nav'
import { Projects } from '@/components/projects'

export default function HomePage() {
    return (
        <main className="">
            <div className="max-w-2xl mx-auto py-16 flex flex-col gap-10">
                {/* Header */}
                <h1 className="text-4xl font-bold mb-4">My Portfolio</h1>
                <div className="flex flex-col gap-2 bg-background/50 backdrop-blur-sm rounded-lg p-4">

                    <p className="text-lg text-zinc-900 dark:text-zinc-200">
                        💁🏻‍♂️ Abdullah Bl,
                    </p>
                    <p className="text-lg text-zinc-900 dark:text-zinc-200">
                        🚀 Passionate about building scalable web apps.
                    </p>
                    <p className="text-lg text-zinc-900 dark:text-zinc-200">
                        🧠 Exploring LLMs, models, and developer tools using Python, Transformers, and custom fine-tuning.
                    </p>
                </div>

                {/* Blog List */}
                <div className="my-8">
                    <h2 className="text-2xl font-bold mb-4">Blog</h2>
                    <BlogPosts />
                </div>

                {/* Projects */}
                <h2 className="text-2xl font-bold">Projects</h2>
                <div className="flex flex-col gap-2 mb-12">
                    <Projects />
                </div>
            </div>
        </main>
    )
} 