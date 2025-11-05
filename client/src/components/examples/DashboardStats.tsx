import DashboardStats from "../DashboardStats";

export default function DashboardStatsExample() {
  const mockStats = {
    today: 2450,
    week: 15680,
    month: 48920,
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <DashboardStats stats={mockStats} />
    </div>
  );
}
