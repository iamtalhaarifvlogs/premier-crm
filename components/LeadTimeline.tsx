import { useMemo } from "react"

export interface TimelineItem {
  id: string
  type:
    | "objection"
    | "deposit"
    | "qualification"
    | "stage_change"
    | "rep_handoff"
    | "note"
  message: string
  createdAt: string
}

interface Props {
  events: TimelineItem[]
}

export default function LeadTimeline({ events }: Props) {
  const sorted = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
  }, [events])

  return (
    <div className="bg-white rounded-2xl border p-5 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Lead Timeline
        </h2>
        <p className="text-sm text-gray-500">
          Full activity history and AI actions.
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((event) => (
          <div
            key={event.id}
            className="border rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">
                {event.type.replaceAll("_", " ")}
              </span>

              <span className="text-xs text-gray-500">
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-2">
              {event.message}
            </p>
          </div>
        ))}

        {!sorted.length && (
          <div className="text-sm text-gray-500">
            No timeline activity found.
          </div>
        )}
      </div>
    </div>
  )
}
