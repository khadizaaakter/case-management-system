import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useStore } from '../store'
import { lakh, crore, daysUntil } from '../utils'

const AGE_COLORS = ['#2563eb', '#d97706', '#dc2626']

export default function Analytics() {
  const { cases } = useStore()

  const stats = useMemo(() => {
    const totalCases = cases.length
    const casesFiled = cases.filter((c) => c.caseFiled === 'Yes').length
    const totalDues = cases.reduce((s, c) => s + (c.presentDues || 0), 0)
    const totalRecovered = cases.reduce((s, c) => s + (c.totalRecovered || 0), 0)
    const recoveryRate =
      totalRecovered + totalDues > 0 ? (totalRecovered / (totalRecovered + totalDues)) * 100 : 0

    const age = { d30: 0, d60: 0, over: 0 }
    cases.forEach((c) => {
      if (!c.legalNoticeDate) return
      const days = -daysUntil(c.legalNoticeDate) // days elapsed since notice
      if (days <= 30) age.d30++
      else if (days <= 60) age.d60++
      else age.over++
    })

    const depots: Record<string, { cases: number; filed: number; recovered: number; dues: number }> = {}
    cases.forEach((c) => {
      const d = (depots[c.depot] ??= { cases: 0, filed: 0, recovered: 0, dues: 0 })
      d.cases++
      if (c.caseFiled === 'Yes') d.filed++
      d.recovered += c.totalRecovered || 0
      d.dues += c.presentDues || 0
    })

    return { totalCases, casesFiled, totalDues, totalRecovered, recoveryRate, age, depots }
  }, [cases])

  const ageData = [
    { name: '0-30 Days', value: stats.age.d30 },
    { name: '30-60 Days', value: stats.age.d60 },
    { name: 'Over 60 Days', value: stats.age.over },
  ]

  const depotChart = Object.entries(stats.depots).map(([name, d]) => ({
    name,
    rate: +(d.recovered + d.dues > 0 ? (d.recovered / (d.recovered + d.dues)) * 100 : 0).toFixed(1),
  }))

  const recTone =
    stats.recoveryRate > 60 ? 'border-l-ok' : stats.recoveryRate > 40 ? 'border-l-warn' : 'border-l-bad'

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <div className="kpi bg-gradient-to-br from-[#16a34a] to-[#0f9d76]">
          <div className="kpi-value">{stats.recoveryRate.toFixed(1)}%</div>
          <div className="kpi-label">Overall Recovery Rate</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#e11d48] to-[#f97316]">
          <div className="kpi-value">{stats.totalCases}</div>
          <div className="kpi-label">Total Active Cases</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#f59e0b] to-[#f43f5e]">
          <div className="kpi-value">{stats.casesFiled}</div>
          <div className="kpi-label">Cases Filed in Court</div>
        </div>
        <div className="kpi bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]">
          <div className="kpi-value">{crore(stats.totalRecovered)}</div>
          <div className="kpi-label">Total Amount Recovered</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
        <div className="card p-5">
          <h3 className="card-title">Case Aging Analysis</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="card-title">Depot-wise Recovery Rate (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={depotChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'rgba(79,70,229,0.06)' }} />
              <Bar dataKey="rate" fill="#4f46e5" radius={[5, 5, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden p-5">
        <h3 className="card-title">Depot Performance</h3>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Depot</th>
                <th className="!text-center">Total</th>
                <th className="!text-center">Filed</th>
                <th className="!text-center">Recovery Rate</th>
                <th className="!text-right">Recovered</th>
                <th className="!text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.depots).map(([depot, d]) => {
                const rate = d.recovered + d.dues > 0 ? (d.recovered / (d.recovered + d.dues)) * 100 : 0
                return (
                  <tr key={depot}>
                    <td className="font-medium">{depot}</td>
                    <td className="text-center">{d.cases}</td>
                    <td className="text-center">{d.filed}</td>
                    <td className="text-center">{rate.toFixed(1)}%</td>
                    <td className="text-right font-semibold text-ok tabular-nums">{lakh(d.recovered)}</td>
                    <td className="text-right font-semibold text-bad tabular-nums">{lakh(d.dues)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="card-title">Case Age Distribution</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <div className="rounded-md border border-border border-l-[3px] border-l-accent bg-bg px-4 py-3.5">
            <div className="text-[13px] font-semibold">0-30 Days Old</div>
            <div className="my-1.5 text-[26px] font-bold text-info">{stats.age.d30}</div>
            <div className="text-[12.5px] text-muted">Recent cases in notice period</div>
          </div>
          <div className="rounded-md border border-border border-l-[3px] border-l-warn bg-bg px-4 py-3.5">
            <div className="text-[13px] font-semibold">30-60 Days Old</div>
            <div className="my-1.5 text-[26px] font-bold text-warn">{stats.age.d60}</div>
            <div className="text-[12.5px] text-muted">Cases approaching filing deadline</div>
          </div>
          <div className="rounded-md border border-border border-l-[3px] border-l-bad bg-bg px-4 py-3.5">
            <div className="text-[13px] font-semibold">Over 60 Days Old</div>
            <div className="my-1.5 text-[26px] font-bold text-bad">{stats.age.over}</div>
            <div className="text-[12.5px] text-muted">Long-pending cases requiring attention</div>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-5">
        <h3 className="card-title">Key Performance Indicators</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          <div className="rounded-md border border-border border-l-[3px] border-l-ok bg-bg px-4 py-3.5">
            <div className="mb-1 text-[13px] font-semibold">Filing Compliance</div>
            <div className="text-[12.5px] leading-relaxed text-muted">
              {stats.totalCases ? ((stats.casesFiled / stats.totalCases) * 100).toFixed(1) : '0'}% of cases
              filed in court.{' '}
              {stats.casesFiled > stats.totalCases * 0.6
                ? 'High filing rate indicates active pursuit of recovery.'
                : 'Consider reviewing pending notice-period cases.'}
            </div>
          </div>
          <div className={`rounded-md border border-border border-l-[3px] bg-bg px-4 py-3.5 ${recTone}`}>
            <div className="mb-1 text-[13px] font-semibold">Recovery Performance</div>
            <div className="text-[12.5px] leading-relaxed text-muted">
              Current recovery rate is {stats.recoveryRate.toFixed(1)}%.{' '}
              {stats.recoveryRate > 60
                ? 'Excellent collection performance!'
                : stats.recoveryRate > 40
                ? 'Good progress, but further recovery efforts needed.'
                : 'Focus required on pending recoveries.'}
            </div>
          </div>
          <div className="rounded-md border border-border border-l-[3px] border-l-accent bg-bg px-4 py-3.5">
            <div className="mb-1 text-[13px] font-semibold">Financial Summary</div>
            <div className="text-[12.5px] leading-relaxed text-muted">
              Dues: {crore(stats.totalDues)} · Recovered: {crore(stats.totalRecovered)} · Outstanding:{' '}
              {crore(stats.totalDues - stats.totalRecovered)}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
