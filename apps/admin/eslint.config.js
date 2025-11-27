import { nextJsConfig } from "@workspace/eslint-config/next-js";

const baseConfig = Array.isArray(nextJsConfig) ? nextJsConfig : [nextJsConfig];

/** @type {import("eslint").Linter.Config[]} */
export default [
	...baseConfig,
	{
		rules: {
			"turbo/no-undeclared-env-vars": [
				"error",
				{ allowList: ["NODE_ENV", "ADMIN_SESSION_SECRET"] },
			],
		},
	},
];
