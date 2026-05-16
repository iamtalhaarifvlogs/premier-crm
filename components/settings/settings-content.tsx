"use client"

import * as React from "react"
import { Bot, Clock, AlertTriangle, RotateCcw, Save } from "lucide-react"

import { useCRM } from "@/lib/crm-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SettingsContent() {
  const { settings, updateSettings, resetDemoData } = useCRM()
  const [hasChanges, setHasChanges] = React.useState(false)
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Auto-hide notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    setHasChanges(false)
    setNotification({ message: "Settings saved successfully!", type: 'success' })
  }

  const handleResetDemo = () => {
    resetDemoData()
    setNotification({ message: "✅ Demo data has been reset successfully!", type: 'success' })
  }

  return (
    <div className="space-y-6 p-6 relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3.5 rounded-xl shadow-xl text-sm font-medium flex items-center gap-3 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure automation and system preferences
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSaveSettings}>
            <Save className="mr-1.5 size-4" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              Automation Settings
            </CardTitle>
            <CardDescription>
              Control the behavior of Maya AI and automated workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maya-automation" className="text-base">
                  Enable Maya Automation
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow Maya AI to automatically respond to customer inquiries and qualify leads
                </p>
              </div>
              <Switch
                id="maya-automation"
                checked={settings.mayaAutomation}
                onCheckedChange={(checked) => handleSettingChange("mayaAutomation", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="followup-scheduling" className="text-base flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Enable Follow-Up Scheduling
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically schedule follow-up messages for leads who haven&apos;t responded
                </p>
              </div>
              <Switch
                id="followup-scheduling"
                checked={settings.followUpScheduling}
                onCheckedChange={(checked) => handleSettingChange("followUpScheduling", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="kill-switch" className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-4" />
                  Kill Switch
                </Label>
                <p className="text-sm text-muted-foreground">
                  Emergency stop for all automation. Enable to immediately halt all automated actions.
                </p>
              </div>
              <Switch
                id="kill-switch"
                checked={settings.killSwitch}
                onCheckedChange={(checked) => handleSettingChange("killSwitch", checked)}
                className={cn(
                  settings.killSwitch && "data-[state=checked]:bg-destructive"
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current state of automation systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatusIndicator
                label="Maya AI"
                active={settings.mayaAutomation && !settings.killSwitch}
              />
              <StatusIndicator
                label="Follow-ups"
                active={settings.followUpScheduling && !settings.killSwitch}
              />
              <StatusIndicator
                label="Kill Switch"
                active={settings.killSwitch}
                isWarning
              />
            </div>
          </CardContent>
        </Card>

        {/* Demo Data Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="size-5" />
              Demo Data
            </CardTitle>
            <CardDescription>
              Manage demo data for testing and demonstrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium">Reset Demo Data</p>
                <p className="text-sm text-muted-foreground">
                  Restore all leads, workflow logs, and settings to their initial demo state
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <RotateCcw className="mr-1.5 size-4" />
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore all leads, workflow logs, and settings to their initial
                      state. Any changes you&apos;ve made during this session will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetDemo}>
                      Reset Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusIndicator({
  label,
  active,
  isWarning = false,
}: {
  label: string
  active: boolean
  isWarning?: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border p-3">
      <div
        className={cn(
          "size-2.5 rounded-full",
          active
            ? isWarning
              ? "bg-destructive animate-pulse"
              : "bg-green-500"
            : "bg-muted-foreground/30"
        )}
      />
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "ml-auto text-xs",
          active
            ? isWarning
              ? "text-destructive"
              : "text-green-600"
            : "text-muted-foreground"
        )}
      >
        {active ? (isWarning ? "ACTIVE" : "Online") : "Offline"}
      </span>
    </div>
  )
}