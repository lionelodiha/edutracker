export default function OverviewSkeleton() {
  return <div className="dz-page ov-page" aria-busy="true" aria-label="Loading school overview">
    <div className="ov-header"><div className="skeleton ov-header-tile" /><div className="ov-header-copy"><div className="skeleton" style={{ width: "min(260px, 70%)", height: 30, borderRadius: 6 }} /><div className="skeleton" style={{ width: "min(340px, 90%)", height: 14, borderRadius: 6, marginTop: 10 }} /></div></div>
    <div className="ov-stats">{Array.from({ length: 5 }, (_, index) => <div className="ov-stat" key={index}><div className="skeleton" style={{ width: 48, height: 28, borderRadius: 6 }} /><div className="skeleton" style={{ width: "60%", height: 12, borderRadius: 6 }} /></div>)}</div>
    <div className="ov-columns"><div className="skeleton" style={{ height: 280, borderRadius: 10 }} /><div className="skeleton" style={{ height: 280, borderRadius: 10 }} /></div>
  </div>;
}
