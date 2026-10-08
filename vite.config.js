// Vite config: serves api/*.js as dev endpoints (same handlers Vercel runs in production).
import { defineConfig, loadEnv } from 'vite'

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
        let mod
        try {
          mod = await server.ssrLoadModule(`/api/${name}.js`)
        } catch {
          return next()
        }
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
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
})
