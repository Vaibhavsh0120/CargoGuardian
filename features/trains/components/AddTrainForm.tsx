"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, ExternalLink, Info, LoaderCircle, Radio, ShieldCheck } from "lucide-react";
import { useMemo, useState, type ComponentType, type FormEvent, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { createTrainRequest } from "@/features/trains/services/train-write-client";
import { useTrainContext } from "@/hooks/useTrainContext";
import { cn } from "@/lib/utils";
import {
  CARGO_TYPE_VALUES,
  cargoTypeLabels,
  type CargoType,
  type CreateTrainInput,
  type Train,
  type TrainSelectorResponse
} from "@/types/train";

type FormState = {
  code: string;
  label: string;
  cargoType: CargoType;
  carCount: string;
  maxSpeed: string;
  origin: string;
  destination: string;
  description: string;
  blynkAuthToken: string;
  blynkDeviceId: string;
};

const INITIAL_FORM: FormState = {
  code: "",
  label: "",
  cargoType: "container",
  carCount: "20",
  maxSpeed: "",
  origin: "",
  destination: "",
  description: "",
  blynkAuthToken: "",
  blynkDeviceId: ""
};

export function AddTrainForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSelectedTrainId } = useTrainContext();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTrain, setCreatedTrain] = useState<Train | null>(null);

  const normalizedCode = useMemo(() => form.code.trim().toUpperCase(), [form.code]);
  const createTrainMutation = useMutation({
    mutationFn: createTrainRequest,
    onSuccess: (train) => {
      queryClient.setQueryData<TrainSelectorResponse | undefined>(["shell", "trains"], (current) => {
        const nextTrain = {
          id: train.id,
          code: train.code,
          label: train.label,
          status: train.status,
          routeName: train.routeName,
          lastUpdatedAt: train.updatedAt
        };

        const existingTrains = current?.trains ?? [];
        const trains = [...existingTrains.filter((item) => item.id !== train.id), nextTrain].sort((a, b) =>
          a.label.localeCompare(b.label)
        );

        return {
          trains,
          source: "firestore",
          fetchedAt: new Date().toISOString()
        };
      });
      void queryClient.invalidateQueries({ queryKey: ["shell", "trains"] });
      void queryClient.invalidateQueries({ queryKey: ["fleet"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedTrainId(train.id);
      setCreatedTrain(train);
      setErrorMessage(null);
      toast.success("Train linked successfully.");
      router.refresh();
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Train creation failed.");
    }
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const payload: CreateTrainInput = {
      code: normalizedCode,
      label: form.label.trim(),
      cargoType: form.cargoType,
      carCount: Number(form.carCount),
      maxSpeed: form.maxSpeed.trim() ? Number(form.maxSpeed) : null,
      origin: form.origin.trim() || null,
      destination: form.destination.trim() || null,
      routeId: null,
      description: form.description.trim() || null,
      blynkAuthToken: form.blynkAuthToken.trim(),
      blynkDeviceId: form.blynkDeviceId.trim() || null
    };

    await createTrainMutation.mutateAsync(payload);
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  function resetForm() {
    setCreatedTrain(null);
    setErrorMessage(null);
    setForm(INITIAL_FORM);
  }

  if (createdTrain) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
        <Card className="border-border/60 bg-card/90 shadow-panel">
          <CardHeader className="space-y-4">
            <Badge className="w-fit bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">Train linked</Badge>
            <div className="space-y-2">
              <CardTitle className="font-display text-3xl font-bold tracking-tight">
                {createdTrain.label}
              </CardTitle>
              <CardDescription>
                CargoGuardian is now ready to accept telemetry for <strong>{createdTrain.code}</strong>.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoTile label="Train code" value={createdTrain.code} />
              <InfoTile label="Blynk status" value="Linked" />
              <InfoTile
                label="Auth Token"
                value={maskToken(createdTrain.blynkAuthToken)}
                actionLabel="Copy token"
                onAction={() => {
                  if (createdTrain.blynkAuthToken) {
                    void copyValue(createdTrain.blynkAuthToken, "Auth Token");
                  }
                }}
              />
              <InfoTile
                label="Blynk device id"
                value={createdTrain.blynkDeviceId ?? "Saved later"}
              />
            </div>

            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Next steps</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Keep the Blynk device name exactly the same as the train code.</p>
                <p>Flash the same Auth Token into the ESP32 firmware so Blynk telemetry lands on this train.</p>
                <p>
                  If this is your demo device, keep one demo train only, for example <strong>CG-DEMO-01</strong>.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Link href={`/fleet/${createdTrain.id}` as Route} className={buttonVariants()}>
                Open train
              </Link>
              <Button type="button" variant="outline" onClick={resetForm}>
                Add another train
              </Button>
            </div>
          </CardContent>
        </Card>

        <WorkflowCard code={createdTrain.code} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
      <Card className="border-border/60 bg-card/90 shadow-panel">
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            Manual Blynk linking
          </Badge>
          <div className="space-y-2">
            <CardTitle className="font-display text-3xl font-bold tracking-tight">Add a train</CardTitle>
            <CardDescription>
              Create the Blynk device first, then paste its Auth Token here. CargoGuardian uses the train code to match webhook telemetry.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Before you save</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Create the device from the <strong>CargoGuardian ESP32</strong> template in Blynk Console.</p>
              <p>Set the Blynk device name exactly equal to the train code you enter below.</p>
              <p>Paste that same device Auth Token here and later flash it into the ESP32.</p>
            </AlertDescription>
          </Alert>

          <form onSubmit={onSubmit} className="space-y-6">
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Train code"
                  hint="This must match the Blynk device name exactly."
                  required
                >
                  <Input
                    name="code"
                    placeholder="CG-DEMO-01"
                    value={form.code}
                    onChange={(event) => updateField("code", event.target.value.toUpperCase())}
                    required
                  />
                </Field>
                <Field label="Train name" hint="Operator-facing label shown in the dashboard." required>
                  <Input
                    name="label"
                    placeholder="Demo cargo train"
                    value={form.label}
                    onChange={(event) => updateField("label", event.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Expected Blynk device name</p>
                    <p className="text-xs text-muted-foreground">
                      Use this exact name in Blynk so webhook telemetry reaches the correct train.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg bg-background px-3 py-2 text-sm font-semibold text-foreground">
                      {normalizedCode || "CG-DEMO-01"}
                    </code>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        void copyValue(normalizedCode || "CG-DEMO-01", "Train code");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Blynk Auth Token" hint="Copy this from Blynk Device Info." required>
                  <Input
                    name="blynkAuthToken"
                    placeholder="Paste the device Auth Token"
                    value={form.blynkAuthToken}
                    onChange={(event) => updateField("blynkAuthToken", event.target.value)}
                    required
                  />
                </Field>
                <Field
                  label="Blynk device id"
                  hint="Optional. Save it if you want a direct Blynk reference."
                >
                  <Input
                    name="blynkDeviceId"
                    placeholder="Optional device id"
                    value={form.blynkDeviceId}
                    onChange={(event) => updateField("blynkDeviceId", event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 rounded-[1.5rem] border border-border/60 bg-background/40 p-5">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold tracking-tight">Core train details</h2>
                <p className="text-sm text-muted-foreground">
                  These are the minimum operational details you should keep on every train.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Cargo type" required>
                  <select
                    name="cargoType"
                    value={form.cargoType}
                    onChange={(event) => updateField("cargoType", event.target.value as CargoType)}
                    className={inputLikeClassName}
                  >
                    {CARGO_TYPE_VALUES.map((cargoType) => (
                      <option key={cargoType} value={cargoType}>
                        {cargoTypeLabels[cargoType]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Car count" required>
                  <Input
                    name="carCount"
                    type="number"
                    min={1}
                    max={300}
                    value={form.carCount}
                    onChange={(event) => updateField("carCount", event.target.value)}
                    required
                  />
                </Field>
              </div>
            </section>

            <section className="space-y-4 rounded-[1.5rem] border border-border/60 bg-background/40 p-5">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-bold tracking-tight">Optional details</h2>
                <p className="text-sm text-muted-foreground">
                  Add these now if you have them. You can leave them blank during the hackathon.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Origin">
                  <Input
                    name="origin"
                    placeholder="Mumbai"
                    value={form.origin}
                    onChange={(event) => updateField("origin", event.target.value)}
                  />
                </Field>
                <Field label="Destination">
                  <Input
                    name="destination"
                    placeholder="Delhi"
                    value={form.destination}
                    onChange={(event) => updateField("destination", event.target.value)}
                  />
                </Field>
                <Field label="Max speed" hint="km/h">
                  <Input
                    name="maxSpeed"
                    type="number"
                    min={0}
                    max={500}
                    placeholder="90"
                    value={form.maxSpeed}
                    onChange={(event) => updateField("maxSpeed", event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Notes">
                <textarea
                  name="description"
                  rows={4}
                  maxLength={500}
                  className={cn(inputLikeClassName, "h-auto resize-y py-3")}
                  placeholder="Optional train notes, route context, or operator instructions."
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </Field>
            </section>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Could not save train</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={createTrainMutation.isPending}>
                {createTrainMutation.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving train...
                  </>
                ) : (
                  "Save train"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={createTrainMutation.isPending}>
                Clear form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <WorkflowCard code={normalizedCode || "CG-DEMO-01"} />
    </div>
  );
}

function WorkflowCard({ code }: { code: string }) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-3">
        <Badge variant="outline" className="w-fit">
          Step-by-step
        </Badge>
        <div className="space-y-2">
          <CardTitle className="font-display text-2xl font-bold tracking-tight">Blynk setup</CardTitle>
          <CardDescription>
            Keep the train creation flow simple: one device in Blynk, one train in CargoGuardian, one matching code.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <WorkflowStep
          icon={Radio}
          title="1. Create the Blynk device"
          description="Use the CargoGuardian ESP32 template in Blynk Console."
        />
        <WorkflowStep
          icon={CheckCircle2}
          title="2. Match the device name"
          description={`Name the Blynk device ${code}. CargoGuardian uses that exact code to place telemetry.`}
        />
        <WorkflowStep
          icon={ShieldCheck}
          title="3. Reuse the same token"
          description="Paste the Auth Token here, then flash that same token into the ESP32 firmware."
        />

        <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <p className="text-sm font-semibold text-foreground">Hackathon recommendation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep one dedicated demo train, for example <strong>CG-DEMO-01</strong>, so demo mode never touches your real train.
          </p>
        </div>

        <a
          href="https://blynk.cloud/dashboard/templates"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Open Blynk Console
          <ExternalLink className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}

function WorkflowStep({
  icon: Icon,
  title,
  description
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {required ? <span className="text-xs font-medium uppercase tracking-wide text-secondary">Required</span> : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </label>
  );
}

function InfoTile({
  label,
  value,
  actionLabel,
  onAction
}: {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="break-all text-sm font-semibold text-foreground">{value}</p>
        {actionLabel && onAction ? (
          <Button type="button" variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function maskToken(token: string | null): string {
  if (!token) {
    return "Not saved";
  }

  if (token.length <= 10) {
    return token;
  }

  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

const inputLikeClassName =
  "flex h-10 w-full rounded-xl border border-input bg-surface-low px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";
