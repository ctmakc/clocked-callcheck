// Copies public/ to dist/ for deployment, leaving out local-only dev fixtures,
// and publishes the demo video at /demo.mp4 when it exists.
import { cpSync, rmSync, existsSync } from "node:fs";
rmSync("dist", { recursive: true, force: true });
cpSync("public", "dist", { recursive: true, filter: (src) => !src.includes("dev-fixtures") });
if (existsSync("video/callcheck-demo.mp4")) cpSync("video/callcheck-demo.mp4", "dist/demo.mp4");
console.log("built dist/");
