import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import IntakePage from "./pages/IntakePage";
import ProgressPage from "./pages/ProgressPage";
import ResultPage from "./pages/ResultPage";
import DeadlinesPage from "./pages/DeadlinesPage";
import LawRouterPage from "./pages/LawRouterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IntakePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="result" element={<ResultPage />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="law-router" element={<LawRouterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
