'use client';

import { useState, useEffect } from 'react';

export interface FiberSetting {
  id: number;
  name: string;
  iso: number | '';
  aatcc: number | '';
  eu: number | '';
  canada: number | '';
}

export type Standard = 'iso' | 'aatcc' | 'eu' | 'canada';

const initialFibers: FiberSetting[] = [
  { id: 1, name: 'Cotton', iso: 8.5, aatcc: 8.5, eu: 8.5, canada: 8.5 },
  { id: 2, name: 'Polyester', iso: 0.4, aatcc: 0.4, eu: 0.4, canada: 0.4 },
  { id: 3, name: 'Nylon', iso: 4.5, aatcc: 4.5, eu: 4.5, canada: 4.5 },
  { id: 4, name: 'Viscose', iso: 13, aatcc: 13, eu: 13, canada: 13 },
  { id: 5, name: 'Wool', iso: 17, aatcc: 17, eu: 17, canada: 17 },
];

const STORAGE_KEY = 'fiberSettings';

export const useFiberSettings = () => {
  const [fiberSettings, setFiberSettings] = useState<FiberSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        setFiberSettings(JSON.parse(storedSettings));
      } else {
        // Initialize with default values if nothing is in storage
        setFiberSettings(initialFibers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFibers));
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      setFiberSettings(initialFibers); // Fallback to initial data
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = (newSettings: FiberSetting[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setFiberSettings(newSettings);
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  };

  const addFiber = () => {
    const newFiber: FiberSetting = {
      id: Date.now(),
      name: '',
      iso: '',
      aatcc: '',
      eu: '',
      canada: '',
    };
    saveSettings([...fiberSettings, newFiber]);
  };

  type FiberSettingUpdatableFields = Omit<FiberSetting, 'id'>;

  const updateFiber = <K extends keyof FiberSettingUpdatableFields>(
    id: number,
    field: K,
    value: FiberSettingUpdatableFields[K]
  ) => {
    const updatedSettings = fiberSettings.map((fiber) =>
      fiber.id === id ? { ...fiber, [field]: value } : fiber
    );
    saveSettings(updatedSettings);
  };

  const removeFiber = (id: number) => {
    const updatedSettings = fiberSettings.filter((fiber) => fiber.id !== id);
    saveSettings(updatedSettings);
  };

  return { fiberSettings, loading, addFiber, updateFiber, removeFiber };
};
