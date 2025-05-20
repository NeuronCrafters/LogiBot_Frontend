import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from "recharts";
import { Card } from "@/components/ui/card";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { motion } from "framer-motion";
import { logApi } from "@/services/apiClient";
import type { ChartFilterState } from "@/@types/ChartsType";

const barColors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export function CategoryChart({ filter }: { filter: ChartFilterState }) {
  console.log("CategoryChart - Renderizado com filtro:", filter);

  // Estados para gerenciar dados e estado de carregamento
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [lastFetchedId, setLastFetchedId] = useState<string | null>(null);

  // Extração e validação robusta do ID
  const validIds = Array.isArray(filter.ids) ? filter.ids.filter(id => typeof id === 'string' && id.trim() !== '') : [];
  const id = validIds[0] || "";
  const isValid = id !== "";

  // Função para buscar dados da API
  const fetchData = async () => {
    if (!isValid) {
      console.log("CategoryChart - ID inválido, não buscando dados");
      return;
    }

    // Verificar se já buscamos dados para este ID
    if (lastFetchedId === id && data !== null) {
      console.log("CategoryChart - Já temos dados para este ID, pulando fetch");
      return;
    }

    console.log("CategoryChart - Iniciando busca de dados para ID:", id);
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      console.log("CategoryChart - Buscando dados para:", filter.type, id);
      const response = await logApi.get<any>(
        filter.type,
        "subjects",
        "individual",
        id
      );

      console.log("CategoryChart - Dados recebidos:", response);
      setData(response);
      processData(response);
      setLastFetchedId(id);
    } catch (err: any) {
      console.error("CategoryChart - Erro ao buscar dados:", err);
      setIsError(true);
      setError(err?.message || "Erro ao carregar dados de categorias.");
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para processar os dados recebidos
  const processData = (rawData: any) => {
    if (!rawData) {
      setProcessedData([]);
      return;
    }

    try {
      console.log("CategoryChart - Processando dados:", rawData);
      let result: any[] = [];

      // Caso com subjectFrequency
      if (typeof rawData === 'object' && 'subjectFrequency' in rawData && typeof rawData.subjectFrequency === 'object') {
        console.log("CategoryChart - Formato: objeto com subjectFrequency");

        // Converter subjectFrequency para array de {category, value}
        result = Object.entries(rawData.subjectFrequency)
          .filter(([key, value]) => key && value)
          .map(([category, value]) => ({
            category,
            value: Number(value)
          }));
      }
      // Caso com mostAccessedSubjects
      else if (typeof rawData === 'object' && 'mostAccessedSubjects' in rawData && Array.isArray(rawData.mostAccessedSubjects)) {
        console.log("CategoryChart - Formato: objeto com mostAccessedSubjects");

        result = rawData.mostAccessedSubjects.map((item: any) => ({
          category: item.subject,
          value: Number(item.count)
        }));
      }
      // Caso com array de objetos
      else if (Array.isArray(rawData)) {
        console.log("CategoryChart - Formato: array de objetos");

        // Verificar se os objetos têm as propriedades necessárias
        if (rawData.length > 0 && typeof rawData[0] === 'object') {
          // Verificar quais propriedades usar como categoria e valor
          const sampleObject = rawData[0];
          let categoryKey = null;
          let valueKey = null;

          // Tentar encontrar chaves apropriadas
          for (const key of Object.keys(sampleObject)) {
            const keyLower = key.toLowerCase();
            if (
              keyLower.includes('category') ||
              keyLower.includes('subject') ||
              keyLower.includes('topic') ||
              keyLower.includes('name')
            ) {
              categoryKey = key;
            }

            if (
              keyLower.includes('value') ||
              keyLower.includes('count') ||
              keyLower.includes('frequency') ||
              keyLower.includes('total')
            ) {
              valueKey = key;
            }
          }

          if (categoryKey && valueKey) {
            console.log(`CategoryChart - Usando ${categoryKey} e ${valueKey} do array`);
            result = rawData.map((item: any) => ({
              category: item[categoryKey],
              value: Number(item[valueKey])
            }));
          }
        }
      }
      //
      // Se chegou até aqui, tenta extrair qualquer coisa útil do objeto
      else if (typeof rawData === 'object') {
        console.log("CategoryChart - Tentando extrair dados de formato desconhecido:", rawData);

        // Procurar qualquer objeto que possa conter frequências por assunto/categoria
        for (const [key, value] of Object.entries(rawData)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Verificar se este objeto parece uma tabela de frequências
            const entries = Object.entries(value);
            if (entries.length > 0 && typeof entries[0][1] === 'number') {
              console.log(`CategoryChart - Usando objeto ${key} como fonte de dados`);
              result = entries.map(([category, count]) => ({
                category,
                value: Number(count)
              }));
              break;
            }
          }
        }
      }

      if (result.length === 0) {
        console.log("CategoryChart - Formato desconhecido ou sem dados, não foi possível processar");
      } else {
        console.log("CategoryChart - Dados processados finais:", result);
      }

      setProcessedData(result);
    } catch (error) {
      console.error("CategoryChart - Erro ao processar dados:", error);
      setProcessedData([]);
    }
  };

  // Efeito para buscar dados quando o filtro mudar
  useEffect(() => {
    console.log("CategoryChart - Filtro mudou, ID:", id, "Válido:", isValid);
    if (isValid) {
      fetchData();
    } else {
      // Limpar dados quando não há ID válido
      setData(null);
      setProcessedData([]);
      setLastFetchedId(null);
    }
  }, [filter.type, id]);

  return (
    <Card className="p-4 bg-[#141414] border-white/10 w-full mb-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Typograph
            text="Distribuição por Assunto"
            variant="text6"
            weight="semibold"
            fontFamily="montserrat"
            colorText="text-white"
          />
          {!isLoading && !isError && processedData.length > 0 && (
            <div className="text-xs text-white/50">
              {processedData.length} categoria(s)
            </div>
          )}
        </div>

        {!isValid && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <p>Selecione uma entidade para visualizar dados</p>
          </div>
        )}

        {isValid && isLoading && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 rounded-full bg-indigo-600/30 mb-3"></div>
              <p>Carregando dados...</p>
            </div>
          </div>
        )}

        {isValid && isError && (
          <div className="flex items-center justify-center h-64 text-center text-red-400">
            <p>{error || "Erro ao carregar dados."}</p>
          </div>
        )}

        {isValid && !isLoading && !isError && processedData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} margin={{ top: 5, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="category" stroke="#999" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                <YAxis stroke="#999" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f1f1f", borderColor: "#333" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" name="Quantidade">
                  {processedData.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {isValid && !isLoading && !isError && processedData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-center text-white/70">
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Nenhum dado de categorias disponível para esta entidade.</p>
              <button
                onClick={fetchData}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}