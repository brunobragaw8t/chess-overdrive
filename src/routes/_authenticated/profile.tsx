import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { type SubmitEvent, useEffect, useRef, useState } from "react";
import { FiUpload } from "react-icons/fi";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AppHeader } from "../../components/app-header";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDivider } from "../../components/ui/card";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { MonoLabel } from "../../components/ui/mono-label";
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE, NAME_MAX_LENGTH } from "../../constants/users";

export const Route = createFileRoute("/_authenticated/profile")({
  component: RootComponent,
});

function useAvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.users.saveAvatar);

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Invalid format. Use PNG, JPEG, WebP, or GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File exceeds 4 MB limit.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };
      await saveAvatar({ storageId });
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, inputRef, handleSelect };
}

function useNameEditor(currentName: string | undefined) {
  const [name, setName] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useMutation(api.users.updateProfile);

  useEffect(() => {
    if (currentName && !isEditing) {
      setName(currentName);
    }
  }, [currentName, isEditing]);

  async function handleSave(e: SubmitEvent) {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      await updateProfile({ name });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    setName(currentName ?? "");
    setError(null);
    setIsEditing(false);
  }

  return {
    name,
    setName,
    isEditing,
    setIsEditing,
    isLoading,
    error,
    handleSave,
    handleCancel,
  };
}

function RootComponent() {
  const user = useQuery(api.users.getCurrentUser);

  const avatar = useAvatarUpload();
  const nameEditor = useNameEditor(user?.name);

  if (user === undefined) {
    return <LoadingSpinner label="LOADING_PROFILE" />;
  }

  const avatarUrl = user?.avatarUrl ?? null;

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
              AVATAR
            </MonoLabel>

            <div className="mt-4 flex items-center gap-6">
              <div className="group relative">
                <div className="border-border-hard bg-bg relative h-24 w-24 overflow-hidden border-[3px]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="bg-bg-inset flex h-full w-full items-center justify-center">
                      <span className="font-display text-text-dim text-3xl font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}

                  {!avatar.isLoading && (
                    <button
                      type="button"
                      onClick={() => avatar.inputRef.current?.click()}
                      className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      aria-label="Change avatar"
                    >
                      <FiUpload size={24} />
                    </button>
                  )}

                  {avatar.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="border-accent h-5 w-5 animate-spin border-2 border-t-transparent" />
                    </div>
                  )}
                </div>

                <div className="border-accent absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2" />
                <div className="border-accent absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2" />
                <div className="border-accent absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2" />
                <div className="border-accent absolute -right-1 -bottom-1 h-2 w-2 border-r-2 border-b-2" />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => avatar.inputRef.current?.click()}
                  disabled={avatar.isLoading}
                >
                  {avatar.isLoading ? "UPLOADING..." : "UPLOAD AVATAR"}
                </Button>

                <MonoLabel size="xs" tone="dim">
                  PNG, JPEG, WebP, GIF - Max 4 MB
                </MonoLabel>

                {avatar.error && (
                  <MonoLabel size="xs" tone="muted" className="text-danger">
                    {avatar.error}
                  </MonoLabel>
                )}
              </div>

              <input
                ref={avatar.inputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={(e) => void avatar.handleSelect(e)}
                className="hidden"
                aria-hidden="true"
              />
            </div>

            <CardDivider className="my-6" />

            <MonoLabel tone="muted" tracking="wider">
              DISPLAY NAME
            </MonoLabel>

            {!nameEditor.isEditing ? (
              <div className="mt-3 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                  {user?.name ?? "Player"}
                </h2>

                <Button variant="ghost" size="sm" onClick={() => nameEditor.setIsEditing(true)}>
                  EDIT
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => void nameEditor.handleSave(e)} className="mt-3">
                <input
                  type="text"
                  value={nameEditor.name}
                  onChange={(e) => nameEditor.setName(e.target.value)}
                  maxLength={NAME_MAX_LENGTH}
                  className="border-border-hard bg-bg font-display focus:border-accent w-full border-2 px-4 py-3 text-xl font-bold tracking-wide text-white outline-none"
                  autoFocus
                />

                <div className="mt-2 flex items-center justify-between">
                  <MonoLabel size="xs" tone="dim">
                    {nameEditor.name.trim().length}/{NAME_MAX_LENGTH}
                  </MonoLabel>

                  {nameEditor.error && (
                    <MonoLabel size="xs" tone="muted" className="text-danger">
                      {nameEditor.error}
                    </MonoLabel>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <Button type="submit" size="sm" disabled={nameEditor.isLoading}>
                    {nameEditor.isLoading ? "SAVING..." : "SAVE"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={nameEditor.handleCancel}
                    disabled={nameEditor.isLoading}
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
