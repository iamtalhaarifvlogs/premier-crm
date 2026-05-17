import { MayaReasoningResult } from "@/lib/maya/reasoning"

interface Props {
  result: MayaReasoningResult
}

export default function MayaInsights({ result }: Props) {
  return (
    <div className="bg-black text-white rounded-2xl p-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold">
          Maya AI Insights
        </h2>

        <p className="text-sm text-gray-300 mt-1">
          Intelligent lead analysis and recommendations.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">
          Priority:
        </span>

        <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold uppercase">
          {result.priority}
        </span>
      </div>

      <div>
        <h3 className="font-semibold mb-2">
          Signals
        </h3>

        <div className="flex flex-wrap gap-2">
          {result.detectedSignals.map((signal) => (
            <span
              key={signal}
              className="bg-zinc-800 px-3 py-1 rounded-full text-xs"
            >
              {signal}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">
          Recommendations
        </h3>

        <ul className="space-y-2 text-sm text-gray-300">
          {result.recommendations.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
