"use client"

import * as React from "react"
import { Car, MapPin, DollarSign, Gauge, CheckCircle, RefreshCw, Star } from "lucide-react"

import { getVehicleMatches } from "@/lib/mock-data"
import { Lead, formatCurrency } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SourcingTabProps {
  lead: Lead
}

export function SourcingTab({ lead }: SourcingTabProps) {
  const [matches, setMatches] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      const data = await getVehicleMatches()
      setMatches(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerSourcing = () => {
    setIsSearching(true)
    setTimeout(() => {
      loadMatches()
      setIsSearching(false)
    }, 1800)
  }

  const primaryMatch = matches[0]
  const alternatives = matches.slice(1)

  return (
    <div className="space-y-6 p-6">
      {primaryMatch && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="size-5 text-green-600" />
                Best Match Found
              </CardTitle>
              <Badge className="bg-green-600">{primaryMatch.matchScore}% Match</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">
                  {primaryMatch.year} {primaryMatch.make} {primaryMatch.model}
                </h4>
                <p className="text-sm text-muted-foreground">{primaryMatch.color}</p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(primaryMatch.price)}
              </p>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Gauge className="size-4" /> {primaryMatch.mileage?.toLocaleString()} mi
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" /> {primaryMatch.dealership}
              </div>
            </div>

            <Progress value={primaryMatch.matchScore} className="h-2" />
          </CardContent>
        </Card>
      )}

      {alternatives.length > 0 && (
        <div>
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Star className="text-amber-500" /> Alternative Options
          </h3>
          <div className="space-y-3">
            {alternatives.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex gap-3">
                    <Car className="size-10 text-muted-foreground mt-1" />
                    <div>
                      <h4 className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.mileage?.toLocaleString()} mi • {vehicle.color}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(vehicle.price)}</p>
                    <Badge variant="outline" className="mt-1">
                      {vehicle.matchScore}% match
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Button onClick={handleTriggerSourcing} disabled={isSearching} className="w-full" variant="outline">
        {isSearching ? (
          <>
            <RefreshCw className="mr-2 size-4 animate-spin" />
            Searching Inventory...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 size-4" />
            Trigger Alternative Sourcing
          </>
        )}
      </Button>
    </div>
  )
}