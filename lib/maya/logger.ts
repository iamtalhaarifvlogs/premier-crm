export function log(event: string, data?: any) {
  console.log(`[MAYA LOG] ${event}`, data || {})
}