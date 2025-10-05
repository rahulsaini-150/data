import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import moment from "moment";
import toast from "react-hot-toast";

export default function EntryList({ onEdit, onDelete }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totals, setTotals] = useState({ km: 0, rupee: 0 });
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const params = useMemo(() => ({ page, limit, search, fromDate, toDate, sortBy, sortDir }), [page, limit, search, fromDate, toDate, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/entries", { params });
      setRows(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.total);
      setTotals(res.data.totals || { km: 0, rupee: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, limit, sortBy, sortDir]);

  const applyFilters = () => { setPage(1); load(); };
  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortBy("date");
    setSortDir("desc");
    setLimit(10);
    setPage(1);
    load();
  };

  const handleDelete = async id => {
    if (!confirm("Delete this entry?")) return;
    try {
      await API.delete(`/entries/${id}`);
      toast.success("Entry deleted");
      onDelete?.();
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
  };

  const download = async (type) => {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      fromDate,
      toDate,
      sortBy,
      sortDir,
    }).toString();
    try {
      const res = await API.get(`/entries/export/${type}?${query}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `entries.${type === "xlsx" ? "xlsx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(type === "xlsx" ? "Excel downloaded" : "PDF downloaded");
    } catch (e) {
      toast.error(e.response?.data?.message || "Download failed");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters & Search
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center justify-center w-full gap-2">

              <button 
                className="px-4 py-2 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                onClick={() => download("xlsx")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button 
                className="px-4 py-2 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                onClick={() => download("pdf")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              </div>
              <button 
                className="px-4 py-3 w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                onClick={() => navigate("/entries/new")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Entry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <input 
                placeholder="Search route..." 
                value={search} 
                onChange={e=>setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e=>setFromDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <input 
              type="date" 
              value={toDate} 
              onChange={e=>setToDate(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <button 
              onClick={applyFilters}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Apply
            </button>
            <button 
              onClick={clearFilters}
              className="px-4 py-2.5 border-2 border-slate-300 hover:border-slate-400 rounded-lg font-medium hover:bg-slate-50 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-blue-50 border-b-2 border-slate-200">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                  onClick={()=>toggleSort("date")}
                >
                  <div className="flex items-center gap-2">
                    Date
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Time
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                  onClick={()=>toggleSort("route")}
                >
                  <div className="flex items-center gap-2">
                    Route
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                  onClick={()=>toggleSort("km")}
                >
                  <div className="flex items-center gap-2">
                    KM
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                  onClick={()=>toggleSort("petrolFillDate")}
                >
                  <div className="flex items-center gap-2">
                    Petrol Date
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                  onClick={()=>toggleSort("rupee")}
                >
                  <div className="flex items-center gap-2">
                    Rupee
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map(e => (
                <tr key={e._id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {moment(e.date).format("DD MMM YYYY")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {moment(e.createdAt).format("hh:mm A")}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {e.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {e.km}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {moment(e.petrolFillDate).format("DD MMM YYYY")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ₹{e.rupee}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate(`/entries/${e._id}/edit`)}
                        className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(e._id)}
                        className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={7}>
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No entries found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gradient-to-r from-amber-50 to-orange-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-slate-800" colSpan={3}>
                  Totals
                </td>
                <td className="px-6 py-4 text-sm font-bold text-blue-700">
                  {totals.km} KM
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-sm font-bold text-green-700">
                  ₹{totals.rupee}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-600 font-medium">
              Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span> • <span className="font-bold text-slate-800">{totalCount}</span> records
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                disabled={page<=1} 
                onClick={()=>setPage(1)}
              >
                First
              </button>
              <button 
                className="px-4 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                disabled={page<=1} 
                onClick={()=>setPage(p=>p-1)}
              >
                Prev
              </button>
              <select 
                className="px-3 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                value={limit} 
                onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <button 
                className="px-4 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                disabled={page>=totalPages} 
                onClick={()=>setPage(p=>p+1)}
              >
                Next
              </button>
              <button 
                className="px-4 py-2 border-2 border-slate-300 rounded-lg font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all" 
                disabled={page>=totalPages} 
                onClick={()=>setPage(totalPages)}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}