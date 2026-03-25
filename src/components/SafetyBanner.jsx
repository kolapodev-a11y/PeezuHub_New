import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { SAFETY_TEXT, SAFETY_TIPS } from '../constants/data';

export default function SafetyBanner({ compact = false }) {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-soft">
      <div className="flex items-start gap-3">
        {compact ? <AlertTriangle className="mt-0.5" size={20} /> : <ShieldCheck className="mt-0.5" size={20} />}
        <div className="space-y-2">
          <p className="font-semibold">Safety First</p>
          <p className="text-sm leading-6">{SAFETY_TEXT}</p>
          {!compact && (
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {SAFETY_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
