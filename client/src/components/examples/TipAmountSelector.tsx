import TipAmountSelector from "../TipAmountSelector";
import { useState } from "react";

export default function TipAmountSelectorExample() {
  const [selected, setSelected] = useState<number>();
  
  return (
    <div className="max-w-md mx-auto p-4">
      <TipAmountSelector 
        onAmountSelect={setSelected}
        selectedAmount={selected}
      />
      {selected && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Selected: ${(selected / 100).toFixed(2)}
        </div>
      )}
    </div>
  );
}
