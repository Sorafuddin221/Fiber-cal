'use client';

import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { generateChemicalSeparationDoc } from '../lib/doc-generator';
import styles from './ChemicalSeparation.module.css';
import { FiberSetting, Standard } from '../lib/useFiberSettings';

interface Props {
  fiberSettings: FiberSetting[];
  activeStandard: Standard;
}

// --- Common Types ---
interface FiberResult {
  name: string;
  dryWeight: number;
  dryPercentage: number;
  conditionedPercentage: number;
}

// --- 'By Residue' Mode Types ---
interface SeparationStep {
  id: number;
  residueWeight: number | '';
  dissolvedFiberName: string; 
  dissolvedFiberMoisture: number | ''; 
}

// --- 'By Component' Mode Types ---
interface ComponentFiberInput {
  id: number;
  name: string;
  dryWeight: number | '';
  moistureContent: number | '';
}

const ChemicalSeparation: React.FC<Props> = ({ fiberSettings, activeStandard }) => {
  const [mode, setMode] = useState<'residue' | 'component'>('residue'); // Default to residue as per latest user request
  const [numberOfSamples, setNumberOfSamples] = useState(1);
  
  // --- Common State ---
  const [initialWeight, setInitialWeight] = useState<(number | '')[]>(Array(1).fill(''));
  const [sampleResults, setSampleResults] = useState<FiberResult[][]>([]);
  const [averageResults, setAverageResults] = useState<FiberResult[]>([]);
  const [averageWithMoisture, setAverageWithMoisture] = useState<FiberResult[]>([]);
  const [averageWithoutMoisture, setAverageWithoutMoisture] = useState<FiberResult[]>([]);

  // --- 'By Residue' Mode State ---
  const [steps, setSteps] = useState<SeparationStep[][]>(() => 
    Array(1).fill(null).map(() => [{ id: Date.now(), residueWeight: '', dissolvedFiberName: '', dissolvedFiberMoisture: '' }])
  );

  // --- 'By Component' Mode State ---
  const [componentFibers, setComponentFibers] = useState<ComponentFiberInput[][]>(() =>
    Array(1).fill(null).map(() => [{ id: 1, name: '', dryWeight: '', moistureContent: '' }])
  );

  useEffect(() => {
    const newSize = numberOfSamples;
    setInitialWeight(prev => {
      const newArr = [...prev];
      while (newArr.length < newSize) newArr.push('');
      return newArr.slice(0, newSize);
    });
    setSteps(prev => {
      const newArr = [...prev];
      while (newArr.length < newSize) newArr.push([{ id: Date.now(), residueWeight: '', dissolvedFiberName: '', dissolvedFiberMoisture: '' }]);
      return newArr.slice(0, newSize);
    });
    setComponentFibers(prev => {
      const newArr = [...prev];
      while (newArr.length < newSize) newArr.push([{ id: Date.now(), name: '', dryWeight: '', moistureContent: '' }]);
      return newArr.slice(0, newSize);
    });
  }, [numberOfSamples]);

  // --- 'By Residue' Mode Handlers ---
  const addStep = (sampleIndex: number) => setSteps(prev => prev.map((s, i) => i === sampleIndex ? [...s, { id: Date.now(), residueWeight: '', dissolvedFiberName: '', dissolvedFiberMoisture: '' }] : s));
  const removeStep = (sampleIndex: number, id: number) => setSteps(prev => prev.map((s, i) => i === sampleIndex ? s.filter(step => step.id !== id) : s));
  
  const handleStepChange = (sampleIndex: number, id: number, field: keyof SeparationStep, value: string | number) => {
    let newSteps = steps.map((sample, sIndex) => {
      if (sIndex === sampleIndex) {
        let newSample = sample.map(step => step.id === id ? { ...step, [field]: value } : step);
        if (field === 'dissolvedFiberName') {
          const matchedFiber = fiberSettings.find(f => f.name.toLowerCase() === (value as string).toLowerCase());
          if (matchedFiber) {
            newSample = newSample.map(s => s.id === id ? { ...s, dissolvedFiberMoisture: matchedFiber[activeStandard] } : s);
          }
        }
        return newSample;
      }
      return sample;
    });
    setSteps(newSteps);
  };

  // --- 'By Component' Mode Handlers ---
  const addComponentFiber = (sampleIndex: number) => setComponentFibers(prev => prev.map((c, i) => i === sampleIndex ? [...c, { id: Date.now(), name: '', dryWeight: '', moistureContent: '' }] : c));
  const removeComponentFiber = (sampleIndex: number, id: number) => setComponentFibers(prev => prev.map((c, i) => i === sampleIndex ? c.filter(fiber => fiber.id !== id) : c));

  const handleComponentFiberChange = (sampleIndex: number, id: number, field: keyof ComponentFiberInput, value: string | number) => {
    let newFibers = componentFibers.map((sample, sIndex) => {
      if (sIndex === sampleIndex) {
        let newSample = sample.map(fiber => fiber.id === id ? { ...fiber, [field]: value } : fiber);
        if (field === 'name') {
          const matchedFiber = fiberSettings.find(f => f.name.toLowerCase() === (value as string).toLowerCase());
          if (matchedFiber) {
            newSample = newSample.map(f => f.id === id ? { ...f, moistureContent: matchedFiber[activeStandard] } : f);
          }
        }
        return newSample;
      }
      return sample;
    });
    setComponentFibers(newFibers);
  };

  // --- Calculation Logic ---
  const calculateByResidue = () => {
    const allSamplesResults: FiberResult[][] = [];

    for (let i = 0; i < numberOfSamples; i++) {
      const sampleSteps = steps[i];
      const sampleInitialWeight = Number(initialWeight[i]);

      if (sampleSteps.length === 0) {
        alert(`Sample ${i + 1}: Please add at least one step.`);
        return;
      }
      if (isNaN(sampleInitialWeight) || sampleInitialWeight <= 0) {
        alert(`Sample ${i + 1}: Please enter a valid Initial Dry Sample Weight.`);
        return;
      }

      const calculatedFibers: any[] = [];
      let previousWeightInSequence = sampleInitialWeight;

      // For N fibers, the user provides N-1 residue weights. The Nth fiber's weight is the last residue.
      // The loop calculates the weight of the N-1 dissolved fibers.
      for (let j = 0; j < sampleSteps.length - 1; j++) {
        const currentStep = sampleSteps[j];
        const currentResidueWeight = Number(currentStep.residueWeight);

        if (isNaN(currentResidueWeight) || currentResidueWeight < 0) {
          alert(`Sample ${i + 1}, Step ${j + 1}: Please enter a valid, non-negative Residue Weight.`);
          return;
        }
        if (currentResidueWeight > previousWeightInSequence) {
          alert(`Sample ${i + 1}, Step ${j + 1}: Residue Weight (${currentResidueWeight}g) cannot be greater than the previous residue weight (${previousWeightInSequence.toFixed(4)}g).`);
          return;
        }
        
        const fiberDryWeight = previousWeightInSequence - currentResidueWeight;

        calculatedFibers.push({
            name: currentStep.dissolvedFiberName || `Fiber from Step ${j + 1}`,
            dryWeight: fiberDryWeight,
            moistureRegain: Number(currentStep.dissolvedFiberMoisture)
        });
        
        previousWeightInSequence = currentResidueWeight;
      }

      // The last "step" in the UI is just a container for the name of the final fiber.
      // Its weight is the last residue calculated from the loop above.
      if (sampleSteps.length > 0) {
        const lastFiberStep = sampleSteps[sampleSteps.length - 1];
        calculatedFibers.push({
          name: lastFiberStep.dissolvedFiberName || 'Final Residue',
          dryWeight: previousWeightInSequence,
          moistureRegain: Number(lastFiberStep.dissolvedFiberMoisture)
        });
      }

      let totalConditionedWeight = 0;
      const resultsWithPercentages = calculatedFibers.map(fiber => {
        const conditionedWeight = fiber.dryWeight * (1 + (isNaN(fiber.moistureRegain) ? 0 : fiber.moistureRegain) / 100);
        totalConditionedWeight += conditionedWeight;
        return { ...fiber, name: fiber.name, dryWeight: fiber.dryWeight, dryPercentage: (fiber.dryWeight / sampleInitialWeight) * 100, conditionedPercentage: 0 };
      });

      const finalResultsForSample = resultsWithPercentages.map(fiber => ({
        ...fiber,
        conditionedPercentage: totalConditionedWeight > 0 ? (fiber.dryWeight * (1 + (isNaN(fiber.moistureRegain) ? 0 : fiber.moistureRegain) / 100) / totalConditionedWeight) * 100 : 0,
      }));

      allSamplesResults.push(finalResultsForSample);
    }
    setSampleResults(allSamplesResults);

    const aggregatedResults: { [key: string]: { dryWeight: number[], dryPercentage: number[], conditionedPercentage: number[], count: number } } = {};
    allSamplesResults.forEach(sampleResults => {
      sampleResults.forEach(result => {
        if (!aggregatedResults[result.name]) {
          aggregatedResults[result.name] = { dryWeight: [], dryPercentage: [], conditionedPercentage: [], count: 0 };
        }
        aggregatedResults[result.name].dryWeight.push(result.dryWeight);
        aggregatedResults[result.name].dryPercentage.push(result.dryPercentage);
        aggregatedResults[result.name].conditionedPercentage.push(result.conditionedPercentage);
        aggregatedResults[result.name].count++;
      });
    });

    const finalAverageResultsWithoutMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data]) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgDryPercentage = data.dryPercentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        name,
        dryWeight: avgDryWeight,
        dryPercentage: avgDryPercentage,
        conditionedPercentage: 0,
      };
    });

    const finalAverageResultsWithMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data]) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgConditionedPercentage = data.conditionedPercentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        name,
        dryWeight: avgDryWeight,
        dryPercentage: 0,
        conditionedPercentage: avgConditionedPercentage,
      };
    });
    
    setAverageWithoutMoisture(finalAverageResultsWithoutMoisture);
    setAverageWithMoisture(finalAverageResultsWithMoisture);
    setAverageResults(finalAverageResultsWithMoisture);
  };

  const calculateByComponent = () => {
    const allSamplesResults: FiberResult[][] = [];

    for (let i = 0; i < numberOfSamples; i++) {
      const sampleComponentFibers = componentFibers[i];
      const sampleInitialWeight = Number(initialWeight[i]);

      const totalFinalDryWeight = sampleComponentFibers.reduce((sum, f) => sum + Number(f.dryWeight), 0);
      if (totalFinalDryWeight <= 0) {
        alert(`Sample ${i + 1}: Total dry weight of components is zero. Please enter component weights.`);
        return;
      }

      const effectiveInitialWeight = sampleInitialWeight > 0 ? sampleInitialWeight : totalFinalDryWeight;

      let totalConditionedWeight = 0;
      const resultsWithPercentages = sampleComponentFibers.map(fiber => {
        const dryWeight = Number(fiber.dryWeight);
        const moistureRegain = Number(fiber.moistureContent);
        const conditionedWeight = dryWeight * (1 + (isNaN(moistureRegain) ? 0 : moistureRegain) / 100);
        totalConditionedWeight += conditionedWeight;
        return {
          name: fiber.name,
          dryWeight,
          conditionedWeight,
          dryPercentage: (dryWeight / effectiveInitialWeight) * 100
        };
      });

      const finalResultsForSample = resultsWithPercentages.map(fiber => ({
        name: fiber.name,
        dryWeight: fiber.dryWeight,
        dryPercentage: fiber.dryPercentage,
        conditionedPercentage: totalConditionedWeight > 0 ? (fiber.conditionedWeight / totalConditionedWeight) * 100 : 0,
      }));

      allSamplesResults.push(finalResultsForSample);
    }
    setSampleResults(allSamplesResults);

    const aggregatedResults: { [key: string]: { dryWeight: number[], dryPercentage: number[], conditionedPercentage: number[], count: number } } = {};
    allSamplesResults.forEach(sampleResults => {
      sampleResults.forEach(result => {
        if (!aggregatedResults[result.name]) {
          aggregatedResults[result.name] = { dryWeight: [], dryPercentage: [], conditionedPercentage: [], count: 0 };
        }
        aggregatedResults[result.name].dryWeight.push(result.dryWeight);
        aggregatedResults[result.name].dryPercentage.push(result.dryPercentage);
        aggregatedResults[result.name].conditionedPercentage.push(result.conditionedPercentage);
        aggregatedResults[result.name].count++;
      });
    });

    const finalAverageResultsWithoutMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data]) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgDryPercentage = data.dryPercentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        name,
        dryWeight: avgDryWeight,
        dryPercentage: avgDryPercentage,
        conditionedPercentage: 0,
      };
    });

    const finalAverageResultsWithMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data]) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgConditionedPercentage = data.conditionedPercentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        name,
        dryWeight: avgDryWeight,
        dryPercentage: 0,
        conditionedPercentage: avgConditionedPercentage,
      };
    });
    
    setAverageWithoutMoisture(finalAverageResultsWithoutMoisture);
    setAverageWithMoisture(finalAverageResultsWithMoisture);
    setAverageResults(finalAverageResultsWithMoisture);
  };

  const handleDownloadReport = async () => {
    if (sampleResults.length > 0) {
      const totalInitialWeight = initialWeight.map(w => Number(w)).reduce((sum, w) => sum + w, 0);
      const averageInitialWeight = totalInitialWeight / numberOfSamples;

      if (isNaN(averageInitialWeight) || averageInitialWeight <= 0) {
        alert('Please enter a valid Initial Dry Sample Weight for all samples for the report.');
        return;
      }
      const docBlob = await generateChemicalSeparationDoc(sampleResults, averageWithoutMoisture, averageWithMoisture, averageInitialWeight);
      saveAs(docBlob, 'ChemicalSeparationReport.docx');
    }
  };

  const fiberDatalistId = 'fiber-names-chemical';
  
  // --- RENDER ---
  return (
    <div className={styles.container}>
      <datalist id={fiberDatalistId}>
        {fiberSettings.map(f => <option key={f.id} value={f.name} />)}
      </datalist>

      <h2 className={styles.title}>Chemical Separation</h2>
      
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

      <div className={styles.modeSelector}>
        <button onClick={() => setMode('residue')} className={mode === 'residue' ? styles.modeButtonActive : styles.modeButton}>By Residue</button>
        <button onClick={() => setMode('component')} className={mode === 'component' ? styles.modeButtonActive : styles.modeButton}>By Component</button>
      </div>

      {Array.from({ length: numberOfSamples }).map((_, sampleIndex) => (
        <div key={sampleIndex} className={styles.sampleContainer}>
          <h3 className={styles.sampleTitle}>Sample {sampleIndex + 1}</h3>

          {/* Initial Weight Input always present and shared */}
          <div className={styles.inputGroup} style={{marginTop: '1.5rem'}}>
              <label className={styles.label}>Initial Dry Sample Weight (g)</label>
              <input type="number" value={initialWeight[sampleIndex]} onChange={(e) => {
                const newInitialWeights = [...initialWeight];
                newInitialWeights[sampleIndex] = e.target.value === '' ? '' : Number(e.target.value);
                setInitialWeight(newInitialWeights);
              }} placeholder="e.g., 10.0000" className={styles.input} />
              {mode === 'component' && <p className="text-sm text-muted-foreground mt-1">If left blank, sum of component dry weights will be used as initial weight for percentages.</p>}
          </div>

          {mode === 'residue' && (
            <div className={styles.stepsContainer}>
              <h3 className={styles.sectionTitle}>Separation Steps</h3>
              {steps[sampleIndex] && steps[sampleIndex].map((step, index) => (
                <div key={step.id} className={styles.step}>
                  <h4 className={styles.stepTitle}>Step {index + 1}</h4>
                  <div className={styles.grid}>
                    <input type="text" list={fiberDatalistId} placeholder="Dissolved Fiber Name" value={step.dissolvedFiberName} onChange={(e) => handleStepChange(sampleIndex, step.id, 'dissolvedFiberName', e.target.value)} className={styles.input} />
                    <input type="number" placeholder={index < steps[sampleIndex].length - 1 ? "Residue Weight (g)" : "Weight is Calculated"} value={step.residueWeight} onChange={(e) => handleStepChange(sampleIndex, step.id, 'residueWeight', e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} disabled={index === steps[sampleIndex].length - 1} />
                    <input type="number" placeholder={`Moisture Regain (%)`} value={step.dissolvedFiberMoisture} onChange={(e) => handleStepChange(sampleIndex, step.id, 'dissolvedFiberMoisture', e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                  </div>
                  {steps[sampleIndex].length > 1 && <button onClick={() => removeStep(sampleIndex, step.id)} className={`${styles.button} ${styles.buttonDestructive}`}>Remove Step</button>}
                </div>
              ))}
              <button onClick={() => addStep(sampleIndex)} className={`${styles.button} ${styles.buttonSecondary}`}>Add Step</button>
            </div>
          )}

          {mode === 'component' && (
            <div className={styles.stepsContainer}>
                <h3 className={styles.sectionTitle}>Component Fibers</h3>
                {componentFibers[sampleIndex] && componentFibers[sampleIndex].map((fiber) => (
                  <div key={fiber.id} className={styles.step}>
                    <div className={styles.grid}>
                        <input type="text" list={fiberDatalistId} placeholder="Fiber Name" value={fiber.name} onChange={(e) => handleComponentFiberChange(sampleIndex, fiber.id, 'name', e.target.value)} className={styles.input} />
                        <input type="number" placeholder="Final Dry Weight (g)" value={fiber.dryWeight} onChange={(e) => handleComponentFiberChange(sampleIndex, fiber.id, 'dryWeight', e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                        <input type="number" placeholder={`Moisture Regain (%)`} value={fiber.moistureContent} onChange={(e) => handleComponentFiberChange(sampleIndex, fiber.id, 'moistureContent', e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                    </div>
                    <button onClick={() => removeComponentFiber(sampleIndex, fiber.id)} className={`${styles.button} ${styles.buttonDestructive}`}>Remove Fiber</button>
                  </div>
                ))}
                <button onClick={() => addComponentFiber(sampleIndex)} className={`${styles.button} ${styles.buttonSecondary}`}>+ Add Fiber</button>
            </div>
          )}
        </div>
      ))}
      
      <div className={styles.buttonGroup}>
        <button onClick={mode === 'residue' ? calculateByResidue : calculateByComponent} className={`${styles.button} ${styles.buttonPrimary}`}>Calculate Average</button>
        {sampleResults.length > 0 && <button onClick={handleDownloadReport} className={`${styles.button} ${styles.buttonAccent}`}>Download Report</button>}
      </div>

      {sampleResults.length > 0 && (
        <div className={styles.tableContainer}>
          <h3 className={styles.sectionTitle}>Sample-by-Sample Results</h3>
          {sampleResults.map((sample, index) => (
            <div key={index}>
              <h4 className={styles.sampleTitle}>Sample {index + 1}</h4>
              <table className={styles.table}>
                <thead><tr><th>Fiber Name</th><th>Dry Weight (g)</th><th>Dry %</th><th>Conditioned %</th></tr></thead>
                <tbody>
                  {sample.map((result, rIndex) => (
                    <tr key={rIndex}>
                      <td>{result.name}</td>
                      <td>{result.dryWeight.toFixed(4)}</td>
                      <td>{result.dryPercentage.toFixed(4)}%</td>
                      <td>{result.conditionedPercentage.toFixed(4)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <h3 className={styles.sectionTitle}>Average Results (Without Moisture)</h3>
          <table className={styles.table}>
            <thead><tr><th>Fiber Name</th><th>Avg. Dry Weight (g)</th><th>Avg. Dry %</th></tr></thead>
            <tbody>
              {averageWithoutMoisture.map((result, index) => (
                <tr key={index}>
                  <td>{result.name}</td>
                  <td>{result.dryWeight.toFixed(4)}</td>
                  <td>{result.dryPercentage.toFixed(4)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className={styles.sectionTitle}>Average Results (With Moisture)</h3>
          <table className={styles.table}>
            <thead><tr><th>Fiber Name</th><th>Avg. Dry Weight (g)</th><th>Avg. Conditioned %</th></tr></thead>
            <tbody>
              {averageWithMoisture.map((result, index) => (
                <tr key={index}>
                  <td>{result.name}</td>
                  <td>{result.dryWeight.toFixed(4)}</td>
                  <td>{result.conditionedPercentage.toFixed(4)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ChemicalSeparation;