'use client';

import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { generateGarmentsAnalysisDoc } from '../lib/doc-generator';
import styles from './GarmentsAnalysis.module.css';
import { FiberSetting } from '../lib/useFiberSettings';

interface Props {
  fiberSettings: FiberSetting[];
}

// --- TYPE DEFINITIONS ---
interface Fiber {
  id: number;
  name: string;
  percentage: number | '';
}

interface GarmentComponent {
  id: number;
  name: string;
  weight: number | '';
  fibers: Fiber[];
}

interface FinalResult {
  fiberName: string;
  totalWeight: number;
  overallPercentage: number;
}


// --- COMPONENT ---
const GarmentsAnalysis: React.FC<Props> = ({ fiberSettings }) => {
  // --- STATE ---
  const [numberOfSamples, setNumberOfSamples] = useState(1);
  const [components, setComponents] = useState<GarmentComponent[][]>(() =>
    Array(1).fill(null).map(() => [
      {
        id: 1,
        name: '',
        weight: '',
        fibers: [{ id: 1, name: '', percentage: '' }],
      },
    ])
  );
  const [sampleResults, setSampleResults] = useState<FinalResult[][]>([]);
  const [averageResults, setAverageResults] = useState<FinalResult[]>([]);
  const [averageWithMoisture, setAverageWithMoisture] = useState<FinalResult[]>([]);
  const [averageWithoutMoisture, setAverageWithoutMoisture] = useState<FinalResult[]>([]);

  useEffect(() => {
    setComponents(prev => {
      const newArr = [...prev];
      while (newArr.length < numberOfSamples) {
        newArr.push([
          {
            id: Date.now(),
            name: '',
            weight: '',
            fibers: [{ id: Date.now() + 1, name: '', percentage: '' }],
          },
        ]);
      }
      return newArr.slice(0, numberOfSamples);
    });
  }, [numberOfSamples]);

  // --- HANDLERS for Components ---
  const addComponent = (sampleIndex: number) => {
    setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return [
            ...sample,
            {
              id: Date.now(),
              name: '',
              weight: '',
              fibers: [{ id: Date.now() + 1, name: '', percentage: '' }],
            },
          ];
        }
        return sample;
      })
    );
  };

  const removeComponent = (sampleIndex: number, componentId: number) => {
    setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return sample.filter((c) => c.id !== componentId);
        }
        return sample;
      })
    );
  };

  const handleComponentChange = (sampleIndex: number, id: number, field: 'name' | 'weight', value: string | number) => {
    setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return sample.map((c) => (c.id === id ? { ...c, [field]: value } : c));
        }
        return sample;
      })
    );
  };


  // --- HANDLERS for Fibers within a Component ---
  const addFiberToComponent = (sampleIndex: number, componentId: number) => {
    setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return sample.map((c) => {
            if (c.id === componentId) {
              const newFiber: Fiber = { id: Date.now(), name: '', percentage: '' };
              return { ...c, fibers: [...c.fibers, newFiber] };
            }
            return c;
          });
        }
        return sample;
      })
    );
  };

  const removeFiberFromComponent = (sampleIndex: number, componentId: number, fiberId: number) => {
     setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return sample.map((c) => {
            if (c.id === componentId) {
              return { ...c, fibers: c.fibers.filter(f => f.id !== fiberId) };
            }
            return c;
          });
        }
        return sample;
      })
    );
  };

  const handleFiberChange = (sampleIndex: number, componentId: number, fiberId: number, field: 'name' | 'percentage', value: string | number) => {
     setComponents((prev) =>
      prev.map((sample, i) => {
        if (i === sampleIndex) {
          return sample.map((c) => {
            if (c.id === componentId) {
              const updatedFibers = c.fibers.map(f =>
                f.id === fiberId ? { ...f, [field]: value } : f
              );
              return { ...c, fibers: updatedFibers };
            }
            return c;
          });
        }
        return sample;
      })
    );
  };


  // --- CALCULATION ---
  const calculateOverallComposition = () => {
    const allSamplesResults: FinalResult[][] = [];

    for (let i = 0; i < numberOfSamples; i++) {
      const sampleComponents = components[i];

      for (const c of sampleComponents) {
        if (!c.name || Number(c.weight) <= 0) {
          alert(`Sample ${i + 1}: Please provide a valid name and weight for all components.`);
          return;
        }
        const fiberSum = c.fibers.reduce((sum, f) => sum + Number(f.percentage), 0);
        if (Math.abs(fiberSum - 100) > 0.1) {
          alert(`Sample ${i + 1}: The fiber percentages for component "${c.name}" do not add up to 100.`);
          return;
        }
      }

      const totalGarmentWeight = sampleComponents.reduce((sum, c) => sum + Number(c.weight), 0);
      if (totalGarmentWeight <= 0) {
        alert(`Sample ${i + 1}: Total garment weight is zero. Nothing to calculate.`);
        return;
      }
      
      const fiberTotals: { [key: string]: number } = {};

      sampleComponents.forEach(c => {
        const componentWeight = Number(c.weight);
        c.fibers.forEach(f => {
          const fiberWeightInComponent = componentWeight * (Number(f.percentage) / 100);
          if (f.name) {
            fiberTotals[f.name] = (fiberTotals[f.name] || 0) + fiberWeightInComponent;
          }
        });
      });

      const finalResultsForSample: FinalResult[] = Object.entries(fiberTotals).map(([fiberName, totalWeight]) => ({
        fiberName,
        totalWeight,
        overallPercentage: (totalWeight / totalGarmentWeight) * 100,
      }));
      
      allSamplesResults.push(finalResultsForSample);
    }
    setSampleResults(allSamplesResults);

    const aggregatedResults: { [key: string]: { totalWeight: number[], overallPercentage: number[], count: number } } = {};
    allSamplesResults.forEach(sampleResults => {
      sampleResults.forEach(result => {
        if (!aggregatedResults[result.fiberName]) {
          aggregatedResults[result.fiberName] = { totalWeight: [], overallPercentage: [], count: 0 };
        }
        aggregatedResults[result.fiberName].totalWeight.push(result.totalWeight);
        aggregatedResults[result.fiberName].overallPercentage.push(result.overallPercentage);
        aggregatedResults[result.fiberName].count++;
      });
    });

    const finalAverageResults: FinalResult[] = Object.entries(aggregatedResults).map(([fiberName, data]) => {
      const avgTotalWeight = data.totalWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgOverallPercentage = data.overallPercentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        fiberName,
        totalWeight: avgTotalWeight,
        overallPercentage: avgOverallPercentage,
      };
    });
    
    setAverageResults(finalAverageResults);
    setAverageWithMoisture(finalAverageResults);
    setAverageWithoutMoisture(finalAverageResults);
  };

  const handleDownloadReport = async () => {
    if (sampleResults.length > 0) {
      const docBlob = await generateGarmentsAnalysisDoc(sampleResults, averageResults);
      saveAs(docBlob, 'GarmentsAnalysisReport.docx');
    }
  };

  const fiberDatalistId = 'fiber-names-garments';

  // --- RENDER ---
  return (
    <div className={styles.container}>
      <datalist id={fiberDatalistId}>
        {fiberSettings.map(f => <option key={f.id} value={f.name} />)}
      </datalist>

      <h2 className={styles.title}>Garments Analysis</h2>

      <div className={styles.inputGroup}>
        <label htmlFor="numberOfSamples" className={styles.label}>
          Number of Samples
        </label>
        <input
          type="number"
          id="numberOfSamples"
          value={numberOfSamples}
          onChange={(e) => setNumberOfSamples(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className={styles.input}
          min="1"
        />
      </div>

      {components.map((sample, sampleIndex) => (
        <div key={sampleIndex} className={styles.sampleContainer}>
          <h3 className={styles.sampleTitle}>Sample {sampleIndex + 1}</h3>
          <div className={styles.componentsContainer}>
            {sample.map((component, compIndex) => (
              <div key={component.id} className={styles.component}>
                <h3 className={styles.componentTitle}>Component {compIndex + 1}</h3>
                <div className={styles.grid}>
                  <input
                    type="text"
                    placeholder="Component Name (e.g., Body)"
                    value={component.name}
                    onChange={(e) => handleComponentChange(sampleIndex, component.id, 'name', e.target.value)}
                    className={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Component Weight (g)"
                    value={component.weight}
                    onChange={(e) => handleComponentChange(sampleIndex, component.id, 'weight', e.target.value === '' ? '' : Number(e.target.value))}
                    className={styles.input}
                  />
                  <button onClick={() => removeComponent(sampleIndex, component.id)} className={`${styles.button} ${styles.buttonDestructive}`}>
                    Remove Component
                  </button>
                </div>

                <div className={styles.fiberSection}>
                  <h4 className={styles.fiberTitle}>Fibers in this Component</h4>
                  {component.fibers.map(fiber => (
                    <div key={fiber.id} className={styles.fiberRow}>
                      <input
                        type="text"
                        list={fiberDatalistId}
                        placeholder="Fiber Name (e.g., Cotton)"
                        value={fiber.name}
                        onChange={(e) => handleFiberChange(sampleIndex, component.id, fiber.id, 'name', e.target.value)}
                        className={`${styles.input} ${styles.fiberInput}`}
                      />
                      <input
                        type="number"
                        placeholder="Percentage (%)"
                        value={fiber.percentage}
                        onChange={(e) => handleFiberChange(sampleIndex, component.id, fiber.id, 'percentage', e.target.value === '' ? '' : Number(e.target.value))}
                        className={`${styles.input} ${styles.percentageInput}`}
                      />
                      <button onClick={() => removeFiberFromComponent(sampleIndex, component.id, fiber.id)} className={styles.buttonRemoveFiber}>
                        X
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addFiberToComponent(sampleIndex, component.id)} className={styles.buttonAddFiber}>
                    + Add Fiber
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => addComponent(sampleIndex)} className={`${styles.button} ${styles.buttonSecondary}`}>
              + Add New Component
            </button>
          </div>
        </div>
      ))}
      
      <div className={styles.buttonGroup}>
        <button onClick={calculateOverallComposition} className={`${styles.button} ${styles.buttonPrimary}`}>
          Calculate Overall Average Composition
        </button>
        {results.length > 0 && (
          <button
            onClick={handleDownloadReport}
            className={`${styles.button} ${styles.buttonAccent}`}
          >
            Download Report (.docx)
          </button>
        )}
      </div>

      {sampleResults.length > 0 && (
        <div className={styles.tableContainer}>
          <h3 className={styles.sectionTitle}>Sample-by-Sample Results</h3>
          {sampleResults.map((sample, index) => (
            <div key={index} className={styles.tableWrapper}>
              <h4 className={styles.sampleTitle}>Sample {index + 1}</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fiber Name</th>
                    <th>Total Weight (g)</th>
                    <th>Overall Percentage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((result, rIndex) => (
                    <tr key={rIndex}>
                      <td>{result.fiberName}</td>
                      <td>{result.totalWeight.toFixed(4)}</td>
                      <td>{result.overallPercentage.toFixed(4)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <h3 className={styles.sectionTitle}>Average Overall Garment Composition</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fiber Name</th>
                  <th>Avg. Total Weight (g)</th>
                  <th>Avg. Overall Percentage (%)</th>
                </tr>
              </thead>
              <tbody>
                {averageResults.map((result, index) => (
                  <tr key={index}>
                    <td>{result.fiberName}</td>
                    <td>{result.totalWeight.toFixed(4)}</td>
                    <td>{result.overallPercentage.toFixed(4)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={1} style={{textAlign: 'right'}}>Totals:</td>
                  <td>{averageResults.reduce((sum, r) => sum + r.totalWeight, 0).toFixed(4)}</td>
                  <td>{averageResults.reduce((sum, r) => sum + r.overallPercentage, 0).toFixed(4)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GarmentsAnalysis;