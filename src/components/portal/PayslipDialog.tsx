import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Eye } from "lucide-react";
import jsPDF from "jspdf";
// Logo removed

interface PayslipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  person: { name: string; cnpj: string | null; role: string; email: string | null };
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Brand colors
const NAVY = [28, 52, 92] as const;       // hsl(220, 50%, 18%) ≈ rgb
const CYAN = [26, 188, 220] as const;      // hsl(var(--primary)) ≈ rgb  
const GRAY_LIGHT = [240, 243, 248] as const;
const GRAY_TEXT = [100, 116, 139] as const;
const WHITE = [255, 255, 255] as const;

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export async function buildPayslipPdf(
  item: any,
  person: { name: string; cnpj: string | null; role: string; email: string | null },
  lineItems: { label: string; value: number; note?: string }[],
  total: number,
  mode: "save" | "preview" = "save"
) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const sheet = item.payroll_sheets;
  const period = `${MONTHS[sheet?.month]} / ${sheet?.year}`;
  const margin = 20;
  const contentW = w - margin * 2;

  // --- Header bar (navy) ---
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 40, "F");

  // Cyan accent line
  doc.setFillColor(...CYAN);
  doc.rect(0, 40, w, 2.5, "F");

  // No logo on header
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("JLVIANA", margin, 24);

  // "HOLERITE" title on the right
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("HOLERITE", w - margin, 19, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(period.toUpperCase(), w - margin, 28, { align: "right" });

  // --- Document info strip ---
  let y = 50;
  doc.setFillColor(...GRAY_LIGHT);
  doc.roundedRect(margin, y - 5, contentW, 32, 3, 3, "F");

  doc.setFontSize(8);
  doc.setTextColor(...GRAY_TEXT);
  doc.text("PRESTADOR", margin + 6, y + 1);
  doc.text("CNPJ", margin + 6, y + 14);
  doc.text("FUNÇÃO", w / 2 + 5, y + 1);
  doc.text("COMPETÊNCIA", w / 2 + 5, y + 14);

  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.text(person.name, margin + 6, y + 8);
  doc.text(person.cnpj || "—", margin + 6, y + 21);
  doc.text(person.role, w / 2 + 5, y + 8);
  doc.text(period, w / 2 + 5, y + 21);
  doc.setFont("helvetica", "normal");

  // --- Line items table ---
  y = 92;

  // Table header
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIÇÃO", margin + 6, y + 7);
  doc.text("VALOR", w - margin - 6, y + 7, { align: "right" });

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...NAVY);

  for (let i = 0; i < lineItems.length; i++) {
    const line = lineItems[i];

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(...GRAY_LIGHT);
      doc.rect(margin, y - 4.5, contentW, 10, "F");
    }

    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(line.label, margin + 6, y + 2);

    // Value — green for positive, red for negative
    const valStr = fmt(line.value);
    if (line.value < 0) {
      doc.setTextColor(200, 50, 50);
    } else {
      doc.setTextColor(...NAVY);
    }
    doc.setFont("helvetica", "bold");
    doc.text(valStr, w - margin - 6, y + 2, { align: "right" });
    doc.setFont("helvetica", "normal");

    if (line.note) {
      y += 8;
      doc.setFontSize(8);
      doc.setTextColor(...GRAY_TEXT);
      doc.text(`↳ ${line.note}`, margin + 10, y + 2);
    }
    y += 10;
  }

  // Debit note
  if (item.debit_note) {
    doc.setFillColor(255, 240, 240);
    doc.rect(margin, y - 4.5, contentW, item.debit_note_reason ? 18 : 10, "F");
    doc.setTextColor(200, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Nota de Débito", margin + 6, y + 2);
    doc.setFont("helvetica", "normal");
    if (item.debit_note_reason) {
      y += 8;
      doc.setFontSize(8);
      doc.text(`↳ ${item.debit_note_reason}`, margin + 10, y + 2);
    }
    y += 10;
  }

  // --- Total bar ---
  y += 4;
  doc.setFillColor(...CYAN);
  doc.roundedRect(margin, y, contentW, 16, 3, 3, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL LÍQUIDO", margin + 6, y + 11);
  doc.setFontSize(14);
  doc.text(fmt(total), w - margin - 6, y + 11, { align: "right" });

  // --- Payment info ---
  const paidAt = sheet?.paid_at ? new Date(sheet.paid_at).toLocaleDateString("pt-BR") : null;
  if (paidAt) {
    y += 24;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);
    doc.text(`Pagamento realizado em: ${paidAt}`, margin, y);
  }

  // --- Footer ---
  const footerY = h - 24;
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.8);
  doc.line(margin, footerY, w - margin, footerY);

  // "JLVIANA HUB PRO" — bold, prominent
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.text("JLVIANA HUB PRO", margin, footerY + 6);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY_TEXT);
  doc.setFont("helvetica", "normal");
  doc.text("Este documento é gerado automaticamente pelo sistema.", margin, footerY + 11);
  doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, w - margin, footerY + 6, { align: "right" });
  doc.text("contato@jlviana.com.br", w - margin, footerY + 11, { align: "right" });

  const filename = `holerite-${MONTHS[sheet?.month]?.toLowerCase()}-${sheet?.year}.pdf`;

  if (mode === "preview") {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  } else {
    doc.save(filename);
  }
}

export function PayslipDialog({ open, onOpenChange, item, person }: PayslipDialogProps) {
  if (!item) return null;

  const sheet = item.payroll_sheets;
  const period = `${MONTHS[sheet?.month]} / ${sheet?.year}`;
  const base = Number(item.base_value) || 0;
  const adjustments = Number(item.adjustments) || 0;
  const reimbursements = Number(item.reimbursements) || 0;
  const bonus = Number(item.bonus) || 0;
  const total = Number(item.total_value) || 0;

  const lineItems: { label: string; value: number; note?: string }[] = [
    { label: "Valor Base", value: base },
  ];
  if (adjustments !== 0) lineItems.push({ label: "Ajustes", value: adjustments, note: item.adjustment_reason });
  if (reimbursements > 0) lineItems.push({ label: "Reembolsos", value: reimbursements });
  if (bonus > 0) lineItems.push({ label: "Bonificação", value: bonus, note: item.bonus_reason });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Holerite — {period}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm">
          <p className="font-light">{person.name}</p>
          {person.cnpj && <p className="text-muted-foreground">CNPJ: {person.cnpj}</p>}
          <p className="text-muted-foreground">Função: {person.role}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          {lineItems.map((l, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm">
                <span>{l.label}</span>
                <span className="font-light">{fmt(l.value)}</span>
              </div>
              {l.note && <p className="text-xs text-muted-foreground ml-2">{l.note}</p>}
            </div>
          ))}
          {item.debit_note && (
            <div>
              <p className="text-sm text-destructive font-light">Nota de Débito</p>
              {item.debit_note_reason && <p className="text-xs text-muted-foreground ml-2">{item.debit_note_reason}</p>}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <span className="font-light">Total Líquido</span>
          <span className="text-lg font-light text-primary">{fmt(total)}</span>
        </div>

        {sheet?.paid_at && (
          <p className="text-xs text-muted-foreground">Pago em {new Date(sheet.paid_at).toLocaleDateString("pt-BR")}</p>
        )}

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={() => buildPayslipPdf(item, person, lineItems, total, "preview")}>
            <Eye className="h-4 w-4 mr-2" /> Visualizar PDF
          </Button>
          <Button className="flex-1" onClick={() => buildPayslipPdf(item, person, lineItems, total, "save")}>
            <Download className="h-4 w-4 mr-2" /> Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



