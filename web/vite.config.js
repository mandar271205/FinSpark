import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api/nvidia": {
          target: "https://integrate.api.nvidia.com",
          changeOrigin: true,
          rewrite: () => "/v1/chat/completions",
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              const apiKey = env.NVIDIA_API_KEY || env.VITE_NVIDIA_API_KEY
              if (apiKey) proxyReq.setHeader("Authorization", `Bearer ${apiKey}`)
            })
          },
        },
      },
    },
  }
})
