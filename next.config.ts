import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Permite abrir o servidor de desenvolvimento pelo celular na rede local
  // (ex.: https://192.168.0.10:3000), necessário para testar os sensores de passos.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
