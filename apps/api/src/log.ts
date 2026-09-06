type LogFields = Record<string, string | number | boolean | null | undefined>;

export function log(
  level: "info" | "warn" | "error",
  message: string,
  fields: LogFields = {},
) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...fields,
    }),
  );
}
