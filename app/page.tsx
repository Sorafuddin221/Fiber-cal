'use client';

import { useState } from 'react';
import NavBar, { View, Calculator } from './components/NavBar';
import ManualSeparation from './components/ManualSeparation';
import ChemicalSeparation from './components/ChemicalSeparation';
import GarmentsAnalysis from './components/GarmentsAnalysis';
import Settings from './components/Settings';
import { useFiberSettings, Standard } from './lib/useFiberSettings';
import styles from './page.module.css';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('manual');
  const [activeCalculator, setActiveCalculator] = useState<Calculator>('manual');
  const [activeStandard, setActiveStandard] = useState<Standard>('iso');
  
  const { fiberSettings, loading } = useFiberSettings();

  const handleSelectView = (view: View) => {
    setActiveView(view);
    if (view !== 'settings') {
      setActiveCalculator(view);
    }
  };

  const renderActiveComponent = () => {
    if (activeView === 'settings') {
      return <Settings />;
    }

    if (loading) {
      return <div>Loading calculator...</div>;
    }

    const props = {
      fiberSettings,
      activeStandard,
    };

    switch (activeCalculator) {
      case 'manual':
        return <ManualSeparation {...props} />;
      case 'chemical':
        return <ChemicalSeparation {...props} />;
      case 'garments':
        return <GarmentsAnalysis {...props} />;
      default:
        return <ManualSeparation {...props} />;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <NavBar activeView={activeView} onSelectView={handleSelectView} />
      <main className="flex-1 container mx-auto p-4">
        {activeView !== 'settings' && (
          <div className={styles.standardSelectorContainer}>
            <label htmlFor="standard-selector" className={styles.standardSelectorLabel}>
              Active Standard:
            </label>
            <select
              id="standard-selector"
              value={activeStandard}
              onChange={(e) => setActiveStandard(e.target.value as Standard)}
              className={styles.standardSelector}
            >
              <option value="iso">ISO</option>
              <option value="aatcc">AATCC</option>
              <option value="eu">EU</option>
              <option value="canada">Canada</option>
            </select>
          </div>
        )}
        {renderActiveComponent()}
      </main>
    </div>
  );
}