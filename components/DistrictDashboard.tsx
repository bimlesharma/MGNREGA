'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';
import TrendChart from './TrendChart';
import ComparisonCard from './ComparisonCard';
import AlertsCard from './AlertsCard';
import Loading from './Loading';

interface DistrictDashboardProps {
  districtCode: string;
}

export default function DistrictDashboard({ districtCode }: DistrictDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtCode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/district?districtCode=${districtCode}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      
      // Check for error response
      if (dashboardData.error) {
        throw new Error(dashboardData.message || dashboardData.error);
      }
      
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button className="button" onClick={fetchDashboardData} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.latest) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>
          No data available for this district
        </p>
        {data?.message && (
          <p style={{ textAlign: 'center', color: '#c33', fontSize: '0.9rem' }}>
            {data.message}
          </p>
        )}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
            Try running the ETL to fetch data:
          </p>
          <code style={{ 
            background: '#f5f5f5', 
            padding: '0.5rem', 
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            npm run etl
          </code>
        </div>
      </div>
    );
  }

  const { district, latest, monthlyData, trends, stateAverage, alerts } = data;

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {district.districtName}
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          {district.stateName} • Financial Year: {latest.financialYear}
        </p>
      </div>

      {alerts && alerts.length > 0 && (
        <AlertsCard alerts={alerts} />
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <MetricCard
          label="Workdays Generated"
          value={latest.totalWorkdaysGenerated.toLocaleString()}
          trend={trends.workdaysTrend}
          trendValue={trends.workdaysChange}
        />
        <MetricCard
          label="Persons Worked"
          value={latest.totalPersonsWorked.toLocaleString()}
        />
        <MetricCard
          label="Households Worked"
          value={latest.totalHouseholdsWorked.toLocaleString()}
        />
        <MetricCard
          label="Average Workdays/Person"
          value={latest.averageWorkdaysPerPerson.toFixed(1)}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <MetricCard
          label="Total Expenditure"
          value={`₹${(latest.totalExpenditure / 10000000).toFixed(2)} Cr`}
          trend={trends.expenditureTrend}
          trendValue={trends.expenditureChange}
        />
        <MetricCard
          label="Works Completed"
          value={latest.totalWorksCompleted.toLocaleString()}
          trend={trends.worksTrend}
          trendValue={trends.worksChange}
        />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          Workdays Trend (Last 12 Months)
        </h3>
        <TrendChart data={monthlyData} dataKey="workdaysGenerated" />
      </div>

      {stateAverage && (
        <ComparisonCard
          districtData={latest}
          stateAverage={stateAverage}
          vsStateAverage={latest.vsStateAverage}
        />
      )}

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
          Performance Category
        </h3>
        <div style={{
          padding: '1rem',
          borderRadius: '6px',
          backgroundColor: getPerformanceColor(latest.performanceCategory),
          textAlign: 'center',
        }}>
          <strong style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>
            {latest.performanceCategory.replace('_', ' ')}
          </strong>
        </div>
      </div>
    </div>
  );
}

function getPerformanceColor(category: string): string {
  switch (category) {
    case 'excellent':
      return '#d4edda';
    case 'good':
      return '#d1ecf1';
    case 'average':
      return '#fff3cd';
    case 'below_average':
      return '#f8d7da';
    case 'poor':
      return '#f5c6cb';
    default:
      return '#f5f5f5';
  }
}
