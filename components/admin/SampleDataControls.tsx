"use client";

import { useState } from "react";
import { btnSmall } from "../ui";
import { useAdminActions, useAdminOrders } from "./AdminData";

export function SampleDataControls() {
  const hasSample = useAdminOrders().some((o) => o.sample);
  const actions = useAdminActions();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void> | void) {
    setBusy(true);
    await action();
    setBusy(false);
  }

  return hasSample ? (
    <button type="button" disabled={busy} onClick={() => run(actions.clearSample)} className={`${btnSmall} disabled:cursor-wait disabled:opacity-60`}>
      {busy ? "Clearing…" : "Clear sample data"}
    </button>
  ) : (
    <button type="button" disabled={busy} onClick={() => run(actions.loadSample)} className={`${btnSmall} disabled:cursor-wait disabled:opacity-60`}>
      {busy ? "Loading…" : "Load sample data"}
    </button>
  );
}
