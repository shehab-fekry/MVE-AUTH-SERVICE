if (!process.versions?.bun) {
  console.error(`
❌ This project must be installed using Bun.

Detected another package manager (npm/yarn/pnpm).  

Run:
  bun install
`);
  process.exit(1);
}
