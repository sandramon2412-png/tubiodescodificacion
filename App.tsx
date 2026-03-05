import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import ThankYou from './ThankYou';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/gracias" element={<ThankYou />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
