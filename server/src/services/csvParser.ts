import { parse } from 'csv-parse/sync';

export interface BankTransaction {
  date: string;
  description: string;
  amount: number;
}

export function parseBankCsv(csv: string): BankTransaction[] {
  const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  return records
    .map((r: Record<string, string>) => {
      const date = r['date'] ?? r['Date'] ?? r['DATE'] ?? '';
      const description = r['description'] ?? r['Description'] ?? r['memo'] ?? r['Memo'] ?? '';
      const rawAmount = r['amount'] ?? r['Amount'] ?? r['debit'] ?? r['Debit'] ?? '0';
      const amount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]/g, '')));
      return { date, description, amount };
    })
    .filter((t: BankTransaction) => t.amount > 0 && t.description);
}
