'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from 'chart.js'
import {
  ANALYTICS_OVERVIEW,
  ANALYTICS_SALES_SERIES,
  ANALYTICS_ORDERS_SERIES,
  CAMPAIGNS,
} from '../../lib/mockData'
import styles from './page.module.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const STATUS_LABEL = { active: 'Inaendelea', upcoming: 'Inakuja', ended: 'Imekwisha' };
const STATUS_CLASS = { active: 'statusActive', upcoming: 'statusUpcoming', ended: 'statusEnded' };

function formatTsh(n) {
  return `TSh ${n.toLocaleString('en-US')}`;
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: 'rgba(148,163,184,0.15)' }, ticks: { font: { size: 10 } } },
  },
};

// This whole page runs on mock data — see the comment block above the
// ANALYTICS_* / CAMPAIGNS exports in lib/mockData.js. It exists to shape
// the UI (what stats matter, what a campaign card needs) before wiring up
// analytics_events/campaigns tables in Supabase.
export default function FlexPage() {
  const router = useRouter();
  const salesData = useMemo(
    () => ({
      labels: ANALYTICS_SALES_SERIES.labels,
      datasets: [
        {
          label: 'Mauzo (TSh)',
          data: ANALYTICS_SALES_SERIES.sales,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37,99,235,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    }),
    []
  );

  const ordersData = useMemo(
    () => ({
      labels: ANALYTICS_ORDERS_SERIES.labels,
      datasets: [
        {
          label: 'Maagizo',
          data: ANALYTICS_ORDERS_SERIES.orders,
          backgroundColor: '#0891B2',
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    }),
    []
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <button className={styles.back} onClick={() => router.back()} aria-label="Rudi nyuma">
          <i className="ri-arrow-left-line" />
        </button>
        <h1 className={styles.title}>Uchambuzi wa Biashara</h1>
        <span className={styles.mockBadge}>
          <i className="ri-flask-line" />
          Mfano
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.subtitle}>Fuatilia mauzo, watazamaji na kampeni zako.</p>

        <div className={styles.statGrid}>
        {ANALYTICS_OVERVIEW.map((s) => (
          <div key={s.id} className={`card ${styles.statCard}`}>
            <div className={styles.statTop}>
              <i className={`${s.icon} ${styles.statIcon}`} />
              <span className={`${styles.delta} ${s.up ? styles.deltaUp : styles.deltaDown}`}>
                <i className={s.up ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} />
                {s.delta}
              </span>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className={`card ${styles.chartCard}`}>
          <p className={styles.sectionTitle}>Mauzo — Wiki Hii</p>
          <div className={styles.chartBox}>
            <Line data={salesData} options={CHART_OPTIONS} />
          </div>
        </div>
        <div className={`card ${styles.chartCard}`}>
          <p className={styles.sectionTitle}>Maagizo — Wiki 6 Zilizopita</p>
          <div className={styles.chartBox}>
            <Bar data={ordersData} options={CHART_OPTIONS} />
          </div>
        </div>
      </div>

      <div className={styles.campaignsHead}>
        <p className={styles.sectionTitle}>Kampeni Maalum</p>
        <button type="button" className={styles.newCampaignBtn}>
          <i className="ri-add-line" />
          Kampeni Mpya
        </button>
      </div>

      <div className={styles.campaignsGrid}>
        {CAMPAIGNS.map((c) => {
          const pct = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0;
          return (
            <div key={c.id} className={`card ${styles.campaignCard}`}>
              <div className={styles.campaignBanner} style={{ background: c.gradient }}>
                <i className={c.icon} />
              </div>
              <div className={styles.campaignBody}>
                <div className={styles.campaignTop}>
                  <span className={styles.campaignTitle}>{c.title}</span>
                  <span className={`${styles.statusPill} ${styles[STATUS_CLASS[c.status]]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p className={styles.campaignDates}>{c.dateRange}</p>

                <div className={styles.campaignStats}>
                  <div>
                    <span className={styles.campaignStatValue}>{c.reach.toLocaleString()}</span>
                    <span className={styles.campaignStatLabel}>Ufikiaji</span>
                  </div>
                  <div>
                    <span className={styles.campaignStatValue}>{c.clicks.toLocaleString()}</span>
                    <span className={styles.campaignStatLabel}>Mibofyo</span>
                  </div>
                </div>

                <div className={styles.budgetRow}>
                  <span>
                    {formatTsh(c.spend)} / {formatTsh(c.budget)}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className={styles.budgetTrack}>
                  <div className={styles.budgetFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
