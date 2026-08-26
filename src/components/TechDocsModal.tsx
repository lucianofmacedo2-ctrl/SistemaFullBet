import React from 'react';
import { X, Printer, Download, BookOpen, Layers, Cpu, ShieldCheck, Database, BarChart2 } from 'lucide-react';

interface TechDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechDocsModal: React.FC<TechDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="tech-docs-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static"
    >
      <div
        id="tech-docs-modal-container"
        className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full"
      >
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Documentação Técnica Oficial</h2>
              <p className="text-xs text-slate-500">Manual de Arquitetura, Motores e Funcionalidades do FUTLFM2</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-docs"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Salvar em PDF / Imprimir</span>
            </button>
            <button
              id="btn-close-docs"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content / Printable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-slate-800 font-sans print:p-6 print:overflow-visible print:text-black">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100 rounded-full mb-2">
                  Especificação Técnica de Sistema
                </span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">FUTLFM2 • Plataforma de Análise & Gestão Esportiva</h1>
                <p className="text-sm text-slate-500 mt-1">Versão 2.4 (Produção) • Documentação Arquitetural e Operacional Completa</p>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono hidden sm:block print:block">
                <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
                <div>Status: Homologado & Ativo</div>
              </div>
            </div>
          </div>

          {/* 1. Visão Geral da Arquitetura */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              1. Visão Geral da Arquitetura
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              O <strong>FUTLFM2</strong> é uma aplicação web SPA (<em>Single Page Application</em>) de alta performance focada em análise estatística pré-jogo, modelagem preditiva via distribuição probabilística e controle financeiro de apostas esportivas.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Frontend & Estilização</div>
                <div className="text-xs text-slate-600">React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Motion Animations.</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Cálculo & Modelagem</div>
                <div className="text-xs text-slate-600">Poisson Truncado, Expected Value (+EV), Análise Tática, Power Ranking e Normalização.</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900 text-sm mb-1">Persistência Híbrida</div>
                <div className="text-xs text-slate-600">Firebase Cloud Firestore em Tempo Real com tolerância a falhas via cache LocalStorage.</div>
              </div>
            </div>
          </section>

          {/* 2. Módulos Funcionais e Recursos da Interface */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              2. Módulos Funcionais do Sistema
            </h2>

            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.1. Painel de Análise Pré-Jogo & Power Ranking (6 Módulos Integrados)</h3>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li><strong>Módulo 1 (Forma Recente G5 & E5):</strong> Extração dos últimos 5 confrontos gerais e 5 confrontos específicos por mando (Casa/Fora) com escudos dos adversários e médias de gols.</li>
                  <li><strong>Módulo 2 (Power Ranking & Força Relativa):</strong> Cálculo quantitativo de ataque/defesa ponderado por mando de campo e índices de supremacia.</li>
                  <li><strong>Módulo 3 (Estatísticas Descritivas):</strong> Médias de Gols FT/HT, Finalizações, No Alvo, Cantos, Faltas, Cartões e percentuais de Ambos Marcam (BTTS) e Over/Under (1.5, 2.5, 3.5).</li>
                  <li><strong>Módulo 4 (Projeções Matemáticas & Poisson):</strong> Matriz de probabilidades de placar exato e probabilidades justas calculadas para 1X2, Over/Under, BTTS e Dupla Chance.</li>
                  <li><strong>Módulo 5 (Análise de Valor Esperado +EV & Tático):</strong> Comparativo direto entre Odd Calculada e Odd da Casa (Bet365), com destaque visual de valor esperado (+EV%).</li>
                  <li><strong>Módulo 6 (Classificação Dinâmica):</strong> Tabela da liga com pontuação, saldo de gols, aproveitamento e critérios reais de desempate.</li>
                </ul>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.2. Radar de Oportunidades (+EV com IA)</h3>
                <p className="text-xs text-slate-700">
                  Scanner automatizado que varre partidas agendadas da rodada e filtra discrepâncias matemáticas de mercado, oferecendo sugestões de entradas de valor categorizadas por nível de confiança e mercado.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.3. Gestão de Banca & Controle Financeiro (Bankroll Tracker)</h3>
                <p className="text-xs text-slate-700">
                  Registro completo de apostas esportivas com cálculo automático de <strong>Lucro Líquido, ROI (%), Yield (%), Winrate (%)</strong>, curva patrimonial gráfica e suporte a dimensionamento de stake (Critério de Kelly e Porcentagem Fixa).
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.4. Gestão de Partidas, Calendário e Gráficos de Pressão</h3>
                <p className="text-xs text-slate-700">
                  Visualização rápida por abas temporais (Hoje / Amanhã / Todos), inserção rápida de placares em lote e suporte a importação e visualização gráfica de pressão de ataques perigosos minuto a minuto.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.5. Cadastros de Entidades & Catálogo Oficial de Escudos</h3>
                <p className="text-xs text-slate-700">
                  Estrutura hierárquica completa (Países → Ligas → Equipes → Partidas). Inclui catálogo nativo com mais de 300 logos vetorizados oficiais e gestor de atribuição automática em lote para equipes sem imagem.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-sm font-bold text-emerald-700">2.6. Módulo de Árbitros & Impacto Disciplinar</h3>
                <p className="text-xs text-slate-700">
                  Acompanhamento de médias disciplinares por juiz (faltas por jogo, cartões amarelos, cartões vermelhos e pênaltis concedidos).
                </p>
              </div>
            </div>
          </section>

          {/* 3. Motores de Ingestão e Processamento */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Database className="w-5 h-5 text-emerald-600" />
              3. Motores de Ingestão e Tratamento de Dados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">excelHelper.ts & csvSyncParser.ts</div>
                <p>
                  Suporte a planilhas Excel (.xlsx) e arquivos CSV com reconhecimento flexível de cabeçalhos (PT/EN), mapeador de divisões internacionais (<code className="bg-slate-200 px-1 rounded">DIV_MAP</code>) e desduplicação por data e clubes.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">dbSanitizer.ts (Auto-Cura de Banco)</div>
                <p>
                  Varredura de integridade referencial: vincula times automaticamente aos jogos, cria times inéditos na base, resolve conflitos de IDs e auto-finaliza partidas que possuem placar preenchido.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Modelo de Dados Principal */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              4. Entidades do Banco de Dados
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Entidade</th>
                    <th className="p-2.5">Atributos Principais</th>
                    <th className="p-2.5">Propósito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-800">Match</td>
                    <td className="p-2.5">id, matchDate, countryId, leagueId, homeTeamId, awayTeamId, homeScore, awayScore, stats, odds</td>
                    <td className="p-2.5">Registro do jogo, placares FT/HT, scouts completos e cotações.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-800">Team</td>
                    <td className="p-2.5">id, name, countryId, leagueIds, logoUrl, stadium, capacity</td>
                    <td className="p-2.5">Dados cadastrais dos clubes e associações a campeonatos.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-800">League / Country</td>
                    <td className="p-2.5">id, name, countryId, flagUrl, season, tiebreakRules</td>
                    <td className="p-2.5">Estrutura de divisões e critérios de classificação.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-800">Bet</td>
                    <td className="p-2.5">id, matchId, market, selection, odd, stake, status, profit</td>
                    <td className="p-2.5">Operações de apostas para rastreamento de banca.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-800">User</td>
                    <td className="p-2.5">id, username, role (master/user), active, expiresAt</td>
                    <td className="p-2.5">Controle de acesso, permissões e sessões.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Segurança & Backup */}
          <section className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              5. Segurança, Backup e Restauração
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O sistema conta com exportação e importação manual instantânea em JSON, permitindo backups periódicos locais, além da sincronização em tempo real com o banco de dados em nuvem Google Cloud Firestore.
            </p>
          </section>
        </div>

        {/* Modal Footer - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 print:hidden">
          <span className="text-xs text-slate-500">
            Dica: No diálogo de impressão, escolha <strong>"Salvar como PDF"</strong> para gerar o arquivo digital.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
