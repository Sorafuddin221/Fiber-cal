'use client';

import React from 'react';
import { useFiberSettings, FiberSetting } from '../lib/useFiberSettings';
import styles from './Settings.module.css';

const Settings: React.FC = () => {
  const { fiberSettings, loading, addFiber, updateFiber, removeFiber } = useFiberSettings();

  const handleInputChange = (id: number, field: keyof Omit<FiberSetting, 'id'>, value: string) => {
    if (field === 'name') {
      updateFiber(id, field, value);
    } else {
      // For number fields, allow empty string but store as number if valid
      const numValue = value === '' ? '' : parseFloat(value);
      if (value === '' || !isNaN(numValue)) {
        updateFiber(id, field, numValue);
      }
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Fiber Settings</h2>
      <p className="mb-4 text-muted-foreground">
        Define your master list of fibers and their moisture regain values for different standards.
        This list will be used to auto-populate moisture fields in the calculators.
      </p>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fiber Name</th>
              <th>ISO (%)</th>
              <th>AATCC (%)</th>
              <th>EU (%)</th>
              <th>Canada (%)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {fiberSettings.map((fiber) => (
              <tr key={fiber.id}>
                <td>
                  <input
                    type="text"
                    value={fiber.name}
                    onChange={(e) => handleInputChange(fiber.id, 'name', e.target.value)}
                    className={styles.input}
                    placeholder="e.g., Cotton"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fiber.iso}
                    onChange={(e) => handleInputChange(fiber.id, 'iso', e.target.value)}
                    className={styles.input}
                    placeholder="e.g., 8.5000"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fiber.aatcc}
                    onChange={(e) => handleInputChange(fiber.id, 'aatcc', e.target.value)}
                    className={styles.input}
                     placeholder="e.g., 8.5000"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fiber.eu}
                    onChange={(e) => handleInputChange(fiber.id, 'eu', e.target.value)}
                    className={styles.input}
                     placeholder="e.g., 8.5000"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={fiber.canada}
                    onChange={(e) => handleInputChange(fiber.id, 'canada', e.target.value)}
                    className={styles.input}
                     placeholder="e.g., 8.5000"
                  />
                </td>
                <td>
                  <button
                    onClick={() => removeFiber(fiber.id)}
                    className={`${styles.button} ${styles.buttonDestructive}`}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addFiber} className={`${styles.button} ${styles.buttonAdd}`}>
        + Add Fiber
      </button>
    </div>
  );
};

export default Settings;
