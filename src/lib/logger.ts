type LogArgs = readonly unknown[];

export const logger = {
 error: (...args: LogArgs) => {
  void args;
 },
 warn: (...args: LogArgs) => {
  void args;
 },
 log: (...args: LogArgs) => {
  void args;
 },
};
