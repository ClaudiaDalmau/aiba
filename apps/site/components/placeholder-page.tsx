import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export default function PlaceholderPage({
  title, description, phase, features,
}: {
  title: string; description: string; phase: string; features: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">{phase}</p>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle>Próximamente</CardTitle>
              <CardDescription>Se implementará en {phase}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">TODO</Badge>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
