interface Alert {
  type: 'warning' | 'info' | 'critical';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

interface AlertsCardProps {
  alerts: Alert[];
}

export default function AlertsCard({ alerts }: AlertsCardProps) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
        Important Information
      </h3>
      {alerts.map((alert, index) => (
        <div key={index} className={`alert alert-${alert.type}`}>
          <strong>
            {alert.type === 'critical' && '⚠️ '}
            {alert.type === 'warning' && '⚠️ '}
            {alert.type === 'info' && 'ℹ️ '}
          </strong>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
