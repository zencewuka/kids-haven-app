// Run after `vite build`: lists every built file in dist/sw.js so the whole app works offline.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { createHash } from "node:crypto"

const dist = "dist"
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else files.push(relative(dist, full).split("\\").join("/"))
  }
}
walk(dist)
const list = files.filter((f) => f !== "sw.js" && !f.endsWith(".map")).sort()
const hash = createHash("sha1")
for (const f of list) hash.update(f).update(readFileSync(join(dist, f)))
const sw = readFileSync(join(dist, "sw.js"), "utf8")
  .replace("__VERSION__", hash.digest("hex").slice(0, 10))
  .replace("/*__PRECACHE__*/ []", JSON.stringify(["./", ...list]))
writeFileSync(join(dist, "sw.js"), sw)
console.log(`Offline cache list: ${list.length} files`)
