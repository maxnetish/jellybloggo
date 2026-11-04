"use client";

import { useEffect, useState } from "react";
import {
  TextInput,
  Textarea,
  Button,
  Paper,
  Stack,
  Alert,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconAlertCircle } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api/auth";
import type { User } from "@/lib/api/auth/dto";

interface ProfileFormValues {
  full_name: string;
  birth_date: string | null; // YYYY-MM-DD format from DateInput
  location: string;
  about: string;
}

interface ProfileFormProps {
  /** Callback when profile is successfully updated */
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const form = useForm<ProfileFormValues>({
    initialValues: {
      full_name: '',
      birth_date: null,
      location: '',
      about: '',
    },
    onValuesChange: () => {
      // Only reset "Saved!" state when form is actually dirty
      // (not when resetDirty() is called after save)
      if (form.isDirty()) {
        setShowSaved(false);
      }
    },
  });

  // Populate form with user data when available
  useEffect(() => {
    if (user) {
      form.setValues({
        full_name: user.full_name || '',
        birth_date: user.birth_date || null,
        location: user.location || '',
        about: user.about || '',
      });
      // Reset dirty state after populating
      form.resetDirty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // form is stable reference from useForm

  const handleSubmit = form.onSubmit(async (values) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Convert to API format
      const data: Record<string, unknown> = {};
      if (values.full_name !== (user?.full_name || '')) {
        data.full_name = values.full_name || null;
      }
      if (values.birth_date !== user?.birth_date) {
        data.birth_date = values.birth_date || null;
      }
      if (values.location !== (user?.location || '')) {
        data.location = values.location || null;
      }
      if (values.about !== (user?.about || '')) {
        data.about = values.about || null;
      }

      // Only send if there are changes
      if (Object.keys(data).length > 0) {
        const updatedUser = await updateProfile(
          data as Parameters<typeof updateProfile>[0]
        );
        // Update AuthProvider with new user data
        updateUser(updatedUser as User);
        form.resetDirty();
        setShowSaved(true);
        onSuccess?.();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!user) {
    return null;
  }

  return (
    <Paper withBorder shadow="md" p="xl" w={500}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <TextInput
            label="Full name"
            placeholder="Optional full name or nickname"
            maxLength={256}
            {...form.getInputProps('full_name')}
          />

          <DateInput
            label="Date of birth"
            placeholder="Select date"
            maxDate={new Date()}
            valueFormat="YYYY-MM-DD"
            {...form.getInputProps('birth_date')}
          />

          <TextInput
            label="My location"
            placeholder="Where are you? For example, Tatooine"
            maxLength={256}
            {...form.getInputProps('location')}
          />

          <Textarea
            label="About me"
            placeholder="Public information about me. For example, Jedi knight"
            maxLength={4096}
            autosize
            minRows={3}
            maxRows={10}
            {...form.getInputProps('about')}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!form.isDirty() || showSaved}
            variant={showSaved ? 'filled' : 'primary'}
          >
            {showSaved ? 'Saved!' : 'Save'}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}