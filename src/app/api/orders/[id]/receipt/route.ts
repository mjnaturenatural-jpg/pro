import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { connectDB } from "@/lib/db";
import { Order, SiteSettings } from "@/models";
import { getSession } from "@/lib/auth";
import { tokensMatch } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ReceiptOrder {
  orderNumber: string;
  paymentStatus: string;
  status: string;
  paymentMethod: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  createdAt: Date | string;
  paidAt: Date | string | null;
  notes: string;
  customer: { name: string; email: string; phone: string };
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: { name: string; packSize: string; quantity: number; price: number; mrp: number; subtotal: number }[];
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  shipping: number;
  tax: number;
  total: number;
}

const BRAND = "#173F2B";
const ACCENT = "#C53E1F";
const MUTED = "#5B6B66";
const LINE = "#E4DED6";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ist(d: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(d)) + " IST";
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    await connectDB();
    const order = (await Order.findById(params.id).lean()) as unknown as ReceiptOrder | null;
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const session = await getSession();
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isAdmin && !tokensMatch(token, (order as unknown as { accessToken?: string }).accessToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = (await SiteSettings.findOne({ key: "site" }).lean()) as unknown as {
      brandName?: string;
      phone?: string;
      contactEmail?: string;
      address?: string;
      gstNumber?: string;
      foodLicence?: string;
    } | null;

    const brand = settings?.brandName || "MJ Nature Natural";
    const paid = order.paymentStatus === "PAID";
    const title = paid ? "Payment Receipt" : "Order Summary — Payment Pending";
    const disclaimer = paid
      ? null
      : "This document is NOT a payment receipt. Payment has not been confirmed yet.";

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    // --- Header -------------------------------------------------------------
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
      if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 42, { width: 44 });
    } catch {
      /* logo optional */
    }
    const brandX = 104;
    doc.font("Helvetica-Bold").fontSize(16).fillColor(BRAND).text(brand, brandX, 46);
    doc.font("Helvetica").fontSize(8).fillColor(MUTED);
    const contactLines = [
      settings?.address || "",
      settings?.phone ? `Phone: ${settings.phone}` : "",
      settings?.contactEmail ? `Email: ${settings.contactEmail}` : "",
      settings?.foodLicence ? `FSSAI: ${settings.foodLicence}` : "",
      settings?.gstNumber ? `GSTIN: ${settings.gstNumber}` : "",
    ].filter(Boolean);
    let cy = 64;
    for (const line of contactLines) {
      doc.text(line, brandX, cy, { width: 250 });
      cy += 11;
    }

    doc.font("Helvetica-Bold").fontSize(13).fillColor(BRAND).text(title, 50, 46, { align: "right", width: 495 });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(paid ? BRAND : ACCENT)
      .text(paid ? "PAID" : order.paymentStatus, 50, 64, { align: "right", width: 495 });
    if (disclaimer) {
      doc.font("Helvetica").fontSize(7.5).fillColor(ACCENT).text(disclaimer, 330, 78, { align: "right", width: 215 });
    }

    let y = Math.max(cy + 14, 118);
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).lineWidth(1).stroke();
    y += 16;

    // --- Order meta ---------------------------------------------------------
    doc.font("Helvetica").fontSize(9).fillColor(MUTED);
    const meta: [string, string][] = [
      ["Order No.", order.orderNumber],
      ["Order Date", ist(order.createdAt)],
      ...(paid && order.paidAt ? ([["Paid On", ist(order.paidAt)]] as [string, string][]) : []),
      ...(order.razorpayPaymentId ? ([["Payment Ref", order.razorpayPaymentId]] as [string, string][]) : []),
      ["Payment Method", (order.paymentMethod || "razorpay").toUpperCase()],
    ];
    let mx = 50;
    for (const [label, value] of meta) {
      doc.font("Helvetica").fillColor(MUTED).fontSize(8).text(label, mx, y);
      doc.font("Helvetica-Bold").fillColor("#24302E").fontSize(9).text(value, mx, y + 11);
      mx += label === "Payment Method" ? 120 : 130;
    }
    y += 34;

    // --- Customer / address -------------------------------------------------
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();
    y += 14;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND).text("Billed & Shipped To", 50, y);
    y += 14;
    doc.font("Helvetica").fontSize(9).fillColor("#24302E");
    const addrLines = [
      order.address.fullName,
      [order.address.line1, order.address.line2].filter(Boolean).join(", "),
      order.address.area,
      `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
      `Phone: ${order.address.phone}`,
      order.customer?.email ? `Email: ${order.customer.email}` : "",
    ].filter(Boolean);
    for (const line of addrLines) {
      doc.text(line, 50, y, { width: 495 });
      y += 12;
    }
    y += 10;

    // --- Items table --------------------------------------------------------
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();
    y += 12;
    const cols = { name: 50, qty: 300, rate: 350, mrp: 420, amount: 475 };
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    doc.text("PRODUCT", cols.name, y, { width: 240 });
    doc.text("QTY", cols.qty, y, { width: 40, align: "right" });
    doc.text("RATE", cols.rate, y, { width: 60, align: "right" });
    doc.text("MRP", cols.mrp, y, { width: 45, align: "right" });
    doc.text("AMOUNT", cols.amount, y, { width: 70, align: "right" });
    y += 14;

    for (const item of order.items) {
      const nameH = doc.font("Helvetica").fontSize(9).heightOfString(item.name, { width: 235 });
      const packH = doc.fontSize(8).heightOfString(`Pack: ${item.packSize}`, { width: 235 });
      const rowH = Math.max(nameH + packH + 6, 26);
      if (y + rowH > 760) {
        doc.addPage();
        y = 50;
      }
      doc.font("Helvetica").fontSize(9).fillColor("#24302E").text(item.name, cols.name, y, { width: 235 });
      doc.fontSize(8).fillColor(MUTED).text(`Pack: ${item.packSize}`, cols.name, y + nameH + 2, { width: 235 });
      doc.fontSize(9).fillColor("#24302E");
      doc.text(String(item.quantity), cols.qty, y, { width: 40, align: "right" });
      doc.text(inr(item.price), cols.rate, y, { width: 60, align: "right" });
      if (item.mrp > item.price) {
        doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(inr(item.mrp), cols.mrp, y, { width: 45, align: "right" });
        doc.font("Helvetica").fontSize(9).fillColor("#24302E");
      } else {
        doc.fillColor(MUTED).fontSize(8).text("—", cols.mrp, y, { width: 45, align: "right" });
        doc.font("Helvetica").fontSize(9).fillColor("#24302E");
      }
      doc.text(inr(item.subtotal), cols.amount, y, { width: 70, align: "right" });
      y += rowH + 8;
    }

    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    // --- Totals -------------------------------------------------------------
    doc.moveTo(50, y).lineTo(545, y).strokeColor(LINE).stroke();
    y += 14;
    const totalsX = 360;
    const rowT = (label: string, value: string, opts?: { bold?: boolean; color?: string }) => {
      doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts?.bold ? 10 : 9)
        .fillColor(opts?.color || "#24302E");
      doc.text(label, totalsX, y, { width: 100 });
      doc.text(value, totalsX + 100, y, { width: 85, align: "right" });
      y += opts?.bold ? 16 : 13;
    };
    rowT("Subtotal", inr(order.subtotal));
    if (order.couponDiscount > 0) {
      rowT(`Coupon${order.couponCode ? ` (${order.couponCode})` : ""}`, `−${inr(order.couponDiscount)}`, { color: "#2E7D4F" });
    }
    rowT("Delivery", order.shipping === 0 ? "FREE" : inr(order.shipping));
    if (order.tax > 0) rowT("Tax", inr(order.tax));
    doc.moveTo(totalsX, y - 4).lineTo(545, y - 4).strokeColor(LINE).stroke();
    y += 4;
    rowT(paid ? "Amount Paid" : "Order Total", inr(order.total), { bold: true, color: BRAND });

    // --- Notes & footer -----------------------------------------------------
    if (order.notes) {
      y += 8;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("Order Notes", 50, y);
      doc.font("Helvetica").fontSize(8).fillColor("#24302E").text(order.notes, 50, y + 11, { width: 495 });
      y += 30;
    }
    const footerY = 790;
    doc.font("Helvetica").fontSize(7.5).fillColor(MUTED);
    doc.text(
      `Thank you for ordering from ${brand}. Questions? Reach us at ${settings?.phone || settings?.contactEmail || "our contact page"}.`,
      50,
      footerY - 14,
      { width: 495, align: "center" }
    );
    doc.text(
      `Generated ${ist(new Date())} · This receipt was produced from verified server-side order data.`,
      50,
      footerY,
      { width: 495, align: "center" }
    );

    doc.end();
    const pdf = await done;

    return new Response(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.length),
        "Content-Disposition": `attachment; filename="MJ-Nature-Order-${order.orderNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("receipt error", err);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
