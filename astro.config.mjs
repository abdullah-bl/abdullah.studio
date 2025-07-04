import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
        // Reference the separate Vite config for build optimizations
        configFile: './vite.config.js',
    },

    integrations: [react(), mdx(), partytown()],
});