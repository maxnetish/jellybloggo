'use client';

import { Modal, MultiSelect, Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { UserRole } from '@/lib/api/user/dto';
import { updateUserRoles } from '@/lib/api/auth/client';
import type { UserResponse } from '@/lib/api/user/dto';

interface EditRolesModalProps {
  user: UserResponse;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.AUTHOR, label: 'Author' },
  { value: UserRole.READER, label: 'Reader' },
];

export function EditRolesModal({ user, opened, onClose, onSuccess }: EditRolesModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...user.roles]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    // Reset to original roles when closing without saving
    setSelectedRoles([...user.roles]);
    onClose();
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      await updateUserRoles(user.login, selectedRoles);
      notifications.show({
        title: 'Success',
        message: 'Roles updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 5000,
      });
      onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update roles',
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = user.full_name || user.login;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={500}>{title}</Text>}
      withCloseButton={false}
      closeOnClickOutside={true}
      closeOnEscape={true}
      centered
    >
      <Stack gap="md">
        <MultiSelect
          label="Roles"
          data={ROLE_OPTIONS}
          value={selectedRoles}
          onChange={setSelectedRoles}
          clearable={false}
          placeholder="Select roles"
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSubmitting}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}