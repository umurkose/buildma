import { Screen } from "@/components/ui/screen"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardHint,
} from "@/components/ui/card"
import { ThemeSelect } from "@/components/theme/toggle"
import { TextSizeSelect } from "@/components/theme/text-size"
import { PrimaryColorPicker } from "@/components/theme/color"
import { NavShellSelect } from "@/components/layout/shell"

export default async function SettingsPage() {
  return (
    <Screen>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Light, dark, or match your system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelect className="w-full" />
          </CardContent>
          <CardFooter>
            <CardHint>Saved to this device.</CardHint>
          </CardFooter>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Text size</CardTitle>
            <CardDescription>Change the size of the text.</CardDescription>
          </CardHeader>
          <CardContent>
            <TextSizeSelect className="w-full" />
          </CardContent>
          <CardFooter>
            <CardHint>Saved to this device.</CardHint>
          </CardFooter>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Accent colour</CardTitle>
            <CardDescription>
              Used for buttons, links and focus rings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PrimaryColorPicker />
          </CardContent>
          <CardFooter>
            <CardHint>Saved to this device.</CardHint>
          </CardFooter>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>
              Keep the sidebar, or move the navigation into a dock at the bottom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NavShellSelect className="w-full" />
          </CardContent>
          <CardFooter>
            <CardHint>Saved to this device. Applies on wider screens.</CardHint>
          </CardFooter>
        </Card>
      </div>
    </Screen>
  )
}
