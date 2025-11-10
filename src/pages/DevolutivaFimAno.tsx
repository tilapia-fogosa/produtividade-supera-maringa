import React, { useMemo, useState } from 'react';
import templateOverlay from '@/assets/devolutiva-fim-ano-template-v2.png';
import './devolutiva-fim-ano.css';
import { useAlunosAtivos } from '@/hooks/use-alunos-ativos';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useProfessores } from '@/hooks/use-professores';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Briefcase } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { GoogleDrivePicker } from '@/components/devolutivas/GoogleDrivePicker';
import { useDesafios2025 } from '@/hooks/use-desafios-2025';
import { useExerciciosAbaco2025 } from '@/hooks/use-exercicios-abaco-2025';
import { useExerciciosAH2025 } from '@/hooks/use-exercicios-ah-2025';
import { Printer } from 'lucide-react';


const DevolutivaFimAno: React.FC = () => {
  const [tipoPessoa, setTipoPessoa] = useState<'aluno' | 'funcionario'>('aluno');
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState<string>('');
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [professorFiltro, setProfessorFiltro] = useState<string>('todos');
  const [tamanhoFoto, setTamanhoFoto] = useState<number>(57); // Tamanho em %
  const [posicaoX, setPosicaoX] = useState<number>(10); // Posição inicial em %
  const [posicaoY, setPosicaoY] = useState<number>(55); // Posição inicial em %
  const [tamanhoFonte, setTamanhoFonte] = useState<number>(40); // Tamanho da fonte em px
  const [alturaNome, setAlturaNome] = useState<number>(240); // Posição Y do nome em px
  const [mostrarControles, setMostrarControles] = useState<boolean>(true); // Mostrar/ocultar controles
  const [posicaoXExerciciosAbaco] = useState<number>(86); // Posição X dos exercícios ábaco
  const [posicaoXExerciciosAH] = useState<number>(17); // Posição X dos exercícios AH
  const [alturaExercicios] = useState<number>(155); // Altura dos exercícios em px

  const { alunos, loading: loadingPessoas, refetch: refetchAlunos } = useAlunosAtivos();
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const { professores, isLoading: loadingProfessores } = useProfessores();
  const { data: totalDesafios2025 = 0 } = useDesafios2025(pessoaSelecionadaId);
  const { data: totalExerciciosAbaco2025 = 0 } = useExerciciosAbaco2025(pessoaSelecionadaId);
  const { data: totalExerciciosAH2025 = 0 } = useExerciciosAH2025(pessoaSelecionadaId);

  const handlePhotoSelected = () => {
    // Recarregar dados para mostrar nova foto
    refetchAlunos();
  };

  // Filtrar pessoas baseado no tipo e filtros
  const pessoasFiltradas = useMemo(() => {
    let pessoas = alunos.filter(p => p.tipo_pessoa === tipoPessoa);

    if (tipoPessoa === 'aluno') {
      if (turmaFiltro !== 'todas') {
        pessoas = pessoas.filter(p => p.turma_id === turmaFiltro);
      }
      if (professorFiltro !== 'todos') {
        pessoas = pessoas.filter(p => {
          const turma = turmas.find(t => t.id === p.turma_id);
          return turma?.professor_id === professorFiltro;
        });
      }
    }

    return pessoas.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, tipoPessoa, turmaFiltro, professorFiltro, turmas]);

  const pessoaSelecionada = alunos.find(p => p.id === pessoaSelecionadaId);

  return (
    <div className="devolutiva-fim-ano-wrapper" style={{ paddingBottom: pessoaSelecionada?.foto_devolutiva_url ? '120px' : '0' }}>
      {/* Cabeçalho de seleção - não imprime */}
      <div className="no-print mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Toggle Aluno/Funcionário */}
              <div>
                <Label className="mb-2 block">Tipo</Label>
                <div className="flex gap-2">
                  <Button
                    variant={tipoPessoa === 'aluno' ? 'default' : 'outline'}
                    onClick={() => {
                      setTipoPessoa('aluno');
                      setPessoaSelecionadaId('');
                    }}
                    className="flex-1"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Aluno
                  </Button>
                  <Button
                    variant={tipoPessoa === 'funcionario' ? 'default' : 'outline'}
                    onClick={() => {
                      setTipoPessoa('funcionario');
                      setPessoaSelecionadaId('');
                      setTurmaFiltro('todas');
                      setProfessorFiltro('todos');
                    }}
                    className="flex-1"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Funcionário
                  </Button>
                </div>
              </div>

              {/* Filtros (apenas para alunos) */}
              {tipoPessoa === 'aluno' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="turma-filtro">Turma</Label>
                    <Select value={turmaFiltro} onValueChange={setTurmaFiltro}>
                      <SelectTrigger id="turma-filtro">
                        <SelectValue placeholder="Todas as turmas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as turmas</SelectItem>
                        {turmas.map(turma => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="professor-filtro">Professor</Label>
                    <Select value={professorFiltro} onValueChange={setProfessorFiltro}>
                      <SelectTrigger id="professor-filtro">
                        <SelectValue placeholder="Todos os professores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os professores</SelectItem>
                        {professores.map(professor => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Seleção da pessoa */}
              <div>
                <Label htmlFor="pessoa-select">
                  {tipoPessoa === 'aluno' ? 'Selecione o Aluno' : 'Selecione o Funcionário'}
                </Label>
                <Select value={pessoaSelecionadaId} onValueChange={setPessoaSelecionadaId}>
                  <SelectTrigger id="pessoa-select">
                    <SelectValue placeholder={`Selecione ${tipoPessoa === 'aluno' ? 'um aluno' : 'um funcionário'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {pessoasFiltradas.map(pessoa => (
                      <SelectItem key={pessoa.id} value={pessoa.id}>
                        {pessoa.nome} {pessoa.turma_nome ? `- ${pessoa.turma_nome}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Informações da pessoa selecionada */}
              {pessoaSelecionada && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                  <div>
                    <p className="font-semibold">{pessoaSelecionada.nome}</p>
                    {pessoaSelecionada.turma_nome && (
                      <p className="text-sm text-muted-foreground">Turma: {pessoaSelecionada.turma_nome}</p>
                    )}
                    {pessoaSelecionada.professor_nome && (
                      <p className="text-sm text-muted-foreground">Professor: {pessoaSelecionada.professor_nome}</p>
                    )}
                  </div>

                  {/* Seleção de foto do Google Drive */}
                  <div className="pt-3 border-t">
                    <Label className="mb-2 block">Foto para Devolutiva</Label>
                    <GoogleDrivePicker
                      onPhotoSelected={handlePhotoSelected}
                      currentPhotoUrl={pessoaSelecionada.foto_devolutiva_url}
                      pessoaId={pessoaSelecionada.id}
                      tipoPessoa={tipoPessoa}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Página A4 impressível */}
      <div className="devolutiva-fim-ano-container">
        <div className="a4-page">
          {/* Camada de fundo - FOTO DO ALUNO */}
          {pessoaSelecionada?.foto_devolutiva_url && (
            <div 
              className="foto-aluno-background"
              style={{
                backgroundImage: `url(${pessoaSelecionada.foto_devolutiva_url})`,
                backgroundSize: `${tamanhoFoto}%`,
                backgroundPosition: `${posicaoX}% ${posicaoY}%`
              }}
            />
          )}
          
          {/* Camada de overlay - TEMPLATE COM TRANSPARÊNCIA */}
          <img 
            src={templateOverlay} 
            alt="Template Devolutiva" 
            className="template-overlay"
          />
          
          {/* Nome do aluno */}
          {pessoaSelecionada && (
            <div 
              className="absolute font-abril-fatface"
              style={{
                top: `${alturaNome}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                color: '#000',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontSize: `${tamanhoFonte}px`
              }}
            >
              {pessoaSelecionada.nome}
            </div>
          )}
          
          {/* Total de desafios 2025 */}
          {pessoaSelecionada && (
            <div 
              className="absolute font-abril-fatface"
              style={{
                top: `${alturaExercicios}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3,
                color: '#000',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontSize: '30px'
              }}
            >
              {totalDesafios2025}
            </div>
          )}
          
          {/* Total de exercícios ábaco 2025 */}
          {pessoaSelecionada && (
            <div 
              className="absolute font-abril-fatface"
              style={{
                top: `${alturaExercicios}px`,
                left: `${posicaoXExerciciosAbaco}%`,
                transform: 'translateX(-50%)',
                zIndex: 3,
                color: '#000',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontSize: '30px'
              }}
            >
              {totalExerciciosAbaco2025}
            </div>
          )}
          
          {/* Total de exercícios AH 2025 */}
          {pessoaSelecionada && (
            <div 
              className="absolute font-abril-fatface"
              style={{
                top: `${alturaExercicios}px`,
                left: `${posicaoXExerciciosAH}%`,
                transform: 'translateX(-50%)',
                zIndex: 3,
                color: '#000',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontSize: '30px'
              }}
            >
              {totalExerciciosAH2025}
            </div>
          )}
        </div>
      </div>

      {/* Barra de controle de tamanho e posição - rodapé */}
      {pessoaSelecionada?.foto_devolutiva_url && (
        <>
          {/* Botão de impressão */}
          <Button
            onClick={() => window.print()}
            className="no-print fixed bottom-4 right-20 z-50 rounded-full w-12 h-12 p-0"
            variant="default"
            title="Imprimir devolutiva"
          >
            <Printer className="h-5 w-5" />
          </Button>

          {/* Botão para mostrar/ocultar controles */}
          <Button
            onClick={() => setMostrarControles(!mostrarControles)}
            className="no-print fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
            variant="default"
          >
            {mostrarControles ? '×' : '☰'}
          </Button>

          {/* Barra de controles */}
          {mostrarControles && (
            <div className="no-print fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-40">
              <div className="max-w-6xl mx-auto space-y-4">
                {/* Controle de tamanho */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Tamanho da Foto</Label>
                    <span className="text-sm text-muted-foreground">{tamanhoFoto}%</span>
                  </div>
                  <Slider
                    value={[tamanhoFoto]}
                    onValueChange={(value) => setTamanhoFoto(value[0])}
                    min={50}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Controles de posição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Posição X */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Posição X (Horizontal)</Label>
                      <span className="text-sm text-muted-foreground">{posicaoX}%</span>
                    </div>
                    <Slider
                      value={[posicaoX]}
                      onValueChange={(value) => setPosicaoX(value[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Posição Y */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Posição Y (Vertical)</Label>
                      <span className="text-sm text-muted-foreground">{posicaoY}%</span>
                    </div>
                    <Slider
                      value={[posicaoY]}
                      onValueChange={(value) => setPosicaoY(value[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Controles do nome */}
                {pessoaSelecionada && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    {/* Tamanho da fonte */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Tamanho da Fonte</Label>
                        <span className="text-sm text-muted-foreground">{tamanhoFonte}px</span>
                      </div>
                      <Slider
                        value={[tamanhoFonte]}
                        onValueChange={(value) => setTamanhoFonte(value[0])}
                        min={20}
                        max={80}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Altura do nome */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Altura do Nome</Label>
                        <span className="text-sm text-muted-foreground">{alturaNome}px</span>
                      </div>
                      <Slider
                        value={[alturaNome]}
                        onValueChange={(value) => setAlturaNome(value[0])}
                        min={0}
                        max={2000}
                        step={10}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DevolutivaFimAno;
