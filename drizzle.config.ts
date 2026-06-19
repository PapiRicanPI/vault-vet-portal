import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema-pg.ts",
  out: "./drizzle/migrations-pg",
  dbCredentials: {
    url: "postgresql://postgres:iXXuEDeUecVFXMNhcLkiCGoFqVvDNsCD@thomas.proxy.rlwy.net:33442/railway",
  },
});
