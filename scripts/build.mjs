// Copies public/ to dist/ for deployment, leaving out local-only dev fixtures.
import { cpSync, rmSync } from "node:fs";
rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true, filter: (src) => !src.includes("dev-fixtures") });
console.log("built dist/");
