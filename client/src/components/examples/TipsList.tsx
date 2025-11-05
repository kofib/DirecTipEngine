import TipsList from "../TipsList";

export default function TipsListExample() {
  const mockTips = [
    {
      id: "1",
      amountGrossCents: 500,
      amountNetCents: 480,
      currency: "USD",
      status: "succeeded" as const,
      note: "Great service, thank you!",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      amountGrossCents: 1000,
      amountNetCents: 970,
      currency: "USD",
      status: "succeeded" as const,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: "3",
      amountGrossCents: 200,
      amountNetCents: 190,
      currency: "USD",
      status: "succeeded" as const,
      note: "Keep up the good work!",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <TipsList tips={mockTips} />
    </div>
  );
}
