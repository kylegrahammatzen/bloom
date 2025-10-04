// Source code copied & modified from node internals: https://github.com/nodejs/node/blob/5b32bb1573dace2dd058c05ac4fab1e4e446c775/lib/internal/tty.js#L123

import { env, getEnvVar } from "./env";

const COLORS_2 = 1;
const COLORS_16 = 4;
const COLORS_256 = 8;
const COLORS_16m = 24;

const TERM_ENVS: Record<string, number> = {
	eterm: COLORS_16,
	cons25: COLORS_16,
	console: COLORS_16,
	cygwin: COLORS_16,
	dtterm: COLORS_16,
	gnome: COLORS_16,
	hurd: COLORS_16,
	jfbterm: COLORS_16,
	konsole: COLORS_16,
	kterm: COLORS_16,
	mlterm: COLORS_16,
	mosh: COLORS_16m,
	putty: COLORS_16,
	st: COLORS_16,
	// http://lists.schmorp.de/pipermail/rxvt-unicode/2016q2/002261.html
	"rxvt-unicode-24bit": COLORS_16m,
	// https://bugs.launchpad.net/terminator/+bug/1030562
	terminator: COLORS_16m,
	"xterm-kitty": COLORS_16m,
};

const CI_ENVS_MAP = new Map(
	Object.entries({
		APPVEYOR: COLORS_256,
		BUILDKITE: COLORS_256,
		CIRCLECI: COLORS_16m,
		DRONE: COLORS_256,
		GITEA_ACTIONS: COLORS_16m,
		GITHUB_ACTIONS: COLORS_16m,
		GITLAB_CI: COLORS_256,
		TRAVIS: COLORS_256,
	}),
);

const TERM_ENVS_REG_EXP = [
	/ansi/,
	/color/,
	/linux/,
	/direct/,
	/^con[0-9]*x[0-9]/,
	/^rxvt/,
	/^screen/,
	/^xterm/,
	/^vt100/,
	/^vt220/,
];

// The `getColorDepth` API got inspired by multiple sources such as
// https://github.com/chalk/supports-color,
// https://github.com/isaacs/color-support.
export function getColorDepth() {
	// Use level 0-3 to support the same levels as `chalk` does. This is done for
	// consistency throughout the ecosystem.
	if (getEnvVar("FORCE_COLOR") !== undefined) {
		switch (getEnvVar("FORCE_COLOR")) {
			case "":
			case "1":
			case "true":
				return COLORS_16;
			case "2":
				return COLORS_256;
			case "3":
				return COLORS_16m;
			default:
				return COLORS_2;
		}
	}

	if (
		(getEnvVar("NODE_DISABLE_COLORS") !== undefined &&
			getEnvVar("NODE_DISABLE_COLORS") !== "") ||
		// See https://no-color.org/
		(getEnvVar("NO_COLOR") !== undefined && getEnvVar("NO_COLOR") !== "") ||
		// The "dumb" special terminal, as defined by terminfo, doesn't support
		// ANSI color control codes.
		// See https://invisible-island.net/ncurses/terminfo.ti.html#toc-_Specials
		getEnvVar("TERM") === "dumb"
	) {
		return COLORS_2;
	}

	if (typeof process !== "undefined" && process.platform === "win32") {
		// Windows 10 build 14931 (from 2016) has true color support
		return COLORS_16m;
	}

	if (getEnvVar("TMUX")) {
		return COLORS_16m;
	}

	// Azure DevOps
	if ("TF_BUILD" in env && "AGENT_NAME" in env) {
		return COLORS_16;
	}

	if ("CI" in env) {
		for (const { 0: envName, 1: colors } of CI_ENVS_MAP) {
			if (envName in env) {
				return colors;
			}
		}
		if (getEnvVar("CI_NAME") === "codeship") {
			return COLORS_256;
		}
		return COLORS_2;
	}

	if ("TEAMCITY_VERSION" in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.exec(
			getEnvVar("TEAMCITY_VERSION"),
		) !== null
			? COLORS_16
			: COLORS_2;
	}

	switch (getEnvVar("TERM_PROGRAM")) {
		case "iTerm.app":
			if (
				!getEnvVar("TERM_PROGRAM_VERSION") ||
				/^[0-2]\./.exec(getEnvVar("TERM_PROGRAM_VERSION")) !== null
			) {
				return COLORS_256;
			}
			return COLORS_16m;
		case "HyperTerm":
		case "MacTerm":
			return COLORS_16m;
		case "Apple_Terminal":
			return COLORS_256;
	}

	if (
		getEnvVar("COLORTERM") === "truecolor" ||
		getEnvVar("COLORTERM") === "24bit"
	) {
		return COLORS_16m;
	}

	if (getEnvVar("TERM")) {
		if (/truecolor/.exec(getEnvVar("TERM")) !== null) {
			return COLORS_16m;
		}

		if (/^xterm-256/.exec(getEnvVar("TERM")) !== null) {
			return COLORS_256;
		}

		const termEnv = getEnvVar("TERM").toLowerCase();

		if (TERM_ENVS[termEnv]) {
			return TERM_ENVS[termEnv];
		}
		if (TERM_ENVS_REG_EXP.some((term) => term.exec(termEnv) !== null)) {
			return COLORS_16;
		}
	}
	// Move 16 color COLORTERM below 16m and 256
	if (getEnvVar("COLORTERM")) {
		return COLORS_16;
	}
	return COLORS_2;
}

export const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	dim: "\x1b[2m",
	undim: "\x1b[22m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",
	fg: {
		black: "\x1b[30m",
		red: "\x1b[31m",
		green: "\x1b[32m",
		yellow: "\x1b[33m",
		blue: "\x1b[34m",
		magenta: "\x1b[35m",
		cyan: "\x1b[36m",
		white: "\x1b[37m",
	},
	bg: {
		black: "\x1b[40m",
		red: "\x1b[41m",
		green: "\x1b[42m",
		yellow: "\x1b[43m",
		blue: "\x1b[44m",
		magenta: "\x1b[45m",
		cyan: "\x1b[46m",
		white: "\x1b[47m",
	},
};


import { getColorDepth } from "./color-depth";
import { colors } from "./colors";

export type LogLevel = "info" | "success" | "warn" | "error" | "debug";

export const levels = ["info", "success", "warn", "error", "debug"] as const;

export function shouldPublishLog(
	currentLogLevel: LogLevel,
	logLevel: LogLevel,
): boolean {
	return levels.indexOf(logLevel) <= levels.indexOf(currentLogLevel);
}

export interface Logger {
	disabled?: boolean;
	disableColors?: boolean;
	level?: Exclude<LogLevel, "success">;
	log?: (
		level: Exclude<LogLevel, "success">,
		message: string,
		...args: any[]
	) => void;
}

export type LogHandlerParams = Parameters<NonNullable<Logger["log"]>> extends [
	LogLevel,
	...infer Rest,
]
	? Rest
	: never;

const levelColors: Record<LogLevel, string> = {
	info: colors.fg.blue,
	success: colors.fg.green,
	warn: colors.fg.yellow,
	error: colors.fg.red,
	debug: colors.fg.magenta,
};

const formatMessage = (
	level: LogLevel,
	message: string,
	colorsEnabled: boolean,
): string => {
	const timestamp = new Date().toISOString();

	if (colorsEnabled) {
		return `${colors.dim}${timestamp}${colors.reset} ${
			levelColors[level]
		}${level.toUpperCase()}${colors.reset} ${colors.bright}[Better Auth]:${
			colors.reset
		} ${message}`;
	}

	return `${timestamp} ${level.toUpperCase()} [Better Auth]: ${message}`;
};

export type InternalLogger = {
	[K in LogLevel]: (...params: LogHandlerParams) => void;
} & {
	get level(): LogLevel;
};

export const createLogger = (options?: Logger): InternalLogger => {
	const enabled = options?.disabled !== true;
	const logLevel = options?.level ?? "error";

	const isDisableColorsSpecified = options?.disableColors !== undefined;
	const colorsEnabled = isDisableColorsSpecified
		? !options.disableColors
		: getColorDepth() !== 1;

	const LogFunc = (
		level: LogLevel,
		message: string,
		args: any[] = [],
	): void => {
		if (!enabled || !shouldPublishLog(logLevel, level)) {
			return;
		}

		const formattedMessage = formatMessage(level, message, colorsEnabled);

		if (!options || typeof options.log !== "function") {
			if (level === "error") {
				console.error(formattedMessage, ...args);
			} else if (level === "warn") {
				console.warn(formattedMessage, ...args);
			} else {
				console.log(formattedMessage, ...args);
			}
			return;
		}

		options.log(level === "success" ? "info" : level, message, ...args);
	};

	const logger = Object.fromEntries(
		levels.map((level) => [
			level,
			(...[message, ...args]: LogHandlerParams) =>
				LogFunc(level, message, args),
		]),
	) as Record<LogLevel, (...params: LogHandlerParams) => void>;

	return {
		...logger,
		get level() {
			return logLevel;
		},
	};
};

export const logger = createLogger();