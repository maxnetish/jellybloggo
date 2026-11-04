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
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api/auth";
import { applyDtoToProfileForm, profileFormToUpdateDto, useProfileForm } from '@/components/profile/ProfileForm.form';

interface ProfileFormProps {
  /** Callback when profile is successfully updated */
  onSuccess?: () => void;
}

export function ProfileForm({ onSuccess }: ProfileFormProps) {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const form = useProfileForm();

  // Populate form with user data when available
  useEffect(() => {
    applyDtoToProfileForm({
      form,
      dto: user,
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // form is stable reference from useForm

  const handleSubmit = form.onSubmit(async (values) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Convert to API format
      const data = profileFormToUpdateDto({
        formValue: values,
      });

        const updatedUser = await updateProfile(data);
        // Update AuthProvider with new user data
        updateUser({
          ...user,
          ...updatedUser,
        });
        form.resetDirty();
        setShowSaved(true);
        onSuccess?.();
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
            disabled={!form.isDirty()}
            variant={showSaved ? 'filled' : 'primary'}
          >
            Save
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}