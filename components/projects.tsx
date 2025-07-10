import Link from 'next/link'


const projects = [
    {
        title: 'AI Chat',
        description: 'A web app that allows you to chat with AI. Focused on privacy and performance.',
        image: '/images/chat.png',
        link: 'https://abdullah-bl.github.io/chat/',
        year: 2025,
        month: 7,
        day: 10,
        tags: ['AI', 'Chat', 'Web API'],
        slug: 'chat',
    },
]


export async function Projects() {
    return (
        <div>
            {projects.map((project) => (
                <Link
                    key={project.slug}
                    className="flex flex-col space-y-1 mb-4 group"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
                        <p className="text-neutral-600 dark:text-neutral-400 w-[100px] tabular-nums">
                            {project.year && `${project.year}`}
                        </p>
                        <div className="flex-1">
                            <p className="text-neutral-900 dark:text-neutral-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {project.title}
                            </p>
                            {project.description && (
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-1">
                                    {project.description.trim()}
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}   