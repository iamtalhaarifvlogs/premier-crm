"use client"

import * as React from "react"
import { Car, MapPin, DollarSign, Gauge, CheckCircle, RefreshCw, Star } from "lucide-react"

import { getVehicleMatches } from "@/lib/mock-data"
import { Lead, formatCurrency } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SourcingTabProps {
  lead: Lead
}

export function SourcingTab({ lead }: SourcingTabProps) {
  const [vehicleMatches, setVehicleMatches] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [showAlternatives, setShowAlternatives] = React.useState(true)
  const [loading, setLoading] = React.useState(true)

  // Load real vehicle matches
  React.useEffect(() => {
    async function loadMatches() {
      try {
        const matches = await getVehicleMatches()
        setVehicleMatches(matches)
      } catch (err) {
        console.error("Failed to load vehicle matches:", err)
        setVehicleMatches([])
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [])

  const primaryMatch = vehicleMatches[0]
  const alternatives = vehicleMatches.slice(1)

  const handleTriggerSourcing = () => {
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setShowAlternatives(true)
    }, 1800)
  }

  return (
    <div className="space-y-4 p-4">
      {/* Primary Match Card */}
      {primaryMatch ? (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="size-5 text-green-600" />
                Best Match Found
              </CardTitle>
              <Badge className="bg-green-600">{primaryMatch.matchScore}% Match</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">
                    {primaryMatch.year} {primaryMatch.make} {primaryMatch.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">{primaryMatch.color}</p>
                </div>
                <span className="text-xl font-bold text-green-700">
                  {formatCurrency(primaryMatch.price)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="size-4" />
                  <span>{primaryMatch.mileage.toLocaleString()} miles</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4" />
                  <span>{primaryMatch.dealership}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Match Score</span>
                  <span className="font-medium">{primaryMatch.matchScore}%</span>
                </div>
                <Progress value={primaryMatch.matchScore} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading vehicle matches...
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No vehicle matches found yet.
        </div>
      )}

      {/* Alternative Options */}
      {showAlternatives && alternatives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Star className="size-4 text-amber-500" />
            Alternative Options
          </h3>
          {alternatives.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Car className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.mileage.toLocaleString()} mi • {vehicle.color} • {vehicle.dealership}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(vehicle.price)}</p>
                    <Badge variant="outline" className="text-xs">
                      {vehicle.matchScore}% match
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trigger Sourcing Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleTriggerSourcing}
        disabled={isSearching}
      >
        {isSearching ? (
          <>
            <RefreshCw className="mr-2 size-4 animate-spin" />
            Searching Inventory...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 size-4" />
            Trigger Alternative Sourcing Flow
          </>
        )}
      </Button>
    </div>
  )
}