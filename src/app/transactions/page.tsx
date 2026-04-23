import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { TransactionsTable } from "@/components/blocks/TransactionsTable";
import { TableSkeleton } from "@/components/blocks/skeletons";
import { NewTransactionDialog } from "@/components/blocks/TransactionDialog";
import { ImportCsvDialog } from "@/components/blocks/ImportCsvDialog";
import {
  getAccounts,
  getInstruments,
  getTransactionsWithJoins,
} from "@/lib/data";

async function TransactionsSection({
  accounts,
  instruments,
}: {
  accounts: Awaited<ReturnType<typeof getAccounts>>;
  instruments: Awaited<ReturnType<typeof getInstruments>>;
}) {
  const rows = await getTransactionsWithJoins();
  return (
    <TransactionsTable
      rows={rows}
      accounts={accounts}
      instruments={instruments}
    />
  );
}

export default async function TransactionsPage() {
  const [accounts, instruments] = await Promise.all([
    getAccounts(),
    getInstruments(),
  ]);

  return (
    <>
      <Header title="자산 관리" subtitle="ASSET MANAGEMENT" />
      <section className="flex-1 space-y-4 overflow-auto p-4">
        <div className="flex justify-end gap-2">
          <ImportCsvDialog accounts={accounts} instruments={instruments} />
          <NewTransactionDialog accounts={accounts} instruments={instruments} />
        </div>
        <Suspense fallback={<TableSkeleton rows={8} />}>
          <TransactionsSection accounts={accounts} instruments={instruments} />
        </Suspense>
      </section>
    </>
  );
}
