import type { ReactNode } from "react";

export function IconSwap({
  swapped,
  first,
  second,
}: {
  swapped: boolean;
  first: ReactNode;
  second: ReactNode;
}) {
  return (
    <span
      className={`icon-swap${swapped ? " is-swapped" : ""}`}
      aria-hidden="true"
    >
      <span className="icon-swap-first">{first}</span>
      <span className="icon-swap-second">{second}</span>
    </span>
  );
}
