import { nextJsConfig } from "@workspace/eslint-config/next-js";

const baseConfig = Array.isArray(nextJsConfig) ? nextJsConfig : [nextJsConfig];

/** @type {import("eslint").Linter.Config[]} */
export default [...baseConfig];
