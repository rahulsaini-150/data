import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EntryPage from "./pages/EntryPage";
import { setAuthToken } from "./api/api";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
    }
  }, []);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setAuthToken(null);
  };

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Login onLogin={setToken} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/entries/new" element={<EntryPage />} />
        <Route path="/entries/:id/edit" element={<EntryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
