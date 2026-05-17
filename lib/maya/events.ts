export type MayaEvent =
  | "lead_created"
  | "lead_updated"
  | "lead_deleted"
  | "stage_changed"
  | "price_objection"
  | "deposit_triggered";

export async function emitEvent(
  event: MayaEvent,
  payload: any
) {
  console.log("MAYA EVENT:", event, payload);

  // later: DynamoDB tbl_maya_events
}