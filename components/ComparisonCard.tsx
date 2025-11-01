interface ComparisonCardProps {
  districtData: any;
  stateAverage: any;
  vsStateAverage: number;
}

export default function ComparisonCard({ districtData, stateAverage, vsStateAverage }: ComparisonCardProps) {
  const isAboveAverage = vsStateAverage >= 0;

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
        Comparison with State Average
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Workdays Generated
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {districtData.totalWorkdaysGenerated.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            State Avg: {stateAverage.workdaysGenerated.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Average Workdays/Person
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {districtData.averageWorkdaysPerPerson.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            State Avg: {stateAverage.averageWorkdaysPerPerson.toFixed(1)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
            Performance vs State
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: isAboveAverage ? '#28a745' : '#dc3545',
            }}
          >
            {isAboveAverage ? '+' : ''}
            {vsStateAverage.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {isAboveAverage ? 'Above' : 'Below'} state average
          </div>
        </div>
      </div>
    </div>
  );
}
