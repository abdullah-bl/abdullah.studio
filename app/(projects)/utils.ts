

import fs from 'fs'
import path from 'path'

// Type definition for project details
export interface ProjectDetails {
    title?: string
    description?: string
    image?: string
    link?: string
    tags?: string[]
    year?: number
    month?: number
    day?: number
    slug: string
}

// Helper function to get all project details
export async function getAllProjectDetails(): Promise<ProjectDetails[]> {
    const projectsDir = path.join(process.cwd(), 'app', '(projects)')
    const projectFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => name !== '(projects)') // Exclude the parent folder itself

    const projects: ProjectDetails[] = []

    for (const folder of projectFolders) {
        const metadataPath = path.join(projectsDir, folder, 'metadata.json')

        if (fs.existsSync(metadataPath)) {
            try {
                // Read the metadata file
                const fileContent = fs.readFileSync(metadataPath, 'utf-8')
                const metadata = JSON.parse(fileContent)

                const details: ProjectDetails = {
                    title: metadata.title || folder.charAt(0).toUpperCase() + folder.slice(1),
                    description: metadata.description || `Project: ${folder}`,
                    image: metadata.image,
                    link: metadata.link,
                    tags: metadata.tags,
                    year: metadata.year,
                    month: metadata.month,
                    day: metadata.day,
                    slug: folder
                }

                projects.push(details)
            } catch (error) {
                console.error(`Error loading project metadata for ${folder}:`, error)
                // Fallback for projects that can't be loaded
                projects.push({
                    title: folder.charAt(0).toUpperCase() + folder.slice(1),
                    description: `Project: ${folder}`,
                    slug: folder
                })
            }
        } else {
            // Fallback for projects with no metadata file
            console.log(`No metadata.json found for ${folder}, using fallback`)
            projects.push({
                title: folder.charAt(0).toUpperCase() + folder.slice(1),
                description: `Project: ${folder}`,
                slug: folder
            })
        }
    }

    // Sort projects by date (newest first) if available, otherwise alphabetically
    return projects.sort((a, b) => {
        if (a.year && b.year) {
            if (a.year !== b.year) return b.year - a.year
            if (a.month && b.month && a.month !== b.month) return b.month - a.month
            if (a.day && b.day && a.day !== b.day) return b.day - a.day
        }
        // Ensure titles exist before comparing
        const titleA = a.title || a.slug || ''
        const titleB = b.title || b.slug || ''
        return titleA.localeCompare(titleB)
    })
}

// Helper function to get a specific project's details
export async function getProjectDetails(slug: string): Promise<ProjectDetails | null> {
    const allProjects = await getAllProjectDetails()
    return allProjects.find(project => project.slug === slug) || null
}





