import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EntryForm from "../components/EntryForm";
import API from "../api/api";

export default function EntryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await API.get(`/entries/${id}`);
        if (!ignore) setEditing(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 p-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{id ? "Edit Entry" : "Add Entry"}</h1>
          <button onClick={() => navigate(-1)} className="px-3 py-1 bg-red-600 text-white  rounded">← Back</button>
        </div>
        {loading ? (
          <div className="bg-white p-4 rounded shadow">Loading...</div>
        ) : (
          <EntryForm editing={editing} onSaved={() => navigate("/")} onCancelled={() => navigate(-1)} />
        )}
      </div>
    </div>
  );
}


