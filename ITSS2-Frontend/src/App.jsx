import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import JobDetail from "./pages/JobDetail";
import JobList from "./pages/JobList";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
      </Routes>
    </Router>
  );
};

export default App;
