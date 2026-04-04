"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateTrain } from "@/features/trains/hooks/useCreateTrain";
import { CARGO_TYPE_VALUES, cargoTypeLabels, type CargoType, type CreateTrainInput } from "@/types/train";

export function AddTrainForm() {
  const router = useRouter();
  const { createTrain, isCreating, error, reset } = useCreateTrain();

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [cargoType, setCargoType] = useState<CargoType>("general");
  const [carCount, setCarCount] = useState("1");
  const [maxSpeed, setMaxSpeed] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    reset();

    if (!code.trim()) {
      setValidationError("Train code is required.");
      return;
    }
    if (!label.trim()) {
      setValidationError("Train name is required.");
      return;
    }
    if (!carCount || Number(carCount) < 1) {
      setValidationError("At least 1 car is required.");
      return;
    }

    const input: CreateTrainInput = {
      code: code.trim().toUpperCase(),
      label: label.trim(),
      cargoType,
      carCount: Number(carCount),
      maxSpeed: maxSpeed ? Number(maxSpeed) : null,
      origin: origin.trim() || null,
      destination: destination.trim() || null,
      routeId: null,
      description: description.trim() || null
    };

    try {
      const train = await createTrain(input);
      router.push(`/fleet/${train.id}` as Parameters<typeof router.push>[0]);
    } catch {
      // error is surfaced via the mutation state
    }
  };

  const displayError = validationError ?? error?.message ?? null;

  return (
    <Card className="mx-auto max-w-2xl border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Package className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <CardTitle className="font-display text-2xl font-bold">Register a new train</CardTitle>
          <CardDescription>
            Add a train to your fleet. You can pair devices and configure telemetry after registration.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Code + Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Train code" htmlFor="train-code" hint="e.g. CG-1208">
              <Input
                id="train-code"
                placeholder="CG-1208"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={20}
                disabled={isCreating}
              />
            </FieldGroup>
            <FieldGroup label="Train name" htmlFor="train-label">
              <Input
                id="train-label"
                placeholder="Atlantic Freight 12"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={100}
                disabled={isCreating}
              />
            </FieldGroup>
          </div>

          {/* Cargo type + Car count */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Cargo type" htmlFor="cargo-type">
              <select
                id="cargo-type"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value as CargoType)}
                disabled={isCreating}
                className="flex h-10 w-full rounded-xl border border-input bg-surface-low px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {CARGO_TYPE_VALUES.map((type) => (
                  <option key={type} value={type}>
                    {cargoTypeLabels[type]}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Number of cars" htmlFor="car-count">
              <Input
                id="car-count"
                type="number"
                min={1}
                max={300}
                value={carCount}
                onChange={(e) => setCarCount(e.target.value)}
                disabled={isCreating}
              />
            </FieldGroup>
          </div>

          {/* Max speed */}
          <FieldGroup label="Max speed (km/h)" htmlFor="max-speed" hint="Optional">
            <Input
              id="max-speed"
              type="number"
              min={0}
              max={500}
              placeholder="120"
              value={maxSpeed}
              onChange={(e) => setMaxSpeed(e.target.value)}
              disabled={isCreating}
            />
          </FieldGroup>

          {/* Origin + Destination */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Origin" htmlFor="origin" hint="Optional">
              <Input
                id="origin"
                placeholder="Savannah"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                maxLength={120}
                disabled={isCreating}
              />
            </FieldGroup>
            <FieldGroup label="Destination" htmlFor="destination" hint="Optional">
              <Input
                id="destination"
                placeholder="Memphis"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                maxLength={120}
                disabled={isCreating}
              />
            </FieldGroup>
          </div>

          {/* Description */}
          <FieldGroup label="Description" htmlFor="description" hint="Optional — up to 500 characters">
            <textarea
              id="description"
              rows={3}
              placeholder="Primary east-west container corridor service."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              disabled={isCreating}
              className="flex w-full rounded-xl border border-input bg-surface-low px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
          </FieldGroup>

          {/* Error */}
          {displayError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{displayError}</p>
            </div>
          ) : null}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating…" : "Register train"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldGroup({
  label,
  htmlFor,
  hint,
  children
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {hint ? <span className="ml-2 font-normal text-muted-foreground">({hint})</span> : null}
      </label>
      {children}
    </div>
  );
}
