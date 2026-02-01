'use client';

import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { generateManualSeparationDoc } from '../lib/doc-generator';
import styles from './ManualSeparation.module.css';
import { FiberSetting, Standard } from '../lib/useFiberSettings';

interface Props {
  fiberSettings: FiberSetting[];
  activeStandard: Standard;
}

interface FiberInput {
  id: number;
  name: string;
  dryWeight: number | '';
  moistureContent: number | '';
}

interface FiberResult {
  id: number;
  name: string;
  dryWeight: number;
  moistureContent: number;
  wetWeight: number;
  percentage: number;
}

const ManualSeparation: React.FC<Props> = ({ fiberSettings, activeStandard }) => {
  const [numberOfSamples, setNumberOfSamples] = useState(1);
  const [fibers, setFibers] = useState<FiberInput[][]>(() =>
    Array(1).fill(null).map(() => [{ id: 1, name: '', dryWeight: '', moistureContent: '' }])
  );
  const [sampleResults, setSampleResults] = useState<FiberResult[][]>([]);
  const [averageResults, setAverageResults] = useState<FiberResult[]>([]);
  const [averageWithMoisture, setAverageWithMoisture] = useState<FiberResult[]>([]);
  const [averageWithoutMoisture, setAverageWithoutMoisture] = useState<FiberResult[]>([]);
  const [totalDryWeight, setTotalDryWeight] = useState<number>(0);

  useEffect(() => {
    setFibers(prevFibers => {
      const newFibers = [...prevFibers];
      if (newFibers.length < numberOfSamples) {
        for (let i = newFibers.length; i < numberOfSamples; i++) {
          newFibers.push([{ id: Date.now(), name: '', dryWeight: '', moistureContent: '' }]);
        }
      } else if (newFibers.length > numberOfSamples) {
        return newFibers.slice(0, numberOfSamples);
      }
      return newFibers;
    });
  }, [numberOfSamples]);

  const handleFiberChange = (sampleIndex: number, id: number, field: keyof FiberInput, value: string | number) => {
    let newFibers = fibers.map((sample, sIndex) => {
      if (sIndex === sampleIndex) {
        let newSample = sample.map((fiber) =>
          fiber.id === id ? { ...fiber, [field]: value } : fiber
        );

        if (field === 'name') {
          const matchedFiber = fiberSettings.find(f => f.name.toLowerCase() === (value as string).toLowerCase());
          if (matchedFiber) {
            const moisture = matchedFiber[activeStandard];
            newSample = newSample.map(f => f.id === id ? { ...f, moistureContent: moisture } : f);
          }
        }
        return newSample;
      }
      return sample;
    });
    setFibers(newFibers);
  };

  const addFiber = (sampleIndex: number) => {
    setFibers((prevFibers) => {
      return prevFibers.map((sample, sIndex) => {
        if (sIndex === sampleIndex) {
          return [...sample, { id: Date.now(), name: '', dryWeight: '', moistureContent: '' }];
        }
        return sample;
      });
    });
  };

  const removeFiber = (sampleIndex: number, id: number) => {
    setFibers((prevFibers) => {
      return prevFibers.map((sample, sIndex) => {
        if (sIndex === sampleIndex) {
          return sample.filter((fiber) => fiber.id !== id);
        }
        return sample;
      });
    });
  };

  const calculateResults = () => {
    const allSamplesResults: FiberResult[][] = fibers.map((sample) => {
      let currentTotalDryWeight = 0;
      const calculatedResults: Omit<FiberResult, 'percentage'>[] = sample.map((fiber) => {
        const dryWeight = Number(fiber.dryWeight);
        const moistureContent = Number(fiber.moistureContent);

        if (dryWeight > 0 && moistureContent >= 0) {
          currentTotalDryWeight += dryWeight;
          const wetWeight = dryWeight * (1 + moistureContent / 100);
          return { id: fiber.id, name: fiber.name, dryWeight: dryWeight, moistureContent: moistureContent, wetWeight, percentage: 0 };
        }
        return { id: fiber.id, name: fiber.name, dryWeight: 0, moistureContent: 0, wetWeight: 0, percentage: 0 };
      });

      return calculatedResults.map((result) => ({
        ...result,
        percentage: currentTotalDryWeight > 0 ? (result.dryWeight / currentTotalDryWeight) * 100 : 0,
      }));
    });
    setSampleResults(allSamplesResults);

    const aggregatedResults: { [key: string]: { dryWeight: number[], moistureContent: number[], wetWeight: number[], percentage: number[], count: number } } = {};

    allSamplesResults.forEach(sampleResults => {
      sampleResults.forEach(result => {
        if (!aggregatedResults[result.name]) {
          aggregatedResults[result.name] = { dryWeight: [], moistureContent: [], wetWeight: [], percentage: [], count: 0 };
        }
        aggregatedResults[result.name].dryWeight.push(result.dryWeight);
        aggregatedResults[result.name].moistureContent.push(result.moistureContent);
        aggregatedResults[result.name].wetWeight.push(result.wetWeight);
        aggregatedResults[result.name].percentage.push(result.percentage);
        aggregatedResults[result.name].count++;
      });
    });

    const finalAverageResultsWithMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data], index) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgMoistureContent = data.moistureContent.reduce((a, b) => a + b, 0) / data.count;
      const avgWetWeight = data.wetWeight.reduce((a, b) => a + b, 0) / data.count;
      const totalWetWeight = Object.values(aggregatedResults).reduce((total, d) => total + (d.wetWeight.reduce((a,b) => a+b, 0) / d.count), 0);
      return {
        id: index,
        name,
        dryWeight: avgDryWeight,
        moistureContent: avgMoistureContent,
        wetWeight: avgWetWeight,
        percentage: totalWetWeight > 0 ? (avgWetWeight / totalWetWeight) * 100 : 0,
      };
    });

    const finalAverageResultsWithoutMoisture: FiberResult[] = Object.entries(aggregatedResults).map(([name, data], index) => {
      const avgDryWeight = data.dryWeight.reduce((a, b) => a + b, 0) / data.count;
      const avgMoistureContent = data.moistureContent.reduce((a, b) => a + b, 0) / data.count;
      const avgPercentage = data.percentage.reduce((a, b) => a + b, 0) / data.count;
      return {
        id: index,
        name,
        dryWeight: avgDryWeight,
        moistureContent: avgMoistureContent,
        wetWeight: 0, // Not used for "without moisture"
        percentage: avgPercentage,
      };
    });
    
    setAverageWithMoisture(finalAverageResultsWithMoisture);
    setAverageWithoutMoisture(finalAverageResultsWithoutMoisture);
    setAverageResults(finalAverageResultsWithMoisture); // For now, the main average is with moisture

    const totalDryWeightAverage = finalAverageResultsWithMoisture.reduce((sum, result) => sum + result.dryWeight, 0);
    setTotalDryWeight(totalDryWeightAverage);
  };

  const handleDownloadReport = async () => {
    if (sampleResults.length > 0) {
      const docBlob = await generateManualSeparationDoc(sampleResults, averageWithoutMoisture, averageWithMoisture, totalDryWeight);
      saveAs(docBlob, 'ManualSeparationReport.docx');
    }
  };

  const fiberDatalistId = 'fiber-names-manual';

  return (
    <div className={styles.container}>
      <datalist id={fiberDatalistId}>
        {fiberSettings.map(f => <option key={f.id} value={f.name} />)}
      </datalist>

      <h2 className={styles.title}>Manual Separation</h2>

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

      <div className={styles.fibersContainer}>
        {fibers.map((sample, sampleIndex) => (
          <div key={sampleIndex} className={styles.sampleContainer}>
            <h3 className={styles.sampleTitle}>Sample {sampleIndex + 1}</h3>
            {sample.map((fiber) => (
              <div key={fiber.id} className={styles.fiberRow}>
                <input
                  type="text"
                  list={fiberDatalistId}
                  placeholder="Fiber Name"
                  value={fiber.name}
                  onChange={(e) => handleFiberChange(sampleIndex, fiber.id, 'name', e.target.value)}
                  className={`${styles.input} ${styles.nameInput}`}
                />
                <input
                  type="number"
                  placeholder="Dry Weight (g)"
                  value={fiber.dryWeight}
                  onChange={(e) => handleFiberChange(sampleIndex, fiber.id, 'dryWeight', e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${styles.input} ${styles.numberInput}`}
                />
                <input
                  type="number"
                  placeholder={`Moisture (%) - ${activeStandard.toUpperCase()}`}
                  value={fiber.moistureContent}
                  onChange={(e) => handleFiberChange(sampleIndex, fiber.id, 'moistureContent', e.target.value === '' ? '' : Number(e.target.value))}
                  className={`${styles.input} ${styles.numberInput}`}
                />
                <button
                  onClick={() => removeFiber(sampleIndex, fiber.id)}
                  className={`${styles.button} ${styles.buttonDestructive}`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addFiber(sampleIndex)}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              Add Fiber
            </button>
          </div>
        ))}
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={calculateResults}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          Calculate Average
        </button>
      </div>

      {sampleResults.length > 0 && (
        <div className={styles.resultsContainer}>
          <h3 className={styles.resultsTitle}>Sample-by-Sample Results</h3>
          {sampleResults.map((sample, index) => (
            <div key={index} className={styles.tableContainer}>
              <h4 className={styles.sampleTitle}>Sample {index + 1}</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fiber Name</th>
                    <th>Dry Weight (g)</th>
                    <th>Moisture (%)</th>
                    <th>Wet Weight (g)</th>
                    <th>Percentage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((result) => (
                    <tr key={result.id}>
                      <td>{result.name || 'N/A'}</td>
                      <td>{Number(result.dryWeight).toFixed(4)}</td>
                      <td>{Number(result.moistureContent).toFixed(4)}</td>
                      <td>{result.wetWeight.toFixed(4)}</td>
                      <td>{result.percentage.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <h3 className={styles.resultsTitle}>Average Results (Without Moisture)</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fiber Name</th>
                  <th>Avg. Dry Weight (g)</th>
                  <th>Avg. Moisture (%)</th>
                  <th>Avg. Percentage (%)</th>
                </tr>
              </thead>
              <tbody>
                {averageWithoutMoisture.map((result) => (
                  <tr key={result.id}>
                    <td>{result.name || 'N/A'}</td>
                    <td>{Number(result.dryWeight).toFixed(4)}</td>
                    <td>{Number(result.moistureContent).toFixed(4)}</td>
                    <td>{result.percentage.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className={styles.resultsTitle}>Average Results (With Moisture)</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fiber Name</th>
                  <th>Avg. Dry Weight (g)</th>
                  <th>Avg. Moisture (%)</th>
                  <th>Avg. Wet Weight (g)</th>
                  <th>Avg. Percentage (%)</th>
                </tr>
              </thead>
              <tbody>
                {averageWithMoisture.map((result) => (
                  <tr key={result.id}>
                    <td>{result.name || 'N/A'}</td>
                    <td>{Number(result.dryWeight).toFixed(4)}</td>
                    <td>{Number(result.moistureContent).toFixed(4)}</td>
                    <td>{result.wetWeight.toFixed(4)}</td>
                    <td>{result.percentage.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleDownloadReport}
            className={`${styles.button} ${styles.buttonAccent} ${styles.downloadButton}`}
          >
            Download Report (.docx)
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualSeparation;