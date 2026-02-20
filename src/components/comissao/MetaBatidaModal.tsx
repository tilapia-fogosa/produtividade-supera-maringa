import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface MetaBatidaModalProps {
  open: boolean;
  onClose: () => void;
  valorAtingido: number;
  valorMeta: number;
}

const CONFETTI_COLORS = [
  "#ff69b4", "#ffd700", "#87ceeb", "#98fb98", "#dda0dd",
  "#f0e68c", "#ff6b6b", "#4ecdc4", "#ff8c00", "#7b68ee",
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  shape: "circle" | "rect";
}

function CannonConfetti() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: -(150 + Math.random() * 200),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 4 + Math.random() * 4,
        rotation: Math.random() * 720 - 360,
        shape: Math.random() > 0.5 ? "circle" : "rect",
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: "50%",
            bottom: "0%",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{
            x: [0, p.x * 0.6, p.x],
            y: [0, p.y, p.y + 120],
            opacity: [0, 1, 1, 0],
            rotate: [0, p.rotation],
            scale: [0, 1.2, 1, 0.8],
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 0.3,
            ease: [0.22, 0.61, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

export default function MetaBatidaModal({ open, onClose, valorAtingido, valorMeta }: MetaBatidaModalProps) {
  const percentual = valorMeta > 0 ? Math.round((valorAtingido / valorMeta) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <AnimatePresence>{open && <CannonConfetti />}</AnimatePresence>

        <div className="relative z-10 flex flex-col items-center text-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <div className="rounded-full bg-primary/10 p-4">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </motion.div>

          <DialogHeader className="items-center">
            <DialogTitle className="text-2xl">🎉 Parabéns!</DialogTitle>
            <DialogDescription className="text-base mt-2">
              A meta de faturamento deste mês foi batida!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Faturamento atingido</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(valorAtingido)}</p>
            <p className="text-sm text-muted-foreground">
              {percentual}% da meta de {formatCurrency(valorMeta)}
            </p>
          </div>

          <Button onClick={onClose} className="mt-2">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
