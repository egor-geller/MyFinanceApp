import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { UserProfile, BudgetCategory } from '../types';
import { changeLanguage, useCurrencyLabel } from '../i18n';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const currencyLabel = useCurrencyLabel();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('NIS');
  const [emailReminders, setEmailReminders] = useState(true);
  const [emailMonthly, setEmailMonthly] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<unknown[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get<UserProfile & { email_reminders: boolean; email_monthly_report: boolean }>('/profile').then((r) => {
      setProfile(r.data);
      setIncome(r.data.monthly_income?.toString() ?? '');
      setCurrency(r.data.preferred_currency);
      setEmailReminders(r.data.email_reminders);
      setEmailMonthly(r.data.email_monthly_report);
    });
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await api.put('/profile', {
      monthly_income: income ? Number(income) : null,
      preferred_currency: currency,
      email_reminders: emailReminders,
      email_monthly_report: emailMonthly,
    });
    setSuccess(t('profile.saved'));
    setTimeout(() => setSuccess(''), 2000);
    setSaving(false);
  }

  async function addCategory() {
    if (!newCatName || !newCatAmount) return;
    await api.post('/profile/categories', { name: newCatName, monthly_amount: Number(newCatAmount) });
    setNewCatName(''); setNewCatAmount('');
    const r = await api.get<UserProfile>('/profile');
    setProfile(r.data);
  }

  async function deleteCategory(id: number) {
    await api.delete(`/profile/categories/${id}`);
    const r = await api.get<UserProfile>('/profile');
    setProfile(r.data);
  }

  async function handleImport() {
    if (!importFile) return;
    const form = new FormData();
    form.append('file', importFile);
    const res = await api.post<unknown[]>('/import/transactions', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setImportResults(res.data);
  }

  const input = 'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

      {/* Language selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-3">
        <h2 className="font-bold text-lg">{t('profile.language')}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              i18n.language === 'en'
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {t('profile.english')}
          </button>
          <button
            onClick={() => changeLanguage('he')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              i18n.language === 'he'
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {t('profile.hebrew')}
          </button>
        </div>
      </div>

      {/* Financial profile */}
      <form onSubmit={saveProfile} className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-lg">{t('profile.financialProfile')}</h2>
        {success && <p className="text-green-500 text-sm">{success}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t('profile.monthlyIncome')}</label>
            <input type="number" min={0} value={income} onChange={(e) => setIncome(e.target.value)}
              className={input} placeholder={t('common.optional')} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('profile.preferredCurrency')}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className={input.replace('bg-transparent', 'bg-white dark:bg-slate-800')}>
              {['NIS', 'USD', 'EUR', 'GBP'].map((c) => <option key={c} value={c}>{currencyLabel(c)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={emailReminders} onChange={(e) => setEmailReminders(e.target.checked)} className="accent-amber-500" />
            {t('profile.weeklyReminders')}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={emailMonthly} onChange={(e) => setEmailMonthly(e.target.checked)} className="accent-amber-500" />
            {t('profile.monthlyReport')}
          </label>
        </div>
        <button type="submit" disabled={saving}
          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-sm">
          {saving ? t('profile.saving') : t('profile.saveProfile')}
        </button>
      </form>

      {/* Budget categories */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-lg">{t('profile.budgetCategories')}</h2>
        <p className="text-sm text-slate-400">{t('profile.budgetDesc')}</p>
        {profile?.categories.map((c: BudgetCategory) => (
          <div key={c.id} className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
            <span>{c.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{c.monthly_amount} {currencyLabel(currency)}</span>
              <button onClick={() => deleteCategory(c.id)} className="text-red-400 hover:text-red-600 text-xs">
                {t('common.remove')}
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <input placeholder={t('profile.catName')} value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
            className={`${input} flex-1 min-w-0`} />
          <input type="number" placeholder={t('common.amount')} value={newCatAmount} onChange={(e) => setNewCatAmount(e.target.value)}
            className={`${input} !w-24 shrink-0`} />
          <button onClick={addCategory}
            className="shrink-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
            {t('common.add')}
          </button>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-lg">{t('profile.importTitle')}</h2>
        <p className="text-sm text-slate-400">{t('profile.importDesc')}</p>
        <div className="flex gap-2">
          <label className="flex-1 flex items-center gap-2 cursor-pointer">
            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
              {t('profile.chooseFile')}
            </span>
            <span className="text-sm text-slate-500 truncate">
              {importFile ? importFile.name : t('profile.noFileChosen')}
            </span>
            <input type="file" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              className="sr-only" />
          </label>
          <button onClick={handleImport} disabled={!importFile}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {t('common.analyze')}
          </button>
        </div>
        {importResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(importResults as Array<{ date: string; description: string; amount: number; matched_category: string | null; could_save: number | null }>).map((tx, i) => (
              <div key={i} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-xs">
                <p className="font-medium">{tx.description} — {tx.amount} {currency}</p>
                {tx.matched_category && (
                  <p className="text-amber-600">
                    {t('profile.couldSave', { amount: tx.could_save?.toFixed(2), category: tx.matched_category })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
