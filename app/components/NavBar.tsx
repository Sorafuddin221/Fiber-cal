'use client'; // This is a client component

import React from 'react';
import styles from './NavBar.module.css';

export type Calculator = 'manual' | 'chemical' | 'garments';
export type View = Calculator | 'settings';

interface NavBarProps {
  activeView: View;
  onSelectView: (view: View) => void;
}

const NavBar: React.FC<NavBarProps> = ({ activeView, onSelectView }) => {
  const getButtonClass = (view: View) => {
    const baseClass = styles.button;
    if (activeView === view) {
      return `${baseClass} ${styles.buttonActive}`;
    }
    return `${baseClass} ${styles.buttonInactive}`;
  };

  return (
    <header className={styles.navBar}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <a className={styles.logoLink} href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className={styles.logoSvg}
            >
              <rect width="256" height="256" fill="none"></rect>
              <line
                x1="208"
                y1="128"
                x2="128"
                y2="208"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              ></line>
              <line
                x1="192"
                y1="40"
                x2="40"
                y2="192"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              ></line>
            </svg>
            <span className={styles.logoText}>
              FiberCalc
            </span>
          </a>
          <nav className={styles.nav}>
            <button
              onClick={() => onSelectView('manual')}
              className={getButtonClass('manual')}
            >
              Manual Separation
            </button>
            <button
              onClick={() => onSelectView('chemical')}
              className={getButtonClass('chemical')}
            >
              Chemical Separation
            </button>
            <button
              onClick={() => onSelectView('garments')}
              className={getButtonClass('garments')}
            >
              Garments Analysis
            </button>
            <button
              onClick={() => onSelectView('settings')}
              className={getButtonClass('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default NavBar;