type LogArgs = readonly unknown[];

function shouldLog() {
 return process.env.NODE_ENV !== "production";
}

export const logger = {
 error: (...args: LogArgs) => {
 if (shouldLog()) {
 console.error(...args);
 }
 },
 warn: (...args: LogArgs) => {
 if (shouldLog()) {
 console.warn(...args);
 }
 },
 log: (...args: LogArgs) => {
 if (shouldLog()) {
 console.log(...args);
 }
 },
};
