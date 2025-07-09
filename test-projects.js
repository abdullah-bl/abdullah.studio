const fs = require('fs');
const path = require('path');

// Test the parsing logic
function testProjectParsing() {
    const projectsDir = path.join(process.cwd(), 'app', '(projects)');
    const projectFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => name !== '(projects)');

    console.log('Found project folders:', projectFolders);

    for (const folder of projectFolders) {
        const pagePath = path.join(projectsDir, folder, 'page.tsx');

        if (fs.existsSync(pagePath)) {
            console.log(`\n--- Processing ${folder} ---`);

            try {
                const fileContent = fs.readFileSync(pagePath, 'utf-8');
                console.log('File content length:', fileContent.length);
                console.log('Last 200 characters:', fileContent.slice(-200));

                const detailsMatch = fileContent.match(/export const details = ({[\s\S]*?})\s*;?/s);

                if (detailsMatch) {
                    console.log('Found details export!');
                    const detailsString = detailsMatch[1];
                    console.log('Details string:', detailsString);

                    // Extract individual properties
                    const titleMatch = detailsString.match(/title:\s*['"`]([^'"`]+)['"`]/);
                    const title = titleMatch ? titleMatch[1] : folder.charAt(0).toUpperCase() + folder.slice(1);

                    const descMatch = detailsString.match(/description:\s*`([\s\S]*?)`/);
                    const description = descMatch ? descMatch[1].trim() : `Project: ${folder}`;

                    console.log('Extracted title:', title);
                    console.log('Extracted description:', description);
                } else {
                    console.log('No details export found');
                    // Try a simpler regex
                    const simpleMatch = fileContent.match(/export const details/);
                    if (simpleMatch) {
                        console.log('Found "export const details" but regex failed');
                    }
                }
            } catch (error) {
                console.error(`Error processing ${folder}:`, error);
            }
        }
    }
}

testProjectParsing(); 