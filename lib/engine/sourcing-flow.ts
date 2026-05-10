/**
 * Vehicle Sourcing Flow System
 * 
 * Handles vehicle matching, alternative generation, and sourcing optimization.
 * Integrates with inventory systems and partner dealerships.
 */

import type { Lead, VehicleMatch } from "../mock-data"

// Vehicle search criteria
export interface SearchCriteria {
  make?: string
  model?: string
  yearMin?: number
  yearMax?: number
  priceMin?: number
  priceMax?: number
  mileageMax?: number
  colors?: string[]
  features?: string[]
  fuelType?: "gas" | "diesel" | "electric" | "hybrid" | "any"
  transmission?: "automatic" | "manual" | "any"
  bodyType?: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "van" | "any"
}

// Extended vehicle info
export interface Vehicle extends VehicleMatch {
  vin: string
  trim: string
  fuelType: string
  transmission: string
  bodyType: string
  features: string[]
  images: string[]
  daysOnLot: number
  status: "available" | "reserved" | "pending_sale" | "sold"
  reservedFor?: string // leadId
  lastUpdated: string
}

// Sourcing result
export interface SourcingResult {
  id: string
  leadId: string
  searchCriteria: SearchCriteria
  primaryMatches: Vehicle[]
  alternatives: Vehicle[]
  sourcingStatus: "pending" | "in_progress" | "completed" | "failed"
  matchQuality: "excellent" | "good" | "fair" | "poor"
  totalSearched: number
  searchTime: number // ms
  timestamp: string
  notes: string[]
}

// Dealership source
export interface DealershipSource {
  id: string
  name: string
  type: "internal" | "partner" | "auction"
  location: string
  distance: number // miles
  priority: number // Higher = check first
  lastSync: string
  vehicleCount: number
  avgPricing: "below_market" | "market" | "above_market"
}

// Mock dealership sources
export const DEALERSHIP_SOURCES: DealershipSource[] = [
  {
    id: "dealer-internal",
    name: "Premier Auto Plus - Main Lot",
    type: "internal",
    location: "Austin, TX",
    distance: 0,
    priority: 100,
    lastSync: new Date().toISOString(),
    vehicleCount: 156,
    avgPricing: "market",
  },
  {
    id: "dealer-partner-1",
    name: "Austin Auto Group",
    type: "partner",
    location: "Austin, TX",
    distance: 5,
    priority: 80,
    lastSync: new Date().toISOString(),
    vehicleCount: 234,
    avgPricing: "below_market",
  },
  {
    id: "dealer-partner-2",
    name: "Dallas Motor Exchange",
    type: "partner",
    location: "Dallas, TX",
    distance: 195,
    priority: 60,
    lastSync: new Date().toISOString(),
    vehicleCount: 412,
    avgPricing: "market",
  },
  {
    id: "dealer-partner-3",
    name: "Houston Auto Warehouse",
    type: "partner",
    location: "Houston, TX",
    distance: 165,
    priority: 50,
    lastSync: new Date().toISOString(),
    vehicleCount: 378,
    avgPricing: "below_market",
  },
  {
    id: "dealer-auction",
    name: "Manheim Texas",
    type: "auction",
    location: "San Antonio, TX",
    distance: 80,
    priority: 30,
    lastSync: new Date().toISOString(),
    vehicleCount: 1200,
    avgPricing: "below_market",
  },
]

// Mock inventory database
export const VEHICLE_INVENTORY: Vehicle[] = [
  // Honda Accords
  {
    id: "v-001",
    vin: "1HGCV1F34LA123456",
    make: "Honda",
    model: "Accord",
    year: 2022,
    trim: "Sport",
    price: 24500,
    mileage: 15000,
    color: "Silver",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Apple CarPlay", "Honda Sensing", "Heated Seats", "Sunroof"],
    images: ["/vehicles/accord-silver.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 12,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  {
    id: "v-002",
    vin: "1HGCV1F34LA234567",
    make: "Honda",
    model: "Accord",
    year: 2021,
    trim: "EX-L",
    price: 26000,
    mileage: 22000,
    color: "Black",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Leather Seats", "Navigation", "Apple CarPlay", "Blind Spot Monitor"],
    images: ["/vehicles/accord-black.jpg"],
    dealership: "Austin Auto Group",
    daysOnLot: 8,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Toyota Camrys
  {
    id: "v-003",
    vin: "4T1BF1FK2CU123456",
    make: "Toyota",
    model: "Camry",
    year: 2022,
    trim: "SE",
    price: 23500,
    mileage: 18000,
    color: "White",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Toyota Safety Sense", "Apple CarPlay", "LED Headlights"],
    images: ["/vehicles/camry-white.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 15,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  {
    id: "v-004",
    vin: "4T1BF1FK2CU234567",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    trim: "LE",
    price: 18500,
    mileage: 35000,
    color: "Blue",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Toyota Safety Sense", "Backup Camera"],
    images: ["/vehicles/camry-blue.jpg"],
    dealership: "Dallas Motor Exchange",
    daysOnLot: 22,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Tesla Model 3
  {
    id: "v-005",
    vin: "5YJ3E1EA1LF123456",
    make: "Tesla",
    model: "Model 3",
    year: 2022,
    trim: "Long Range",
    price: 38000,
    mileage: 12000,
    color: "Pearl White",
    fuelType: "electric",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Autopilot", "Premium Interior", "Full Self-Driving Capable"],
    images: ["/vehicles/model3-white.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 5,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  {
    id: "v-006",
    vin: "5YJ3E1EA1LF234567",
    make: "Tesla",
    model: "Model 3",
    year: 2021,
    trim: "Standard Range Plus",
    price: 32000,
    mileage: 25000,
    color: "Midnight Silver",
    fuelType: "electric",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Autopilot", "Premium Audio"],
    images: ["/vehicles/model3-silver.jpg"],
    dealership: "Houston Auto Warehouse",
    daysOnLot: 18,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // BMW X3
  {
    id: "v-007",
    vin: "5UXTY5C09L9B12345",
    make: "BMW",
    model: "X3",
    year: 2021,
    trim: "xDrive30i",
    price: 35500,
    mileage: 28000,
    color: "Alpine White",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "suv",
    features: ["xDrive AWD", "Panoramic Roof", "Navigation", "Heated Seats"],
    images: ["/vehicles/x3-white.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 10,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Ford F-150
  {
    id: "v-008",
    vin: "1FTFW1E57LF123456",
    make: "Ford",
    model: "F-150",
    year: 2020,
    trim: "XLT",
    price: 32000,
    mileage: 42000,
    color: "Magnetic Gray",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "truck",
    features: ["4WD", "Tow Package", "Bed Liner", "SYNC 3"],
    images: ["/vehicles/f150-gray.jpg"],
    dealership: "Dallas Motor Exchange",
    daysOnLot: 14,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  {
    id: "v-009",
    vin: "1FTFW1E57LF234567",
    make: "Ford",
    model: "F-150",
    year: 2019,
    trim: "Lariat",
    price: 28500,
    mileage: 55000,
    color: "Oxford White",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "truck",
    features: ["4WD", "Leather", "Heated/Cooled Seats", "Navigation"],
    images: ["/vehicles/f150-white.jpg"],
    dealership: "Austin Auto Group",
    daysOnLot: 28,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Mercedes C-Class
  {
    id: "v-010",
    vin: "WDDWF4KB7LR123456",
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    trim: "C300",
    price: 42000,
    mileage: 15000,
    color: "Obsidian Black",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["AMG Line", "Burmester Audio", "Driver Assist", "Panoramic Roof"],
    images: ["/vehicles/cclass-black.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 7,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Hyundai Elantra
  {
    id: "v-011",
    vin: "5NPD84LF5LH123456",
    make: "Hyundai",
    model: "Elantra",
    year: 2021,
    trim: "SEL",
    price: 16500,
    mileage: 32000,
    color: "Intense Blue",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Smart Cruise Control", "Apple CarPlay", "Blind Spot Monitor"],
    images: ["/vehicles/elantra-blue.jpg"],
    dealership: "Austin Auto Group",
    daysOnLot: 35,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Lexus RX
  {
    id: "v-012",
    vin: "2T2BZMCA4LC123456",
    make: "Lexus",
    model: "RX",
    year: 2020,
    trim: "350",
    price: 38000,
    mileage: 38000,
    color: "Atomic Silver",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "suv",
    features: ["Lexus Safety System", "Mark Levinson Audio", "Navigation"],
    images: ["/vehicles/rx-silver.jpg"],
    dealership: "Dallas Motor Exchange",
    daysOnLot: 20,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Mazda CX-5
  {
    id: "v-013",
    vin: "JM3KFBCM5L0123456",
    make: "Mazda",
    model: "CX-5",
    year: 2021,
    trim: "Touring",
    price: 24000,
    mileage: 28000,
    color: "Soul Red Crystal",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "suv",
    features: ["i-ACTIVSENSE", "Apple CarPlay", "Bose Audio"],
    images: ["/vehicles/cx5-red.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 16,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Audi Q5
  {
    id: "v-014",
    vin: "WA1BNAFY8L2123456",
    make: "Audi",
    model: "Q5",
    year: 2022,
    trim: "Premium Plus",
    price: 44000,
    mileage: 18000,
    color: "Navarra Blue",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "suv",
    features: ["Quattro AWD", "Virtual Cockpit", "B&O Sound", "Panoramic Roof"],
    images: ["/vehicles/q5-blue.jpg"],
    dealership: "Premier Auto Plus - Main Lot",
    daysOnLot: 9,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
  // Honda Civic
  {
    id: "v-015",
    vin: "2HGFC2F59MH123456",
    make: "Honda",
    model: "Civic",
    year: 2021,
    trim: "Sport",
    price: 21000,
    mileage: 24000,
    color: "Rallye Red",
    fuelType: "gas",
    transmission: "automatic",
    bodyType: "sedan",
    features: ["Honda Sensing", "Apple CarPlay", "Sport Pedals"],
    images: ["/vehicles/civic-red.jpg"],
    dealership: "Houston Auto Warehouse",
    daysOnLot: 11,
    status: "available",
    lastUpdated: new Date().toISOString(),
    matchScore: 0,
  },
]

// Parse preferred vehicle string to extract make/model
export function parseVehiclePreference(preferredVehicle: string): { make: string; model: string; year?: number } {
  const parts = preferredVehicle.split(" ")
  let year: number | undefined
  let make: string
  let model: string

  // Check if first part is a year
  const firstPart = parseInt(parts[parts.length - 1])
  if (!isNaN(firstPart) && firstPart > 1990 && firstPart < 2030) {
    year = firstPart
    parts.pop()
  }

  // First word is make, rest is model
  make = parts[0] || ""
  model = parts.slice(1).join(" ") || ""

  return { make, model, year }
}

// Build search criteria from lead preferences
export function buildSearchCriteria(lead: Lead): SearchCriteria {
  const { make, model, year } = parseVehiclePreference(lead.preferredVehicle)
  
  return {
    make: make || undefined,
    model: model || undefined,
    yearMin: year ? year - 2 : undefined,
    yearMax: year ? year + 1 : undefined,
    priceMin: Math.round(lead.budget * 0.7),
    priceMax: Math.round(lead.budget * 1.15),
    mileageMax: 60000,
  }
}

// Calculate match score for a vehicle against criteria
export function calculateMatchScore(vehicle: Vehicle, criteria: SearchCriteria, lead: Lead): number {
  let score = 0
  let maxScore = 0

  // Make match (25 points)
  if (criteria.make) {
    maxScore += 25
    if (vehicle.make.toLowerCase() === criteria.make.toLowerCase()) {
      score += 25
    } else if (vehicle.make.toLowerCase().includes(criteria.make.toLowerCase())) {
      score += 15
    }
  }

  // Model match (25 points)
  if (criteria.model) {
    maxScore += 25
    if (vehicle.model.toLowerCase() === criteria.model.toLowerCase()) {
      score += 25
    } else if (vehicle.model.toLowerCase().includes(criteria.model.toLowerCase())) {
      score += 15
    }
  }

  // Price within budget (20 points)
  maxScore += 20
  if (vehicle.price <= lead.budget) {
    const priceRatio = vehicle.price / lead.budget
    if (priceRatio >= 0.85 && priceRatio <= 1.0) {
      score += 20 // Sweet spot
    } else if (priceRatio >= 0.7) {
      score += 15
    } else {
      score += 10
    }
  } else if (vehicle.price <= lead.budget * 1.1) {
    score += 10 // Slightly over but negotiable
  }

  // Year (15 points)
  maxScore += 15
  const currentYear = new Date().getFullYear()
  const vehicleAge = currentYear - vehicle.year
  if (vehicleAge <= 2) {
    score += 15
  } else if (vehicleAge <= 4) {
    score += 10
  } else if (vehicleAge <= 6) {
    score += 5
  }

  // Mileage (10 points)
  maxScore += 10
  if (vehicle.mileage < 20000) {
    score += 10
  } else if (vehicle.mileage < 40000) {
    score += 7
  } else if (vehicle.mileage < 60000) {
    score += 4
  }

  // Availability (5 points)
  maxScore += 5
  if (vehicle.status === "available") {
    score += 5
  }

  // Calculate percentage
  return Math.round((score / maxScore) * 100)
}

// Search inventory and find matches
export function searchInventory(
  criteria: SearchCriteria,
  lead: Lead,
  options: { limit?: number; includeReserved?: boolean } = {}
): Vehicle[] {
  const { limit = 10, includeReserved = false } = options

  let results = VEHICLE_INVENTORY.filter(vehicle => {
    // Status filter
    if (!includeReserved && vehicle.status !== "available") {
      return false
    }

    // Price range
    if (criteria.priceMin && vehicle.price < criteria.priceMin) return false
    if (criteria.priceMax && vehicle.price > criteria.priceMax) return false

    // Year range
    if (criteria.yearMin && vehicle.year < criteria.yearMin) return false
    if (criteria.yearMax && vehicle.year > criteria.yearMax) return false

    // Mileage
    if (criteria.mileageMax && vehicle.mileage > criteria.mileageMax) return false

    // Fuel type
    if (criteria.fuelType && criteria.fuelType !== "any" && vehicle.fuelType !== criteria.fuelType) return false

    // Transmission
    if (criteria.transmission && criteria.transmission !== "any" && vehicle.transmission !== criteria.transmission) return false

    // Body type
    if (criteria.bodyType && criteria.bodyType !== "any" && vehicle.bodyType !== criteria.bodyType) return false

    return true
  })

  // Calculate match scores
  results = results.map(vehicle => ({
    ...vehicle,
    matchScore: calculateMatchScore(vehicle, criteria, lead),
  }))

  // Sort by match score
  results.sort((a, b) => b.matchScore - a.matchScore)

  return results.slice(0, limit)
}

// Generate alternative options
export function generateAlternatives(
  lead: Lead,
  primaryMatches: Vehicle[],
  options: { limit?: number; expandCriteria?: boolean } = {}
): Vehicle[] {
  const { limit = 5, expandCriteria = true } = options

  const primaryIds = new Set(primaryMatches.map(v => v.id))
  
  let alternatives: Vehicle[] = []

  // Strategy 1: Same body type, different make
  const primaryMake = primaryMatches[0]?.make
  const sameBodyType = VEHICLE_INVENTORY.filter(v => 
    v.status === "available" &&
    !primaryIds.has(v.id) &&
    v.bodyType === primaryMatches[0]?.bodyType &&
    v.make !== primaryMake &&
    v.price <= lead.budget * 1.1
  )
  alternatives.push(...sameBodyType)

  // Strategy 2: Expand budget range
  if (expandCriteria) {
    const expandedBudget = VEHICLE_INVENTORY.filter(v =>
      v.status === "available" &&
      !primaryIds.has(v.id) &&
      !alternatives.some(a => a.id === v.id) &&
      v.price > lead.budget * 0.7 &&
      v.price <= lead.budget * 1.2
    )
    alternatives.push(...expandedBudget)
  }

  // Strategy 3: Higher mileage but great value
  const valueOptions = VEHICLE_INVENTORY.filter(v =>
    v.status === "available" &&
    !primaryIds.has(v.id) &&
    !alternatives.some(a => a.id === v.id) &&
    v.price < lead.budget * 0.85 &&
    v.mileage < 60000
  )
  alternatives.push(...valueOptions)

  // Calculate scores and dedupe
  const seenIds = new Set<string>()
  alternatives = alternatives
    .filter(v => {
      if (seenIds.has(v.id)) return false
      seenIds.add(v.id)
      return true
    })
    .map(vehicle => ({
      ...vehicle,
      matchScore: calculateMatchScore(vehicle, buildSearchCriteria(lead), lead),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)

  return alternatives
}

// Full sourcing flow
export async function executeSourcingFlow(lead: Lead): Promise<SourcingResult> {
  const startTime = Date.now()
  const criteria = buildSearchCriteria(lead)
  const notes: string[] = []

  // Search primary matches
  notes.push(`Searching for: ${lead.preferredVehicle}`)
  notes.push(`Budget range: $${criteria.priceMin?.toLocaleString()} - $${criteria.priceMax?.toLocaleString()}`)

  const primaryMatches = searchInventory(criteria, lead, { limit: 5 })
  notes.push(`Found ${primaryMatches.length} primary matches`)

  // Generate alternatives
  const alternatives = generateAlternatives(lead, primaryMatches, { limit: 5 })
  notes.push(`Generated ${alternatives.length} alternatives`)

  // Determine match quality
  let matchQuality: SourcingResult["matchQuality"]
  const topScore = primaryMatches[0]?.matchScore || 0
  if (topScore >= 90) matchQuality = "excellent"
  else if (topScore >= 75) matchQuality = "good"
  else if (topScore >= 50) matchQuality = "fair"
  else matchQuality = "poor"

  const searchTime = Date.now() - startTime

  return {
    id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    leadId: lead.id,
    searchCriteria: criteria,
    primaryMatches,
    alternatives,
    sourcingStatus: "completed",
    matchQuality,
    totalSearched: VEHICLE_INVENTORY.length,
    searchTime,
    timestamp: new Date().toISOString(),
    notes,
  }
}

// Recommendation engine
export interface VehicleRecommendation {
  vehicle: Vehicle
  reason: string
  confidence: number
  tags: string[]
}

export function generateRecommendations(lead: Lead, limit: number = 3): VehicleRecommendation[] {
  const recommendations: VehicleRecommendation[] = []
  const criteria = buildSearchCriteria(lead)
  const matches = searchInventory(criteria, lead, { limit: 10 })

  for (const vehicle of matches.slice(0, limit)) {
    const tags: string[] = []
    let reason = ""

    // Best match
    if (vehicle.matchScore >= 90) {
      reason = `Perfect match for your ${lead.preferredVehicle} search`
      tags.push("Best Match")
    } else if (vehicle.matchScore >= 75) {
      reason = `Great option that meets your key requirements`
      tags.push("Recommended")
    } else {
      reason = `Alternative worth considering`
      tags.push("Alternative")
    }

    // Price tags
    if (vehicle.price < lead.budget * 0.9) {
      tags.push("Under Budget")
    } else if (vehicle.price <= lead.budget) {
      tags.push("Within Budget")
    }

    // Condition tags
    if (vehicle.mileage < 20000) {
      tags.push("Low Miles")
    }
    if (vehicle.daysOnLot > 30) {
      tags.push("Motivated Seller")
    }
    if (vehicle.year >= new Date().getFullYear() - 1) {
      tags.push("Like New")
    }

    recommendations.push({
      vehicle,
      reason,
      confidence: vehicle.matchScore / 100,
      tags,
    })
  }

  return recommendations
}

// Check if vehicle is still available
export function checkVehicleAvailability(vehicleId: string): { available: boolean; status: Vehicle["status"] | null } {
  const vehicle = VEHICLE_INVENTORY.find(v => v.id === vehicleId)
  if (!vehicle) {
    return { available: false, status: null }
  }
  return {
    available: vehicle.status === "available",
    status: vehicle.status,
  }
}

// Reserve a vehicle for a lead
export function reserveVehicle(vehicleId: string, leadId: string): { success: boolean; message: string } {
  const vehicle = VEHICLE_INVENTORY.find(v => v.id === vehicleId)
  if (!vehicle) {
    return { success: false, message: "Vehicle not found" }
  }
  if (vehicle.status !== "available") {
    return { success: false, message: `Vehicle is ${vehicle.status}` }
  }

  // Update in mock (in real system this would be a DB transaction)
  vehicle.status = "reserved"
  vehicle.reservedFor = leadId
  vehicle.lastUpdated = new Date().toISOString()

  return { success: true, message: `Vehicle reserved for lead ${leadId}` }
}

// Release a reservation
export function releaseReservation(vehicleId: string): { success: boolean; message: string } {
  const vehicle = VEHICLE_INVENTORY.find(v => v.id === vehicleId)
  if (!vehicle) {
    return { success: false, message: "Vehicle not found" }
  }
  if (vehicle.status !== "reserved") {
    return { success: false, message: "Vehicle is not reserved" }
  }

  vehicle.status = "available"
  vehicle.reservedFor = undefined
  vehicle.lastUpdated = new Date().toISOString()

  return { success: true, message: "Reservation released" }
}
