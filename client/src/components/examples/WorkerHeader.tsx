import WorkerHeader from "../WorkerHeader";

export default function WorkerHeaderExample() {
  return (
    <div className="max-w-md mx-auto">
      <WorkerHeader 
        displayName="Sarah Johnson"
        tipsEnabled={true}
      />
    </div>
  );
}
