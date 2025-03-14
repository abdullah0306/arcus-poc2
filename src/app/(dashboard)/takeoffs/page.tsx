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
import { CreateQuote } from "./create-quote";

interface Takeoff {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  updatedAt: string;
}

export default function TakeoffsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [takeoffs, setTakeoffs] = useState<Takeoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTakeoffs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/takeoffs");
      if (!response.ok) throw new Error("Failed to fetch takeoffs");
      const data = await response.json();
      setTakeoffs(data);
    } catch (error) {
      console.error("Failed to load takeoffs:", error);
      toast.error("Failed to load takeoffs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTakeoffs();
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
        <h1 className="text-2xl font-semibold tracking-tight">Takeoffs</h1>
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
            + Create quote
          </Button>
        </div>
      </div>

      <div className="rounded-md border shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-medium">
                <div className="flex items-center">
                  Takeoff
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
                  Loading takeoffs...
                </TableCell>
              </TableRow>
            ) : takeoffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No takeoffs found. Create your first takeoff!
                </TableCell>
              </TableRow>
            ) : (
              takeoffs.map((takeoff) => (
                <TableRow key={takeoff.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{takeoff.quoteNumber}</TableCell>
                  <TableCell>{formatDate(takeoff.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${
                        takeoff.status === "Approved" ? "bg-emerald-500" :
                        takeoff.status === "Rejected" ? "bg-red-500" :
                        "bg-yellow-500"
                      } mr-2`} />
                      <span className="text-sm">{takeoff.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{takeoff.clientName}</div>
                      <div className="text-sm text-muted-foreground">
                        {takeoff.clientEmail}
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

      <CreateQuote 
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          loadTakeoffs(); // Refresh the list after creating a new quote
        }}
      />
    </div>
  );
}
