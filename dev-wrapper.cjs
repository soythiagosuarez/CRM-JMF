// Wrapper para preview_start: esta máquina no tiene Node.js instalado a
// nivel de sistema, así que el proceso hijo que arranca Turbopack no
// encuentra "node" en el PATH. Lo agregamos acá antes de delegar a Next.
const path = require("node:path");
const os = require("node:os");
process.env.PATH = `${path.join(os.homedir(), ".local/node/bin")}:${process.env.PATH || ""}`;
process.argv = [process.argv[0], process.argv[1], "dev", "--webpack"];
require("./node_modules/next/dist/bin/next");
