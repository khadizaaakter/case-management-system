import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Briefcase, Users, Landmark, FileCheck, Wallet, TrendingDown } from 'lucide-react'
import { useStore } from '../store'
import { STATIC_STATS } from '../data'
import { lakh, thousands, taskPriority, daysUntil, formatDate } from '../utils'
import { StatCard } from '../components/ui'
import { prioClass } from '../styles'

const PIE_COLORS = ['#4f46e5', '#7c3aed', '#f59e0b', '#16a34a', '#0ea5e9', '#e11d48']

export default function Dashboard() {
  const { cases, masterData } = useStore()
  const [filters, setFilters] = useState({ business: '', status: '', depot: '' })

  const filtered = useMemo(
    () =>
      cases.filter(
        (c) =>
          (!filters.business || c.business === filters.business) &&
          (!filters.status || c.presentStatus === filters.status) &&
          (!filters.depot || c.depot === filters.depot),
      ),
    [cases, filters],
  )

  const hasData = filtered.length > 0

  const totalCases = hasData ? filtered.length : STATIC_STATS.totalCases
  const casesFiled = hasData
    ? filtered.filter((c) => c.caseFiled === 'Yes').length
    : STATIC_STATS.casesFiled
  const totalDues = hasData
    ? filtered.reduce((s, c) => s + (c.presentDues || 0), 0)
    : STATIC_STATS.totalPresentDues
  const totalRecovered = hasData
    ? filtered.reduce((s, c) => s + (c.totalRecovered || 0), 0)
    : STATIC_STATS.totalRecoveredAmount
  const uniqueCustomers = hasData
    ? new Set(filtered.map((c) => c.customerCode)).size
    : STATIC_STATS.uniqueCustomers
  const uniqueCourts = hasData
    ? new Set(filtered.map((c) => c.court).filter(Boolean)).size
    : STATIC_STATS.uniqueCourts
  const totalCheque = hasData
    ? filtered.reduce((s, c) => s + (c.chequeAmount || 0), 0)
    : STATIC_STATS.totalChequeAmount

  const statusData = useMemo(() => {
    const m: Record<string, number> = {}
    filtered.forEach((c) => (m[c.presentStatus] = (m[c.presentStatus] || 0) + 1))
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [filtered])

  const depotData = useMemo(() => {
    const m: Record<string, number> = {}
    filtered.forEach((c) => (m[c.depot] = (m[c.depot] || 0) + (c.totalRecovered || 0)))
    return Object.entries(m).map(([name, recovered]) => ({
      name,
      recovered: +(recovered / 100000).toFixed(1),
    }))
  }, [filtered])

  const upcoming = useMemo(() => {
    const limit = Date.now() + 30 * 24 * 60 * 60 * 1000
    return filtered
      .filter(
        (c) =>
          c.nextHearingDate &&
          new Date(c.nextHearingDate).getTime() <= limit &&
          new Date(c.nextHearingDate).getTime() >= Date.now(),
      )
      .map((c) => ({ c, days: daysUntil(c.nextHearingDate!), prio: taskPriority(c.nextHearingDate!) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 10)
  }, [filtered])

  const recoveryRate =
    totalRecovered + totalDues > 0
      ? ((totalRecovered / (totalRecovered + totalDues)) * 100).toFixed(1)
      : '0.0'
  const pendingDecision = filtered.filter(
    (c) => c.presentStatus.includes('Notice') || c.presentStatus.includes('Pending'),
  ).length

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        <StatCard label="Total Cases" value={totalCases.toLocaleString()} meta="All time on record" icon={<Briefcase size={13} />} />
        <StatCard label="Unique Customers" value={uniqueCustomers.toLocaleString()} meta="Distinct customer codes" icon={<Users size={13} />} />
        <StatCard label="Unique Courts" value={uniqueCourts.toLocaleString()} meta="Courts handling cases" icon={<Landmark size={13} />} />
        <StatCard label="Cases Filed" value={casesFiled.toLocaleString()} meta={`${((casesFiled / totalCases) * 100).toFixed(1)}% of total`} icon={<FileCheck size={13} />} />
        <StatCard label="Cheque Amount" value={thousands(totalCheque)} meta="Original liability" icon={<Wallet size={13} />} />
        <StatCard label="Recovered" value={thousands(totalRecovered)} meta="Successfully recovered" icon={<TrendingDown size={13} />} />
        <StatCard label="Present Dues" value={thousands(totalDues)} meta="Outstanding liability" icon={<Wallet size={13} />} />
        <StatCard label="Recovery Rate" value={`${recoveryRate}%`} meta="Recovered vs total" icon={<FileCheck size={13} />} />
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
        <div className="card p-5">
          <h3 className="card-title">Cases by Status</h3>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-11 text-center text-muted">No status data.</div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="card-title">Recovery by Depot (Lakhs)</h3>
          {depotData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={depotData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(79,70,229,0.06)' }} />
                <Bar dataKey="recovered" fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-11 text-center text-muted">No depot data.</div>
          )}
        </div>
      </div>

      <div className="card mt-6 p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="card-title mb-0">Upcoming Hearings (Next 30 Days)</h3>
          <span className="text-xs text-muted">Sorted by priority</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="py-11 text-center text-muted">No upcoming hearings scheduled.</div>
        ) : (
          upcoming.map(({ c, days, prio }) => (
            <div
              key={c.id}
              className={`mb-2.5 flex items-center justify-between gap-3.5 rounded-md border border-border border-l-[3px] px-3.5 py-3 ${
                days < 0 ? 'border-l-bad bg-bad-soft' : 'border-l-accent'
              }`}
            >
              <div>
                <div className="mb-0.5 flex items-center gap-2.5 font-semibold">
                  <span className={`prio ${prioClass(prio)}`}>{prio}</span>
                  Case #{c.caseNumber || c.serialNo} — {c.customerCode}
                </div>
                <div className="text-xs text-muted">
                  Court: {c.court || 'N/A'} · Lawyer: {c.lawyer || 'N/A'} · Accused: {c.accusedName || 'N/A'}
                </div>
              </div>
              <div className="min-w-[110px] text-right text-xs text-muted">
                {formatDate(c.nextHearingDate)}
                <div className="font-semibold text-bad">{days} days left</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <div className="kpi bg-gradient-to-br from-[#16a34a] to-[#0f9d76]">
          <div className="kpi-value">{recoveryRate}%</div>
          <div className="kpi-label">Overall Recovery Rate</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#e11d48] to-[#f97316]">
          <div className="kpi-value">{pendingDecision}</div>
          <div className="kpi-label">Cases Pending Decision</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#f59e0b] to-[#f43f5e]">
          <div className="kpi-value">{((casesFiled / totalCases) * 100).toFixed(1)}%</div>
          <div className="kpi-label">Case Filing Rate</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
          <div className="kpi-value">{lakh(totalRecovered)}</div>
          <div className="kpi-label">Total Amount Recovered</div>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="card-title">Dashboard Filters</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Business</label>
            <select className="input" value={filters.business} onChange={(e) => setFilters((f) => ({ ...f, business: e.target.value }))}>
              <option value="">All Businesses</option>
              {masterData.businesses.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Status</label>
            <select className="input" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {masterData.statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="filter-label">Depot</label>
            <select className="input" value={filters.depot} onChange={(e) => setFilters((f) => ({ ...f, depot: e.target.value }))}>
              <option value="">All Depots</option>
              {masterData.depots.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn-ghost" onClick={() => setFilters({ business: '', status: '', depot: '' })}>
            Reset Filters
          </button>
        </div>
      </div>
    </>
  )
}
