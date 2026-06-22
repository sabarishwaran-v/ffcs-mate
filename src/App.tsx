import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Hub from './pages/Hub';
import SemesterSelection from './pages/SemesterSelection';
import Auth from './pages/Auth';
import Planner from './pages/Planner';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen font-sans bg-[#FAFAFA]">
        <Header />

        <main>
          <Routes>
            <Route path="/" element={<Hub />} />
            <Route path="/select-semester" element={<SemesterSelection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/planner" element={<Planner />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
