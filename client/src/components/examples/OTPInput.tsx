import OTPInput from "../OTPInput";

export default function OTPInputExample() {
  return (
    <div className="max-w-md mx-auto p-4">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="font-semibold">Enter verification code</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a code to your email
          </p>
        </div>
        <OTPInput onComplete={(code) => console.log("OTP entered:", code)} />
      </div>
    </div>
  );
}
