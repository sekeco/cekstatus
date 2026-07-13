"use client";

import { useEffect, useRef, useState } from "react";

import { Printer } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrderDetailResponse, StatusEventItem } from "@/lib/api";

import { Logo } from "./logo";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetailResponse;
  events: StatusEventItem[];
  orgName: string;
  orgAddress: string;
  orgPhone: string;
  orgSlogan: string;
}

function rp(v: number | null) {
  return v != null
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v)
    : "—";
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PAPER_WIDTH = 816;
const PAPER_HEIGHT = 1056;

// ─── InvoicePaper ──────────────────────────────────────────────────────────
// Renders at full Letter size. Used both in the modal preview (scaled) and
// in the print portal (full size via data-print-root CSS).
function InvoicePaper({ order, orgName, orgAddress, orgPhone, orgSlogan }: InvoiceModalProps) {
  return (
    <article
      data-print-paper
      style={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }}
      className="relative flex flex-col gap-6 bg-neutral-50 px-10 py-8 font-mono text-neutral-950"
    >
      {/* ── Header ── */}
      <header className="flex flex-col gap-5">
        <div className="grid grid-cols-2 items-start gap-14">
          <Logo className="size-10" />
          <h2 className="text-right text-3xl uppercase tracking-widest">Invoice</h2>
        </div>

        <div className="grid grid-cols-2 gap-14 text-[13px] leading-relaxed">
          <div>
            <p>
              No. Pesanan: <span className="font-semibold">{order.orderNumber}</span>
            </p>
            <p>Masuk: {fmt(order.createdAt)}</p>
            {order.completedAt && <p>Selesai: {fmt(order.completedAt)}</p>}
          </div>
          <div className="text-right">
            <p className="font-semibold">{orgName || "CekStatus"}</p>
            {orgPhone && <p>{orgPhone}</p>}
          </div>
        </div>

        {/* Status Badge */}
        {order.currentStatus && (
          <div className="flex">
            <span
              className="inline-block rounded-full px-4 py-1 font-semibold text-sm text-white"
              style={{
                backgroundColor: order.currentStatus.hexColor || "#6b7280",
              }}
            >
              {order.currentStatus.label}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-14 text-[13px] leading-relaxed">
          <div>
            <p className="mb-3 font-semibold text-[11px] uppercase">Dari</p>
            <p>{orgName || "CekStatus"}</p>
            {orgAddress && <p>{orgAddress}</p>}
            {orgPhone && <p>{orgPhone}</p>}
          </div>
          <div className="text-right">
            <p className="mb-3 font-semibold text-[11px] uppercase">Pelanggan</p>
            <p>{order.customerName || "—"}</p>
            <p>{order.label || order.problemDescription}</p>
          </div>
        </div>
      </header>

      {/* ── Items Table ── */}
      <div className="flex flex-col gap-4">
        <section className="text-[13px]">
          <div className="grid grid-cols-[1fr_110px_110px] bg-stone-200 px-3 py-2.5 font-semibold text-[11px] uppercase">
            <span>Deskripsi</span>
            <span className="text-right">Estimasi</span>
            <span className="text-right">Biaya</span>
          </div>
          <div className="grid grid-cols-[1fr_110px_110px] border-stone-300 border-b px-3 py-3">
            <span>{order.label || order.problemDescription}</span>
            <span className="text-right">{rp(order.estimatedCost)}</span>
            <span className="text-right font-semibold">{rp(order.finalCost)}</span>
          </div>
        </section>

        {/* ── Summary ── */}
        <div className="grid grid-cols-2 gap-14 text-[13px] leading-relaxed">
          <section className="col-start-2 space-y-1.5">
            <div className="flex justify-between gap-8">
              <span>Estimasi</span>
              <span>{rp(order.estimatedCost)}</span>
            </div>
            <div className="border-stone-300 border-y py-2.5">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">Total</span>
                <span className="font-semibold">{rp(order.finalCost)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-3 gap-6 text-[13px] leading-relaxed">
        <div>
          <p className="mb-0.5 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Prioritas</p>
          <p className="capitalize">
            {order.priority === "low"
              ? "Rendah"
              : order.priority === "normal"
                ? "Normal"
                : order.priority === "high"
                  ? "Tinggi"
                  : order.priority === "urgent"
                    ? "Urgent"
                    : order.priority}
          </p>
        </div>
        <div>
          <p className="mb-0.5 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Estimasi Selesai</p>
          <p>
            {(() => {
              const unit = (order.metadata && (order.metadata as Record<string, string>)?.etaUnit) || "hari";
              return order.etaValue != null ? `${order.etaValue} ${unit === "hours" ? "jam" : "hari"}` : "—";
            })()}
          </p>
        </div>
        <div>
          <p className="mb-0.5 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Status</p>
          <p>{order.currentStatus?.label || "—"}</p>
        </div>
      </div>

      {/* ── Notes ── */}
      {order.internalNotes && (
        <div className="bg-stone-100 px-4 py-3 text-[13px] leading-relaxed">
          <p className="mb-0.5 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Catatan</p>
          <p>{order.internalNotes}</p>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-auto grid grid-cols-2 gap-14 text-[13px] text-neutral-500 leading-relaxed">
        <div>{orgSlogan && <p>{orgSlogan}</p>}</div>
        <div className="text-right">
          <p>Invoice dibuat otomatis oleh CekStatus</p>
        </div>
      </footer>
    </article>
  );
}

// ─── InvoiceModal ──────────────────────────────────────────────────────────
export function InvoiceModal(props: InvoiceModalProps) {
  const { open, onOpenChange } = props;
  const [mounted, setMounted] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically scale the paper preview to fit the modal content width
  useEffect(() => {
    function updateScale() {
      if (!previewRef.current) return;
      const parent = previewRef.current.parentElement;
      if (!parent) return;
      const availableWidth = parent.clientWidth - 32; // 16px padding each side
      const nextScale = Math.min(1, availableWidth / PAPER_WIDTH);
      setScale(Math.max(0.1, nextScale));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (previewRef.current?.parentElement) {
      observer.observe(previewRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const scaledHeight = PAPER_HEIGHT * scale;

  return (
    <>
      {/* Print portal — hidden in UI, shown during window.print() */}
      {mounted &&
        createPortal(
          <div data-print-root>
            <InvoicePaper {...props} />
          </div>,
          document.body,
        )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <form onSubmit={(e) => e.preventDefault()}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice {props.order.orderNumber}</DialogTitle>
              <DialogDescription>Preview invoice untuk pesanan {props.order.orderNumber}</DialogDescription>
            </DialogHeader>

            {/* Scaled Paper Preview */}
            <div
              ref={previewRef}
              className="flex max-h-[50vh] justify-center overflow-y-auto rounded-xl bg-stone-200 dark:bg-stone-800"
            >
              <div
                style={{
                  width: PAPER_WIDTH * scale,
                  height: scaledHeight,
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: PAPER_WIDTH,
                    height: PAPER_HEIGHT,
                  }}
                >
                  <InvoicePaper {...props} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Tutup</Button>
              </DialogClose>
              <Button onClick={handlePrint}>
                <Printer className="mr-1.5 size-4" />
                Cetak
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
