import { useActionState } from "react";
import { provisionBusinessAction, type ActionState } from "@/app/app/shiftpilot/actions";

const initialState: ActionState = {};
const zones = ["UTC", "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Europe/London", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Dubai", "Asia/Kolkata"];

export function OnboardingForm() {
  const [state, action, pending] = useActionState(provisionBusinessAction, initialState);
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Business name
        <input required name="name" maxLength={160} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
      </label>
      <label className="block text-sm font-medium">Business time zone
        <select name="timezone" defaultValue="UTC" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
          {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
        </select>
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {pending ? "Setting up…" : "Create business workspace"}
      </button>
    </form>
  );
}
