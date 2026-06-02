import { InitialChoiceStep } from "@/components/Bot/InitialChoiceStep";

export function Start() {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto">
      <div className="w-full max-w-2xl px-4">
        <InitialChoiceStep />
      </div>
    </div>
  );
}
