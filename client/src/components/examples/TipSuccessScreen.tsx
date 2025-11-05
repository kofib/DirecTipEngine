import TipSuccessScreen from "../TipSuccessScreen";

export default function TipSuccessScreenExample() {
  return (
    <div className="max-w-md mx-auto">
      <TipSuccessScreen 
        workerName="Sarah Johnson"
        amount={500}
        onSendAnother={() => console.log("Send another tip clicked")}
      />
    </div>
  );
}
