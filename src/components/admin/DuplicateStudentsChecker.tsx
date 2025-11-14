
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Users, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentRecord {
  id: string;
  active: boolean;
  turma: string;
  professor: string;
  codigo: string;
  created_at: string;
  updated_at: string;
}

interface DuplicateResult {
  studentName: string;
  totalRecords: number;
  activeRecords: number;
  inactiveRecords: number;
  hasProblem: boolean;
  records: StudentRecord[];
}

const DuplicateStudentsChecker: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DuplicateResult[]>([]);
  const [fixing, setFixing] = useState<string | null>(null);
  const { toast } = useToast();

  const studentNames = [
    "Eliane de Moura Santoro Felipe",
    "Vivyan Amarilys Moura Santoro Felipe"
  ];

  const checkDuplicates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-duplicate-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check',
          studentNames: studentNames
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        toast({
          title: "Verificação concluída",
          description: `Analisados ${studentNames.length} alunos`,
        });
      } else {
        throw new Error(data.error || 'Erro na verificação');
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar duplicatas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixDuplicate = async (studentName: string, keepRecordId: string) => {
    setFixing(studentName);
    try {
      const response = await fetch('/api/check-duplicate-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fix',
          studentName: studentName,
          keepRecordId: keepRecordId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Duplicação corrigida",
          description: `${data.data.recordsDeactivated} registros duplicados foram desativados`,
        });
        // Recarregar os resultados
        await checkDuplicates();
      } else {
        throw new Error(data.error || 'Erro na correção');
      }
    } catch (error) {
      console.error('Erro ao corrigir duplicata:', error);
      toast({
        title: "Erro",
        description: "Erro ao corrigir duplicata",
        variant: "destructive",
      });
    } finally {
      setFixing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Verificador de Alunos Duplicados
          </CardTitle>
          <CardDescription>
            Verifique e corrija registros duplicados de alunos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Alunos a verificar:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {studentNames.map((name, index) => (
                  <li key={index}>• {name}</li>
                ))}
              </ul>
            </div>
            
            <Button 
              onClick={checkDuplicates} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Duplicatas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className={result.hasProblem ? "border-red-200" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{result.studentName}</span>
                  <div className="flex items-center gap-2">
                    {result.hasProblem ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Duplicado
                      </Badge>
                    ) : (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
                        <CheckCircle className="h-3 w-3" />
                        OK
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {result.totalRecords} registro(s) encontrado(s) - 
                  {result.activeRecords} ativo(s) - 
                  {result.inactiveRecords} inativo(s)
                </CardDescription>
              </CardHeader>
              
              {result.records.length > 0 && (
                <CardContent>
                  <div className="space-y-3">
                    {result.records.map((record, recordIndex) => (
                      <div 
                        key={record.id}
                        className={`p-3 rounded-lg border ${
                          record.active 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant={record.active ? "default" : "secondary"}
                            className={record.active ? "bg-green-500" : ""}
                          >
                            {record.active ? "ATIVO" : "INATIVO"}
                          </Badge>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {record.id}
                          </code>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span><strong>Turma:</strong> {record.turma || 'Sem turma'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span><strong>Professor:</strong> {record.professor || 'Sem professor'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span><strong>Criado:</strong> {formatDate(record.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span><strong>Atualizado:</strong> {formatDate(record.updated_at)}</span>
                          </div>
                        </div>
                        
                        {record.codigo && (
                          <div className="mt-2 text-sm">
                            <strong>Código:</strong> {record.codigo}
                          </div>
                        )}
                        
                        {result.hasProblem && record.active && (
                          <div className="mt-3 pt-2 border-t border-gray-200">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixDuplicate(result.studentName, record.id)}
                              disabled={fixing === result.studentName}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {fixing === result.studentName 
                                ? 'Corrigindo...' 
                                : 'Manter este registro'
                              }
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DuplicateStudentsChecker;
