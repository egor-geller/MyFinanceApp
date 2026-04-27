import { useState, useEffect } from 'react';
import api from '../api/client';
import PrivacyAmount from './PrivacyAmount';

interface Props { amount: number; base: string }

export default function CurrencyDisplay({ amount, base }: Props) {
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.get<{ rates: Record<string, number> }>(`/currency/rates?base=${base}`)
      .then((r) => setRates(r.data.rates))
      .catch(() => {});
  }, [base]);

  if (!rates) return <PrivacyAmount><span>{amount.toFixed(2)} {base}</span></PrivacyAmount>;

  const targets = ['USD', 'EUR'].filter((c) => c !== base && rates[c]);
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <PrivacyAmount className="font-bold text-amber-500">{amount.toFixed(2)} {base}</PrivacyAmount>
      {targets.map((c) => (
        <PrivacyAmount key={c} className="text-slate-500">
          ≈ {(amount * rates[c]).toFixed(2)} {c}
        </PrivacyAmount>
      ))}
    </div>
  );
}
