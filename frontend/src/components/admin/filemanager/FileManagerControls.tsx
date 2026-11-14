'use client';

import { Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { AddBucketModal } from './AddBucketModal';

export function FileManagerControls() {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Group mb="md">
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Bucket
        </Button>
      </Group>

      <AddBucketModal
        opened={opened}
        onClose={close}
        onSuccess={() => {}}
      />
    </>
  );
}
