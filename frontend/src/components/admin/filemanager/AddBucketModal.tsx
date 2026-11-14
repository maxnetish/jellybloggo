'use client';

import { Modal, Button, Group, Text, TextInput, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { S3Client } from '@bradenmacdonald/s3-lite-client';
import { createS3Config } from '@/lib/api/storage/s3-configs';
import type { CreateS3ConfigRequest } from '@/lib/api/storage/s3-configs/dto';

interface AddBucketModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBucketModal({ opened, onClose, onSuccess }: AddBucketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateS3ConfigRequest>({
    initialValues: {
      config_name: '',
      s3_access_key: '',
      s3_access_secret: '',
      s3_endpoint: '',
      s3_region: '',
      s3_bucket: '',
      s3_public_end_point: '',
    },
    validate: {
      config_name: (value) => {
        if (!value.trim()) return 'Name is required';
        if (value.length > 100) return 'Name must be 100 characters or less';
        return null;
      },
      s3_bucket: (value) => {
        if (!value.trim()) return 'Bucket name is required';
        // URL slug validation: lowercase, numbers, hyphens, dots
        if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(value)) {
          return 'Invalid bucket name format';
        }
        return null;
      },
      s3_access_key: (value) => (!value.trim() ? 'Access key is required' : null),
      s3_access_secret: (value) => (!value.trim() ? 'Secret key is required' : null),
      s3_public_end_point: (value) => {
        if (!value.trim()) return 'Public endpoint is required';
        try {
          new URL(value);
        } catch {
          return 'Invalid URL format';
        }
        return null;
      },
    },
  });

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const handleSubmit = async (values: CreateS3ConfigRequest) => {
    setIsSubmitting(true);

    try {
      // Create S3 client with provided credentials
      const clientOptions: {
        endPoint: string;
        region: string;
        bucket: string;
        accessKey: string;
        secretKey: string;
      } = {
        endPoint: values.s3_endpoint || 's3.amazonaws.com',
        region: values.s3_region || 'us-east-1',
        bucket: values.s3_bucket,
        accessKey: values.s3_access_key,
        secretKey: values.s3_access_secret,
      };

      const client = new S3Client(clientOptions);

      // Check if bucket exists
      let bucketExists = false;
      
      try {
        bucketExists = await client.bucketExists(values.s3_bucket);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(message);
      }

      // Create bucket if it doesn't exist
      if (!bucketExists) {
        try {
          await client.makeBucket(values.s3_bucket);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          // BucketAlreadyOwnedByYou is ok - another request created it
          if (message.includes('BucketAlreadyOwnedByYou') || message.includes('bucket already exists')) {
            bucketExists = true;
          } else {
            throw new Error(message);
          }
        }
      }

      // Save config to server
      await createS3Config(values);

      notifications.show({
        title: 'Success',
        message: bucketExists
          ? `Bucket "${values.s3_bucket}" connected successfully`
          : `Bucket "${values.s3_bucket}" created and saved`,
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 5000,
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to add bucket',
        color: 'red',
        icon: <IconX size={16} />,
        autoClose: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={500}>Add Bucket</Text>}
      withCloseButton={false}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label="Name"
            description="Display name for this bucket config"
            placeholder="My Photos Bucket"
            required
            {...form.getInputProps('config_name')}
          />

          <TextInput
            label="Bucket"
            description="S3 bucket name"
            placeholder="my-photos-bucket"
            required
            {...form.getInputProps('s3_bucket')}
          />

          <TextInput
            label="Endpoint"
            description="S3 endpoint URL (optional, defaults to AWS S3)"
            placeholder="https://s3.amazonaws.com"
            {...form.getInputProps('s3_endpoint')}
          />

          <TextInput
            label="Region"
            description="S3 region (optional, defaults to us-east-1)"
            placeholder="us-east-1"
            {...form.getInputProps('s3_region')}
          />

          <TextInput
            label="Access Key"
            placeholder="AKIAIOSFODNN7EXAMPLE"
            required
            {...form.getInputProps('s3_access_key')}
          />

          <TextInput
            label="Secret Key"
            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            required
            type="password"
            {...form.getInputProps('s3_access_secret')}
          />

          <TextInput
            label="Public Endpoint"
            description="URL prefix for public file access"
            placeholder="https://cdn.example.com"
            required
            {...form.getInputProps('s3_public_end_point')}
          />
        </Stack>

        <Group justify="flex-end" gap="sm" mt="lg">
          <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
