// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // The real address, used for canonical links. Change it if the domain changes.
  site: 'https://www.timeforwedding.com',
  // Keep the old addresses exactly as they were (no slash at the end),
  // so links from Google and other sites keep working: /en/wedding/destinations
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Folder for CSS and scripts in the finished site (default is "_astro").
    assets: 'assets',
  },
});
