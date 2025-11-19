import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import templateV1 from '@/assets/devolutiva-fim-ano-template-v3.png';
import templateV2 from '@/assets/devolutiva-fim-ano-template-v2.png';
import './devolutiva-fim-ano.css';
import { useAlunosAtivos } from '@/hooks/use-alunos-ativos';
import { useTodasTurmas } from '@/hooks/use-todas-turmas';
import { useProfessores } from '@/hooks/use-professores';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { User, Briefcase, Printer, Eye, Download, ListChecks } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { GoogleDrivePicker } from '@/components/devolutivas/GoogleDrivePicker';
import { useDesafios2025 } from '@/hooks/use-desafios-2025';
import { useExerciciosAbaco2025 } from '@/hooks/use-exercicios-abaco-2025';
import { useExerciciosAH2025 } from '@/hooks/use-exercicios-ah-2025';
import { supabase } from '@/integrations/supabase/client';


const DevolutivaFimAno: React.FC = () => {
  const navigate = useNavigate();
  const [tipoPessoa, setTipoPessoa] = useState<'aluno' | 'funcionario'>('aluno');
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState<string>('');
  const [turmaFiltro, setTurmaFiltro] = useState<string>('todas');
  const [professorFiltro, setProfessorFiltro] = useState<string>('todos');
  
  // Estados separados para V1
  const [tamanhoFotoV1, setTamanhoFotoV1] = useState<number>(76);
  const [posicaoXV1, setPosicaoXV1] = useState<number>(48);
  const [posicaoYV1, setPosicaoYV1] = useState<number>(46);
  
  // Estados separados para V2
  const [tamanhoFotoV2, setTamanhoFotoV2] = useState<number>(56);
  const [posicaoXV2, setPosicaoXV2] = useState<number>(10);
  const [posicaoYV2, setPosicaoYV2] = useState<number>(58);
  
  const [tamanhoFonte, setTamanhoFonte] = useState<number>(40); // Tamanho da fonte em px
  const alturaNome = 22; // Posição Y do nome em % (fixo)
  const [mostrarControles, setMostrarControles] = useState<boolean>(true); // Mostrar/ocultar controles
  const [posicaoXExerciciosAbaco] = useState<number>(86); // Posição X dos exercícios ábaco
  const [posicaoXExerciciosAH] = useState<number>(17); // Posição X dos exercícios AH
  const alturaExercicios = 13; // Altura dos exercícios em % (fixo)
  const [mostrarPreview, setMostrarPreview] = useState<boolean>(false); // Modal de pré-visualização
  const [versaoTemplate, setVersaoTemplate] = useState<1 | 2>(2); // Versão do template (1 ou 2)
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now()); // Para forçar recarregamento da foto
  
  // Selecionar template baseado na versão
  const templateOverlay = versaoTemplate === 1 ? templateV1 : templateV2;

  const { alunos, loading: loadingPessoas, refetch: refetchAlunos } = useAlunosAtivos();
  const { turmas, loading: loadingTurmas } = useTodasTurmas();
  const { professores, isLoading: loadingProfessores } = useProfessores();
  const { data: totalDesafios2025 = 0 } = useDesafios2025(pessoaSelecionadaId);
  const { data: totalExerciciosAbaco2025 = 0 } = useExerciciosAbaco2025(pessoaSelecionadaId);
  const { data: totalExerciciosAH2025 = 0 } = useExerciciosAH2025(pessoaSelecionadaId);

  const handlePhotoSelected = () => {
    // Atualizar cache buster para forçar recarregamento da foto
    setCacheBuster(Date.now());
    // Recarregar dados para mostrar nova foto
    setTimeout(() => refetchAlunos(), 500);
  };

  // Valores computados baseados na versão selecionada
  const tamanhoFoto = versaoTemplate === 1 ? tamanhoFotoV1 : tamanhoFotoV2;
  const posicaoX = versaoTemplate === 1 ? posicaoXV1 : posicaoXV2;
  const posicaoY = versaoTemplate === 1 ? posicaoYV1 : posicaoYV2;

  const handleAbrirPaginaImpressao = () => {
    if (!pessoaSelecionada) return;
    
    // Salvar dados no sessionStorage
    const dadosImpressao = {
      nome: pessoaSelecionada.nome,
      fotoUrl: pessoaSelecionada.foto_devolutiva_url,
      tamanhoFoto,
      posicaoX,
      posicaoY,
      tamanhoFonte,
      alturaNome,
      alturaExercicios,
      posicaoXExerciciosAbaco,
      posicaoXExerciciosAH,
      totalDesafios: totalDesafios2025,
      totalExerciciosAbaco: totalExerciciosAbaco2025,
      totalExerciciosAH: totalExerciciosAH2025,
      versaoTemplate // Incluir versão do template
    };
    
    sessionStorage.setItem('devolutiva-impressao', JSON.stringify(dadosImpressao));
    
    // Abrir nova página
    window.open('/devolutiva-fim-ano-impressao', '_blank');
  };

  const handleSalvarPDF = async () => {
    if (!pessoaSelecionada) return;
    
    setMostrarPreview(false);
    
    try {
      console.log('🚀 Iniciando geração de PDF de alta qualidade...');
      
      // Construir URLs completas
      const fotoUrl = pessoaSelecionada.foto_devolutiva_url;
      const templateUrl = window.location.origin + (versaoTemplate === 1 ? templateV1 : templateV2);
      
      // Preparar dados para a edge function
      const payload = {
        nome: pessoaSelecionada.nome,
        fotoUrl,
        templateUrl,
        tamanhoFoto,
        posicaoX,
        posicaoY,
        tamanhoFonte,
        totalDesafios: totalDesafios2025,
        totalExerciciosAbaco: totalExerciciosAbaco2025,
        totalExerciciosAH: totalExerciciosAH2025,
        versaoTemplate,
        posicaoXExerciciosAbaco,
        posicaoXExerciciosAH,
        alturaExercicios,
        alturaNome
      };
      
      console.log('📤 Enviando dados para edge function...');
      
      // Chamar edge function
      const { data, error } = await supabase.functions.invoke(
        'generate-devolutiva-pdf',
        {
          body: payload,
        }
      );
      
      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw error;
      }
      
      console.log('📥 PDF recebido, iniciando download...');
      
      // Criar blob do PDF
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Criar link e fazer download
      const link = document.createElement('a');
      link.href = url;
      link.download = `devolutiva-${pessoaSelecionada.nome.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF baixado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Por favor, tente novamente ou use a opção de impressão rápida.');
    }
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
      {/* Cabeçalho */}
      <div className="no-print mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-azul-500">Devolutiva de Fim de Ano 2025</h1>
          <p className="text-sm text-muted-foreground">Geração personalizada de devolutivas</p>
        </div>
        <Button
          onClick={() => navigate('/devolutivas/controle')}
          variant="outline"
          className="gap-2"
        >
          <ListChecks className="h-4 w-4" />
          Controle
        </Button>
      </div>

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
                top: `${alturaNome}%`,
                left: '50%',
                transform: 'translate(-50%, -50%)',
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
                top: `${alturaExercicios}%`,
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
                top: `${alturaExercicios}%`,
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
                top: `${alturaExercicios}%`,
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

      {/* Modal de Pré-visualização */}
      {mostrarPreview && pessoaSelecionada?.foto_devolutiva_url && (
        <div 
          className="no-print fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setMostrarPreview(false)}
        >
          <div 
            className="relative bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pré-visualização de Impressão</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleSalvarPDF}
                  variant="default"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF (Recomendado)
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Impressão Rápida (Ctrl+P)
                </Button>
                <Button
                  onClick={() => setMostrarPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Fechar
                </Button>
              </div>
            </div>
            
            <div className="p-8">
              <div 
                className="a4-page" 
                style={{ 
                  boxShadow: '0 0 20px rgba(0,0,0,0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Camada de fundo - FOTO DO ALUNO */}
                {pessoaSelecionada?.foto_devolutiva_url && (
                  <div 
                    className="foto-aluno-background"
                    style={{
                      backgroundImage: `url(${pessoaSelecionada.foto_devolutiva_url}?t=${cacheBuster})`,
                      backgroundSize: `${tamanhoFoto}%`,
                      backgroundPosition: `${posicaoX}% ${posicaoY}%`,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundRepeat: 'no-repeat',
                      zIndex: 1
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
                <div 
                  className="absolute font-abril-fatface"
                  style={{
                    top: `${alturaNome}%`,
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 3,
                    color: '#000',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    fontSize: `${tamanhoFonte}px`
                  }}
                >
                  {pessoaSelecionada.nome}
                </div>
                
                {/* Total de desafios 2025 */}
                <div 
                  className="absolute font-abril-fatface"
                  style={{
                    top: `${alturaExercicios}%`,
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
                
                {/* Total de exercícios ábaco 2025 */}
                <div 
                  className="absolute font-abril-fatface"
                  style={{
                    top: `${alturaExercicios}%`,
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
                
                {/* Total de exercícios AH 2025 */}
                <div 
                  className="absolute font-abril-fatface"
                  style={{
                    top: `${alturaExercicios}%`,
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de controle de tamanho e posição - rodapé */}
      {pessoaSelecionada?.foto_devolutiva_url && (
        <>
          {/* Botões de seleção de versão */}
          <div className="no-print fixed bottom-4 left-4 z-50 flex gap-2">
            <Button
              onClick={() => setVersaoTemplate(1)}
              className={`rounded-full w-12 h-12 p-0 ${versaoTemplate === 1 ? 'ring-2 ring-primary' : ''}`}
              variant={versaoTemplate === 1 ? "default" : "outline"}
              title="Versão 1"
            >
              V1
            </Button>
            <Button
              onClick={() => setVersaoTemplate(2)}
              className={`rounded-full w-12 h-12 p-0 ${versaoTemplate === 2 ? 'ring-2 ring-primary' : ''}`}
              variant={versaoTemplate === 2 ? "default" : "outline"}
              title="Versão 2"
            >
              V2
            </Button>
          </div>
        
          {/* Botão de exportar PDF */}
          <Button
            onClick={handleSalvarPDF}
            className="no-print fixed bottom-4 right-20 z-50 rounded-full w-12 h-12 p-0"
            variant="default"
            title="Exportar PDF em alta qualidade (300 DPI) - Recomendado para impressão profissional"
          >
            <Download className="h-5 w-5" />
          </Button>

          {/* Botão para mostrar/ocultar controles */}
          <Button
            onClick={() => setMostrarControles(!mostrarControles)}
            className="no-print fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0"
            variant="default"
          >
            {mostrarControles ? '×' : '☰'}
          </Button>

          {/* Barra de controles - Design Minimalista */}
          {mostrarControles && (
            <div className="no-print fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg py-2 px-3 z-40">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                  {/* Tamanho da Foto */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Tamanho</span>
                    <Slider
                      value={[tamanhoFoto]}
                      onValueChange={(value) => {
                        if (versaoTemplate === 1) {
                          setTamanhoFotoV1(value[0]);
                        } else {
                          setTamanhoFotoV2(value[0]);
                        }
                      }}
                      min={50}
                      max={200}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">{tamanhoFoto}%</span>
                  </div>

                  {/* Posição X */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Pos. X</span>
                    <Slider
                      value={[posicaoX]}
                      onValueChange={(value) => {
                        if (versaoTemplate === 1) {
                          setPosicaoXV1(value[0]);
                        } else {
                          setPosicaoXV2(value[0]);
                        }
                      }}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">{posicaoX}%</span>
                  </div>

                  {/* Posição Y */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Pos. Y</span>
                    <Slider
                      value={[posicaoY]}
                      onValueChange={(value) => {
                        if (versaoTemplate === 1) {
                          setPosicaoYV1(value[0]);
                        } else {
                          setPosicaoYV2(value[0]);
                        }
                      }}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">{posicaoY}%</span>
                  </div>

                  {/* Tamanho da Fonte */}
                  {pessoaSelecionada && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">Fonte</span>
                      <Slider
                        value={[tamanhoFonte]}
                        onValueChange={(value) => setTamanhoFonte(value[0])}
                        min={20}
                        max={80}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs font-mono text-muted-foreground w-10 text-right shrink-0">{tamanhoFonte}px</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DevolutivaFimAno;
