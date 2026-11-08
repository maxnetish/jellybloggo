'use client';

import { Modal, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { deleteUser } from '@/lib/api/auth/client';
import type { UserResponse } from '@/lib/api/user/dto';

interface DeleteUserModalProps {
  user: UserResponse | null;
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserModal({ user, opened, onClose, onSuccess }: DeleteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      await deleteUser(user.login);
      notifications.show({
        title: 'Success',
        message: `User "${user.login}" has been deleted`,
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 5000,
      });
      onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to delete user',
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userTitle = user?.full_name || user?.login || '';

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={500}>Delete User</Text>}
      withCloseButton={false}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      centered
    >
      <Text size="sm" mb="lg">
        Are you sure you want to permanently delete user{' '}
        <Text component="span" fw={600}>
          {userTitle}
        </Text>
        ? This action cannot be undone.
      </Text>

      <Group justify="flex-end" gap="sm">
        <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button color="red" onClick={handleDelete} loading={isSubmitting}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}