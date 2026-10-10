import React from 'react';
import { AppProvider, useApp } from './AppContext';
import { HomeScreen } from './components/HomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import './index.css';

function AppRouter() {
  const { state } = useApp();

  switch (state.screen) {
    case 'home':
      return <HomeScreen />;
    case 'quiz':
      return state.quiz ? <QuizScreen /> : <HomeScreen />;
    case 'results':
      return state.quiz ? <ResultsScreen /> : <HomeScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
