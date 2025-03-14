"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronDown, Pencil, Download, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateInvoice } from "./create-invoice";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  status: "Pending" | "Paid" | "Cancelled" | "Refunded";
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error("Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="flex-1 p-8 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <div className="flex items-center gap-x-2">
          <Button 
            variant="outline" 
            className="h-9 px-3 lg:px-4 text-sm font-medium"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-sm font-medium"
          >
            + Create invoice
          </Button>
        </div>
      </div>

      <div className="rounded-md border shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Invoice
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Date
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Status
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Client
                  <ChevronDown className="h-4 w-4 ml-1 text-muted-foreground" />
                </div>
              </TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No invoices found. Create your first invoice!
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        invoice.status === "Paid" ? "bg-emerald-500" :
                        invoice.status === "Cancelled" ? "bg-red-500" :
                        invoice.status === "Refunded" ? "bg-purple-500" :
                        "bg-yellow-500"
                      } mr-2`} />
                      <span className="text-sm">{invoice.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.clientName}</div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.clientEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page 1 of 1
          </div>
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4"
              disabled
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-4"
              disabled
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <CreateInvoice
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={loadInvoices}
      />
    </div>
  );
}
