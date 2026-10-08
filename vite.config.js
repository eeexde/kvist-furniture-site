// Vite config: serves api/*.js as dev endpoints (same handlers Vercel runs in production).
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

const page = (file) => fileURLToPath(new URL(file, import.meta.url))

function apiDev() {
  return {
    name: 'kvist-api-dev',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v

      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url || '').split('?')[0].replace(/^\/+/, '')
        if (!/^[a-z0-9-]+$/.test(name)) return next()
        if (!existsSync(path.join(server.config.root, 'api', `${name}.js`))) return next()
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }
        let mod
        try {
          mod = await server.ssrLoadModule(`/api/${name}.js`)
        } catch (err) {
          server.ssrFixStacktrace(err)
          console.error(err)
          return res.status(500).json({ error: 'Server error' })
        }
        try {
          await mod.default(req, res)
        } catch (err) {
          server.ssrFixStacktrace(err)
          console.error(err)
          if (!res.headersSent) res.status(500).json({ error: 'Server error' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [apiDev()],
  build: {
    rollupOptions: {
      input: { main: page('./index.html'), checkout: page('./checkout.html') },
    },
  },
})
