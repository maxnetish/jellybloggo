import { UseFormReturnType } from '@mantine/form';
import { useEffect, useRef, useState } from 'react';

// Толком не тестировал
export function useFormDirtyDebounced<T>({form, delay = 500}: {
  form: UseFormReturnType<T>,
  delay?: number,
}) {
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Берем текущий снимок значений формы
  const currentValues = form.getValues();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsDirty(form.isDirty());
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentValues, delay, form]); // Реагирует на любое изменение структуры данных

  return isDirty;
}