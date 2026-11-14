import type { CreateS3ConfigRequest, S3ConfigResponse, UpdateS3ConfigRequest } from './dto';

const BASE_URL = '/api/s3-configs';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function listS3Configs(): Promise<S3ConfigResponse[]> {
  return fetchWithAuth(BASE_URL);
}

export async function getS3Config(id: string): Promise<S3ConfigResponse> {
  return fetchWithAuth(`${BASE_URL}/${id}`);
}

export async function createS3Config(
  data: CreateS3ConfigRequest
): Promise<S3ConfigResponse> {
  return fetchWithAuth(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateS3Config(
  id: string,
  data: UpdateS3ConfigRequest
): Promise<S3ConfigResponse> {
  return fetchWithAuth(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteS3Config(id: string): Promise<void> {
  await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
}
