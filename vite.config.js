import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' lets the build work under GitLab Pages sub-paths (user.gitlab.io/repo/)
export default defineConfig({ base: './', plugins: [react()] });
