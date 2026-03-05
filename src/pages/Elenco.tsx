import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  category: string;
  draft_position_group: string | null;
  athlete_photo_url: string | null;
  status: string;
}

const Elenco = () => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'masc' | 'fem' | 'juv'>('all');

  // Consulta de Atletas aprovados
  const { data: athletes, isLoading } = useQuery({
    queryKey: ['elenco-athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_registrations' as any)
        .select('id, name, category, draft_position_group, athlete_photo_url, status')
        .eq('status', 'approved')
        .order('name');

      if (error) {
        console.error('Erro ao buscar atletas:', error);
        throw error;
      }
      return (data || []) as unknown as Athlete[];
    }
  });

  // Filtros em memória
  const masculino = athletes?.filter(a => a.category === 'Masc') || [];
  const feminino = athletes?.filter(a => a.category === 'Feminino') || [];
  const juvenil = athletes?.filter(a => a.category?.includes('Juvenil')) || [];

  // Dentro do Masculino, separamos Forwards e Backs
  const mascForwards = masculino.filter(a => a.draft_position_group === 'Forward');
  const mascBacks = masculino.filter(a => a.draft_position_group === 'Back');
  // Se houver caras do masculino sem grupo (ou "Pool"), botamos num "A Definir" ou junto.
  // Pelo CSV, alguns estão vazios (Pool)
  const mascOther = masculino.filter(a => a.draft_position_group !== 'Forward' && a.draft_position_group !== 'Back');

  const getFirstName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 0 ? parts[0] + (parts.length > 1 ? ` ${parts[parts.length - 1]}` : '') : fullName;
  };

  const AthleteCard = ({ athlete }: { athlete: Athlete }) => (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all duration-300 group cursor-default">
      <CardContent className="p-0 relative">
        <div className="aspect-[3/4] overflow-hidden bg-secondary/30 relative flex items-center justify-center">
          {athlete.athlete_photo_url ? (
            <img
              src={athlete.athlete_photo_url}
              alt={athlete.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <User className="w-16 h-16 text-muted-foreground/30" />
          )}
          {/* Gradiente sutil para garantir leitura do texto */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-wide truncate">
            {getFirstName(athlete.name)}
          </h3>
          {athlete.category === 'Masc' && athlete.draft_position_group && (
            <p className="text-primary/90 text-sm font-medium">
              {athlete.draft_position_group === 'Back' ? 'Linha' : athlete.draft_position_group}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 mb-8">
      <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground/90">{title}</h2>
      <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/30">
      {/* Elementos de background premium */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto px-4 py-16 relative z-10 max-w-7xl">
        {/* Cabeçalho */}
        <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Nossos Atletas
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conheça o elenco que representa nossas cores com garra e dedicação dentro de campo.
          </p>
        </div>

        {/* Filtros em telas menores ou para navegação rápida */}
        <div className="flex flex-wrap justify-center gap-2 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-150">
          <Button
            variant={activeCategoryFilter === 'all' ? 'default' : 'outline'}
            className="rounded-full px-6"
            onClick={() => setActiveCategoryFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={activeCategoryFilter === 'masc' ? 'default' : 'outline'}
            className="rounded-full px-6"
            onClick={() => setActiveCategoryFilter('masc')}
          >
            Masculino Adulto
          </Button>
          <Button
            variant={activeCategoryFilter === 'fem' ? 'default' : 'outline'}
            className="rounded-full px-6"
            onClick={() => setActiveCategoryFilter('fem')}
          >
            Feminino Adulto
          </Button>
          <Button
            variant={activeCategoryFilter === 'juv' ? 'default' : 'outline'}
            className="rounded-full px-6"
            onClick={() => setActiveCategoryFilter('juv')}
          >
            Juvenil
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-24">

            {/* MASCULINO */}
            {(activeCategoryFilter === 'all' || activeCategoryFilter === 'masc') && masculino.length > 0 && (
              <div className="animate-in fade-in duration-1000">
                <SectionTitle title="Masculino Adulto" />

                {mascForwards.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Forwards
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {mascForwards.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                    </div>
                  </div>
                )}

                {mascBacks.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Linhas
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {mascBacks.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                    </div>
                  </div>
                )}

                {mascOther.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-xl font-bold text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      Pool / Outros
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {mascOther.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FEMININO */}
            {(activeCategoryFilter === 'all' || activeCategoryFilter === 'fem') && feminino.length > 0 && (
              <div className="animate-in fade-in duration-1000 delay-200">
                <SectionTitle title="Feminino Adulto" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {feminino.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                </div>
              </div>
            )}

            {/* JUVENIL */}
            {(activeCategoryFilter === 'all' || activeCategoryFilter === 'juv') && juvenil.length > 0 && (
              <div className="animate-in fade-in duration-1000 delay-300">
                <SectionTitle title="Juvenil" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {juvenil.map(athlete => <AthleteCard key={athlete.id} athlete={athlete} />)}
                </div>
              </div>
            )}

            {athletes?.length === 0 && (
              <div className="text-center py-24 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl">Nenhum atleta encontrado no momento.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Elenco;
