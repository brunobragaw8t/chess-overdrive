import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { type SubmitEvent, useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { NAME_MAX_LENGTH } from "../../../convex/users";
import { AppHeader } from "../../components/app-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDivider } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { MonoLabel } from "../../components/ui/mono-label";

export const Route = createFileRoute("/_authenticated/profile")({
  component: RootComponent,
});

function RootComponent() {
  const user = useQuery(api.users.getCurrentUser);

  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !isEditing) {
      setName(user.name);
    }
  }, [user?.name, isEditing]);

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();

    setError(null);
    setIsSaving(true);

    try {
      await updateProfile({ name });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setName(user?.name ?? "");
    setError(null);
    setIsEditing(false);
  }

  if (user === undefined) {
    return <LoadingSpinner label="LOADING_PROFILE" />;
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-240 px-8 py-16">
        <MonoLabel size="md" tone="muted" tracking="wider">
          // PROFILE
        </MonoLabel>

        <Card className="animate-stamp mt-6">
          <CardContent>
            <MonoLabel tone="muted" tracking="wider">
              DISPLAY NAME
            </MonoLabel>

            {!isEditing ? (
              <div className="mt-3 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold tracking-wide text-white uppercase">
                  {user?.name ?? "Player"}
                </h2>

                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  EDIT
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSave(e)} className="mt-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX_LENGTH}
                  className="border-border-hard bg-bg font-display focus:border-accent w-full border-2 px-4 py-3 text-xl font-bold tracking-wide text-white uppercase outline-none"
                  autoFocus
                />

                <div className="mt-2 flex items-center justify-between">
                  <MonoLabel size="xs" tone="dim">
                    {name.trim().length}/{NAME_MAX_LENGTH}
                  </MonoLabel>

                  {error && (
                    <MonoLabel size="xs" tone="muted" className="text-danger">
                      {error}
                    </MonoLabel>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <Button type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? "SAVING..." : "SAVE"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    CANCEL
                  </Button>
                </div>
              </form>
            )}

            <CardDivider className="my-6" />

            <MonoLabel tone="muted" tracking="wider">
              EMAIL
            </MonoLabel>

            <p className="text-text-muted mt-3 font-mono text-sm">{user?.email ?? "No email"}</p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
