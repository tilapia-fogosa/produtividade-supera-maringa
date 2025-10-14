import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import { RecolherApostilasModal } from "@/components/abrindo-horizontes/RecolherApostilasModal";
import { FilaApostilasTable } from "@/components/abrindo-horizontes/FilaApostilasTable";

const AbrindoHorizontesFila = () => {
  const [modalRecolherOpen, setModalRecolherOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Abrindo Horizontes
            </h1>
            <p className="text-muted-foreground">
              Fila de tarefas e correções pendentes
            </p>
          </div>
          
          <Button 
            onClick={() => setModalRecolherOpen(true)}
            className="w-full md:w-auto"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Recolher Apostilas
          </Button>
        </div>

        <FilaApostilasTable />
      </div>

      <RecolherApostilasModal 
        open={modalRecolherOpen}
        onOpenChange={setModalRecolherOpen}
      />
    </div>
  );
};

export default AbrindoHorizontesFila;
