export type NotificationPayload = {
  title: string
  message: string
  type?: "info" | "success" | "warning"
}

export async function createNotification(
  payload: NotificationPayload
) {
  console.log("MAYA NOTIFICATION", payload)

  return {
    success: true,
  }
}
