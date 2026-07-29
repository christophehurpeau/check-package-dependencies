#!/usr/bin/env node

import { main } from "../dist/cli-node.mjs";

await main(process.argv.slice(2));
