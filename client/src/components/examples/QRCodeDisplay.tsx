import QRCodeDisplay from "../QRCodeDisplay";

export default function QRCodeDisplayExample() {
  return (
    <div className="max-w-md mx-auto p-4">
      <QRCodeDisplay 
        url="https://directtip.app/sarah"
        workerName="Sarah Johnson"
      />
    </div>
  );
}
