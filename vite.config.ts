import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: 'src/main/index.ts',
        onstart(args) {
          args.startup()
        },
        vite: {
          build: {
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', 'better-sqlite3'],
              plugins: [
                {
                  name: 'copy-sql-files',
                  writeBundle() {
                    // Copy schema.sql to dist/main/database/
                    const srcPath = path.resolve(__dirname, 'src/main/database/schema.sql')
                    const destDir = path.resolve(__dirname, 'dist/main/database')
                    const destPath = path.resolve(destDir, 'schema.sql')

                    // Create directory if it doesn't exist
                    if (!fs.existsSync(destDir)) {
                      fs.mkdirSync(destDir, { recursive: true })
                    }

                    // Copy the file
                    fs.copyFileSync(srcPath, destPath)
                    console.log(`Copied schema.sql to ${destPath}`)
                  }
                }
              ]
            }
          }
        }
      },
      {
        // Preload scripts
        entry: 'src/preload/index.ts',
        onstart(args) {
          args.reload()
        },
        vite: {
          build: {
            outDir: 'dist/preload',
            rollupOptions: {
              external: ['electron'], // Don't bundle electron
              output: {
                format: 'cjs', // Preload must use CommonJS
                entryFileNames: '[name].js'
              }
            }
          }
        }
      }
    ]),
    // renderer() // Temporarily disabled to test if it's interfering
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  build: {
    outDir: 'dist/renderer'
  }
})
