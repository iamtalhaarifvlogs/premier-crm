/**
 * Inventory Synchronization Layer
 * 
 * Manages real-time inventory updates, price synchronization,
 * availability tracking, and multi-source inventory management.
 */

import type { Lead } from "../mock-data"
import { type Vehicle, VEHICLE_INVENTORY, DEALERSHIP_SOURCES, type DealershipSource } from "./sourcing-flow"

// Sync status
export type SyncStatus = "synced" | "pending" | "syncing" | "failed" | "stale"

// Inventory change types
export type InventoryChangeType = 
  | "added"
  | "removed"
  | "price_changed"
  | "status_changed"
  | "reserved"
  | "unreserved"
  | "sold"
  | "details_updated"

// Inventory change event
export interface InventoryChange {
  id: string
  vehicleId: string
  type: InventoryChangeType
  previousValue?: unknown
  newValue?: unknown
  source: string
  timestamp: string
  affectedLeads: string[] // leadIds that might be affected
}

// Sync operation
export interface SyncOperation {
  id: string
  sourceId: string
  status: SyncStatus
  startedAt: string
  completedAt?: string
  vehiclesProcessed: number
  changesDetected: number
  errors: string[]
}

// Price update
export interface PriceUpdate {
  vehicleId: string
  oldPrice: number
  newPrice: number
  changePercent: number
  reason: "market_adjustment" | "days_on_lot" | "competitor_pricing" | "manual"
  effectiveDate: string
}

// Reservation
export interface Reservation {
  id: string
  vehicleId: string
  leadId: string
  repId?: string
  status: "active" | "expired" | "converted" | "cancelled"
  createdAt: string
  expiresAt: string
  depositAmount?: number
  notes?: string
}

// Inventory alert
export interface InventoryAlert {
  id: string
  type: "low_stock" | "high_demand" | "price_drop" | "new_arrival" | "expiring_reservation"
  severity: "info" | "warning" | "critical"
  title: string
  message: string
  affectedVehicles: string[]
  affectedLeads: string[]
  createdAt: string
  acknowledged: boolean
}

// Inventory Manager Class
export class InventoryManager {
  private inventory: Map<string, Vehicle>
  private reservations: Map<string, Reservation>
  private changes: InventoryChange[]
  private syncOperations: Map<string, SyncOperation>
  private alerts: InventoryAlert[]
  private priceHistory: Map<string, PriceUpdate[]>
  private subscribers: ((change: InventoryChange) => void)[]

  constructor() {
    this.inventory = new Map()
    this.reservations = new Map()
    this.changes = []
    this.syncOperations = new Map()
    this.alerts = []
    this.priceHistory = new Map()
    this.subscribers = []

    // Initialize with mock inventory
    VEHICLE_INVENTORY.forEach(v => this.inventory.set(v.id, { ...v }))
  }

  // Subscribe to inventory changes
  subscribe(callback: (change: InventoryChange) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  // Notify subscribers of change
  private notifyChange(change: InventoryChange): void {
    this.changes.push(change)
    this.subscribers.forEach(cb => cb(change))
  }

  // Get vehicle by ID
  getVehicle(id: string): Vehicle | null {
    return this.inventory.get(id) || null
  }

  // Get all vehicles
  getAllVehicles(): Vehicle[] {
    return Array.from(this.inventory.values())
  }

  // Get available vehicles
  getAvailableVehicles(): Vehicle[] {
    return this.getAllVehicles().filter(v => v.status === "available")
  }

  // Get vehicles by status
  getVehiclesByStatus(status: Vehicle["status"]): Vehicle[] {
    return this.getAllVehicles().filter(v => v.status === status)
  }

  // Update vehicle
  updateVehicle(
    id: string,
    updates: Partial<Vehicle>,
    source: string = "system"
  ): { success: boolean; change?: InventoryChange } {
    const vehicle = this.inventory.get(id)
    if (!vehicle) {
      return { success: false }
    }

    // Determine change type
    let changeType: InventoryChangeType = "details_updated"
    let previousValue: unknown
    let newValue: unknown

    if (updates.price !== undefined && updates.price !== vehicle.price) {
      changeType = "price_changed"
      previousValue = vehicle.price
      newValue = updates.price

      // Track price history
      const history = this.priceHistory.get(id) || []
      history.push({
        vehicleId: id,
        oldPrice: vehicle.price,
        newPrice: updates.price,
        changePercent: ((updates.price - vehicle.price) / vehicle.price) * 100,
        reason: "market_adjustment",
        effectiveDate: new Date().toISOString(),
      })
      this.priceHistory.set(id, history)
    }

    if (updates.status !== undefined && updates.status !== vehicle.status) {
      if (updates.status === "reserved") changeType = "reserved"
      else if (vehicle.status === "reserved" && updates.status === "available") changeType = "unreserved"
      else if (updates.status === "sold") changeType = "sold"
      else changeType = "status_changed"
      previousValue = vehicle.status
      newValue = updates.status
    }

    // Apply updates
    const updatedVehicle: Vehicle = {
      ...vehicle,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }
    this.inventory.set(id, updatedVehicle)

    // Find affected leads
    const affectedLeads = this.findAffectedLeads(updatedVehicle, changeType)

    // Create change record
    const change: InventoryChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: id,
      type: changeType,
      previousValue,
      newValue,
      source,
      timestamp: new Date().toISOString(),
      affectedLeads,
    }

    this.notifyChange(change)

    // Check for alerts
    this.checkAlerts(updatedVehicle, change)

    return { success: true, change }
  }

  // Add new vehicle
  addVehicle(vehicle: Vehicle, source: string = "system"): { success: boolean; change?: InventoryChange } {
    if (this.inventory.has(vehicle.id)) {
      return { success: false }
    }

    this.inventory.set(vehicle.id, {
      ...vehicle,
      lastUpdated: new Date().toISOString(),
    })

    const change: InventoryChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: vehicle.id,
      type: "added",
      newValue: vehicle,
      source,
      timestamp: new Date().toISOString(),
      affectedLeads: [],
    }

    this.notifyChange(change)
    this.checkNewArrivalAlert(vehicle)

    return { success: true, change }
  }

  // Remove vehicle
  removeVehicle(id: string, source: string = "system"): { success: boolean; change?: InventoryChange } {
    const vehicle = this.inventory.get(id)
    if (!vehicle) {
      return { success: false }
    }

    this.inventory.delete(id)

    // Cancel any active reservations
    const reservations = this.getReservationsForVehicle(id)
    reservations.forEach(r => {
      if (r.status === "active") {
        this.cancelReservation(r.id, "Vehicle removed from inventory")
      }
    })

    const change: InventoryChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: id,
      type: "removed",
      previousValue: vehicle,
      source,
      timestamp: new Date().toISOString(),
      affectedLeads: reservations.map(r => r.leadId),
    }

    this.notifyChange(change)

    return { success: true, change }
  }

  // Create reservation
  createReservation(
    vehicleId: string,
    leadId: string,
    options: { repId?: string; depositAmount?: number; durationHours?: number; notes?: string } = {}
  ): { success: boolean; reservation?: Reservation; error?: string } {
    const vehicle = this.inventory.get(vehicleId)
    if (!vehicle) {
      return { success: false, error: "Vehicle not found" }
    }
    if (vehicle.status !== "available") {
      return { success: false, error: `Vehicle is ${vehicle.status}` }
    }

    // Check for existing active reservation by this lead
    const existingReservations = Array.from(this.reservations.values())
      .filter(r => r.leadId === leadId && r.status === "active")
    if (existingReservations.length >= 2) {
      return { success: false, error: "Lead already has maximum active reservations" }
    }

    const { repId, depositAmount, durationHours = 48, notes } = options
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000)

    const reservation: Reservation = {
      id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      vehicleId,
      leadId,
      repId,
      status: "active",
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      depositAmount,
      notes,
    }

    this.reservations.set(reservation.id, reservation)

    // Update vehicle status
    this.updateVehicle(vehicleId, {
      status: "reserved",
      reservedFor: leadId,
    }, "reservation_system")

    return { success: true, reservation }
  }

  // Cancel reservation
  cancelReservation(reservationId: string, reason?: string): { success: boolean; error?: string } {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) {
      return { success: false, error: "Reservation not found" }
    }
    if (reservation.status !== "active") {
      return { success: false, error: "Reservation is not active" }
    }

    reservation.status = "cancelled"
    reservation.notes = reason ? `${reservation.notes || ""}\nCancelled: ${reason}` : reservation.notes

    // Update vehicle status
    const vehicle = this.inventory.get(reservation.vehicleId)
    if (vehicle && vehicle.status === "reserved" && vehicle.reservedFor === reservation.leadId) {
      this.updateVehicle(reservation.vehicleId, {
        status: "available",
        reservedFor: undefined,
      }, "reservation_system")
    }

    return { success: true }
  }

  // Convert reservation to sale
  convertReservationToSale(reservationId: string): { success: boolean; error?: string } {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) {
      return { success: false, error: "Reservation not found" }
    }
    if (reservation.status !== "active") {
      return { success: false, error: "Reservation is not active" }
    }

    reservation.status = "converted"

    // Update vehicle status
    this.updateVehicle(reservation.vehicleId, {
      status: "sold",
    }, "reservation_system")

    return { success: true }
  }

  // Get reservations for a lead
  getReservationsForLead(leadId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(r => r.leadId === leadId)
  }

  // Get reservations for a vehicle
  getReservationsForVehicle(vehicleId: string): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(r => r.vehicleId === vehicleId)
  }

  // Get active reservations
  getActiveReservations(): Reservation[] {
    return Array.from(this.reservations.values())
      .filter(r => r.status === "active")
  }

  // Check for expired reservations
  checkExpiredReservations(): Reservation[] {
    const now = new Date()
    const expired: Reservation[] = []

    this.reservations.forEach(reservation => {
      if (reservation.status === "active" && new Date(reservation.expiresAt) < now) {
        reservation.status = "expired"
        expired.push(reservation)

        // Release the vehicle
        const vehicle = this.inventory.get(reservation.vehicleId)
        if (vehicle && vehicle.status === "reserved" && vehicle.reservedFor === reservation.leadId) {
          this.updateVehicle(reservation.vehicleId, {
            status: "available",
            reservedFor: undefined,
          }, "reservation_system")
        }

        // Create alert
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "expiring_reservation",
          severity: "warning",
          title: "Reservation Expired",
          message: `Reservation for lead ${reservation.leadId} has expired`,
          affectedVehicles: [reservation.vehicleId],
          affectedLeads: [reservation.leadId],
          createdAt: new Date().toISOString(),
          acknowledged: false,
        })
      }
    })

    return expired
  }

  // Sync from external source
  async syncFromSource(sourceId: string): Promise<SyncOperation> {
    const source = DEALERSHIP_SOURCES.find(s => s.id === sourceId)
    if (!source) {
      throw new Error(`Source ${sourceId} not found`)
    }

    const operation: SyncOperation = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceId,
      status: "syncing",
      startedAt: new Date().toISOString(),
      vehiclesProcessed: 0,
      changesDetected: 0,
      errors: [],
    }

    this.syncOperations.set(operation.id, operation)

    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 100))

    // In real implementation, this would fetch from external APIs
    // For demo, we'll simulate some random changes
    const vehiclesFromSource = this.getAllVehicles()
      .filter(v => v.dealership === source.name)

    vehiclesFromSource.forEach(vehicle => {
      operation.vehiclesProcessed++

      // Randomly simulate price changes (10% chance)
      if (Math.random() < 0.1) {
        const priceChange = (Math.random() - 0.5) * 0.1 // -5% to +5%
        const newPrice = Math.round(vehicle.price * (1 + priceChange))
        this.updateVehicle(vehicle.id, { price: newPrice }, source.name)
        operation.changesDetected++
      }
    })

    operation.status = "synced"
    operation.completedAt = new Date().toISOString()

    return operation
  }

  // Sync all sources
  async syncAllSources(): Promise<SyncOperation[]> {
    const operations: SyncOperation[] = []
    
    for (const source of DEALERSHIP_SOURCES) {
      try {
        const op = await this.syncFromSource(source.id)
        operations.push(op)
      } catch (error) {
        operations.push({
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sourceId: source.id,
          status: "failed",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          vehiclesProcessed: 0,
          changesDetected: 0,
          errors: [error instanceof Error ? error.message : "Unknown error"],
        })
      }
    }

    return operations
  }

  // Find leads that might be affected by a change
  private findAffectedLeads(vehicle: Vehicle, changeType: InventoryChangeType): string[] {
    // In real implementation, this would query leads whose preferences match this vehicle
    // For demo, we return the reservedFor lead if applicable
    if (vehicle.reservedFor) {
      return [vehicle.reservedFor]
    }
    return []
  }

  // Check and create alerts
  private checkAlerts(vehicle: Vehicle, change: InventoryChange): void {
    // Price drop alert
    if (change.type === "price_changed" && 
        typeof change.previousValue === "number" && 
        typeof change.newValue === "number") {
      const dropPercent = ((change.previousValue - change.newValue) / change.previousValue) * 100
      if (dropPercent >= 5) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "price_drop",
          severity: dropPercent >= 10 ? "critical" : "info",
          title: "Significant Price Drop",
          message: `${vehicle.year} ${vehicle.make} ${vehicle.model} price dropped ${dropPercent.toFixed(1)}%`,
          affectedVehicles: [vehicle.id],
          affectedLeads: change.affectedLeads,
          createdAt: new Date().toISOString(),
          acknowledged: false,
        })
      }
    }
  }

  // Check for new arrival alerts
  private checkNewArrivalAlert(vehicle: Vehicle): void {
    // In real implementation, check against watchlists
    this.alerts.push({
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "new_arrival",
      severity: "info",
      title: "New Vehicle Added",
      message: `${vehicle.year} ${vehicle.make} ${vehicle.model} added to inventory at $${vehicle.price.toLocaleString()}`,
      affectedVehicles: [vehicle.id],
      affectedLeads: [],
      createdAt: new Date().toISOString(),
      acknowledged: false,
    })
  }

  // Get recent changes
  getRecentChanges(limit: number = 50): InventoryChange[] {
    return this.changes.slice(-limit)
  }

  // Get alerts
  getAlerts(options: { unacknowledgedOnly?: boolean; severity?: InventoryAlert["severity"] } = {}): InventoryAlert[] {
    let alerts = this.alerts
    if (options.unacknowledgedOnly) {
      alerts = alerts.filter(a => !a.acknowledged)
    }
    if (options.severity) {
      alerts = alerts.filter(a => a.severity === options.severity)
    }
    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  // Get inventory statistics
  getStatistics(): {
    totalVehicles: number
    availableCount: number
    reservedCount: number
    soldCount: number
    avgPrice: number
    avgDaysOnLot: number
    byBodyType: Record<string, number>
    bySource: Record<string, number>
  } {
    const vehicles = this.getAllVehicles()
    const available = vehicles.filter(v => v.status === "available")
    const reserved = vehicles.filter(v => v.status === "reserved")
    const sold = vehicles.filter(v => v.status === "sold")

    const totalPrice = vehicles.reduce((sum, v) => sum + v.price, 0)
    const totalDays = vehicles.reduce((sum, v) => sum + v.daysOnLot, 0)

    const byBodyType: Record<string, number> = {}
    const bySource: Record<string, number> = {}

    vehicles.forEach(v => {
      byBodyType[v.bodyType] = (byBodyType[v.bodyType] || 0) + 1
      bySource[v.dealership] = (bySource[v.dealership] || 0) + 1
    })

    return {
      totalVehicles: vehicles.length,
      availableCount: available.length,
      reservedCount: reserved.length,
      soldCount: sold.length,
      avgPrice: vehicles.length > 0 ? Math.round(totalPrice / vehicles.length) : 0,
      avgDaysOnLot: vehicles.length > 0 ? Math.round(totalDays / vehicles.length) : 0,
      byBodyType,
      bySource,
    }
  }

  // Get price history for a vehicle
  getPriceHistory(vehicleId: string): PriceUpdate[] {
    return this.priceHistory.get(vehicleId) || []
  }
}

// Singleton instance
let inventoryManager: InventoryManager | null = null

export function getInventoryManager(): InventoryManager {
  if (!inventoryManager) {
    inventoryManager = new InventoryManager()
  }
  return inventoryManager
}

// Helper function to match inventory to leads
export function findMatchingVehiclesForLead(
  lead: Lead,
  manager: InventoryManager,
  limit: number = 5
): Vehicle[] {
  const vehicles = manager.getAvailableVehicles()
  
  // Parse lead preferences
  const preferred = lead.preferredVehicle.toLowerCase()
  const parts = preferred.split(" ")
  
  // Score and sort vehicles
  const scored = vehicles.map(vehicle => {
    let score = 0
    
    // Make match
    if (parts.some(p => vehicle.make.toLowerCase().includes(p))) {
      score += 30
    }
    
    // Model match
    if (parts.some(p => vehicle.model.toLowerCase().includes(p))) {
      score += 30
    }
    
    // Price within budget
    if (vehicle.price <= lead.budget) {
      score += 20
      // Bonus for being closer to budget (not too cheap)
      const ratio = vehicle.price / lead.budget
      if (ratio >= 0.8) score += 10
    } else if (vehicle.price <= lead.budget * 1.1) {
      score += 10
    }
    
    // Year (newer is better)
    const age = new Date().getFullYear() - vehicle.year
    if (age <= 2) score += 10
    else if (age <= 4) score += 5
    
    return { vehicle, score }
  })
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({ ...s.vehicle, matchScore: s.score }))
}
