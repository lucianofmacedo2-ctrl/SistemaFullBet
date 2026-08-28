import React from 'react';
import { Target, Activity, Shield, Crosshair, ArrowUpRight, Zap } from 'lucide-react';
import { SectoralPowerRankings, AdvancedSectoralIndices, TeamPowerRating } from '../../utils/analysisEngine';
import { isValidImageUrl } from '../../utils/imageHelper';

interface SectoralPowerRadarProps {
  homeTeamName: string;
  awayTeamName: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  homeSectoral: SectoralPowerRankings;
  awaySectoral: SectoralPowerRankings;
  homeIndices: AdvancedSectoralIndices;
  awayIndices: AdvancedSectoralIndices;
  homePower?: TeamPowerRating;
  awayPower?: TeamPowerRating;
}

export const SectoralPowerRadar: React.FC<SectoralPowerRadarProps> = ({
  homeTeamName,
  awayTeamName,
  homeLogoUrl,
  awayLogoUrl,
  homeSectoral,
  awaySectoral,
  homeIndices,
  awayIndices,
  homePower,
  awayPower,
}) => {
  // 5 Axes for Radar Chart: Ataque, Meio-Campo, Defesa, Goleiro, Força Geral
  const axes = [
    { key: 'offensive', label: 'Ataque', max: 100 },
    { key: 'midfield', label: 'Meio-Campo', max: 100 },
    { key: 'defensive', label: 'Defesa', max: 100 },
    { key: 'goalkeeper', label: 'Goleiro', max: 100 },
    { key: 'overall', label: 'Geral', max: 100 },
  ] as const;

  const size = 260;
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (Math.PI * 2) / axes.length;

  // Calculate coordinates for polygon vertices
  const getCoordinates = (value: number, index: number) => {
    const norm = Math.min(Math.max(value || 50, 10), 100) / 100;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * norm * Math.cos(angle);
    const y = center + radius * norm * Math.sin(angle);
    return { x, y };
  };

  const getAxisEndpoint = (index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const labelX = center + (radius + 24) * Math.cos(angle);
    const labelY = center + (radius + 20) * Math.sin(angle);
    return { x, y, labelX, labelY };
  };

  const safeHomeSectoral = homeSectoral || { overall: 50, offensive: 50, midfield: 50, defensive: 50, goalkeeper: 50 };
  const safeAwaySectoral = awaySectoral || { overall: 50, offensive: 50, midfield: 50, defensive: 50, goalkeeper: 50 };

  const homePoints = axes
    .map((axis, i) => {
      const val = safeHomeSectoral[axis.key] ?? 50;
      const { x, y } = getCoordinates(val, i);
      return `${x},${y}`;
    })
    .join(' ');

  const awayPoints = axes
    .map((axis, i) => {
      const val = safeAwaySectoral[axis.key] ?? 50;
      const { x, y } = getCoordinates(val, i);
      return `${x},${y}`;
    })
    .join(' ');

  // Sector Comparison Items
  const hOff = safeHomeSectoral.offensive ?? 50;
  const aOff = safeAwaySectoral.offensive ?? 50;
  const hMid = safeHomeSectoral.midfield ?? 50;
  const aMid = safeAwaySectoral.midfield ?? 50;
  const hDef = safeHomeSectoral.defensive ?? 50;
  const aDef = safeAwaySectoral.defensive ?? 50;
  const hGk = safeHomeSectoral.goalkeeper ?? 50;
  const aGk = safeAwaySectoral.goalkeeper ?? 50;

  const hXG = homePower?.xgForAvg ?? 1.5;
  const aXG = awayPower?.xgForAvg ?? 1.2;
  const hShots = homePower?.shotsVolumeAvg ?? 12.0;
  const aShots = awayPower?.shotsVolumeAvg ?? 11.0;

  const hXGA = homePower?.xgAgainstAvg ?? 1.2;
  const aXGA = awayPower?.xgAgainstAvg ?? 1.5;

  const hPasses = homeIndices?.passesSuccessPct ?? 82;
  const aPasses = awayIndices?.passesSuccessPct ?? 80;
  const hPoss = homeIndices?.possessionAvg ?? 50;
  const aPoss = awayIndices?.possessionAvg ?? 50;
  const hTackles = homeIndices?.tacklesSuccessPct ?? 65;
  const aTackles = awayIndices?.tacklesSuccessPct ?? 64;

  const hGPrev = homeIndices?.goalsPreventedAvg ?? 0;
  const aGPrev = awayIndices?.goalsPreventedAvg ?? 0;

  const sectors = [
    {
      name: 'Ataque & Finalização',
      icon: Target,
      homeScore: hOff,
      awayScore: aOff,
      homeDetail: `${hXG.toFixed(2)} xG | ${hShots.toFixed(1)} chutes`,
      awayDetail: `${aXG.toFixed(2)} xG | ${aShots.toFixed(1)} chutes`,
      advantage:
        hOff > aOff + 3
          ? 'Mandante Superior'
          : aOff > hOff + 3
          ? 'Visitante Superior'
          : 'Equilibrado',
    },
    {
      name: 'Meio-Campo & Construção',
      icon: Activity,
      homeScore: hMid,
      awayScore: aMid,
      homeDetail: `${hPasses.toFixed(0)}% passes | ${hPoss.toFixed(0)}% posse`,
      awayDetail: `${aPasses.toFixed(0)}% passes | ${aPoss.toFixed(0)}% posse`,
      advantage:
        hMid > aMid + 3
          ? 'Mandante Superior'
          : aMid > hMid + 3
          ? 'Visitante Superior'
          : 'Equilibrado',
    },
    {
      name: 'Defesa & Duelos',
      icon: Shield,
      homeScore: hDef,
      awayScore: aDef,
      homeDetail: `${hXGA.toFixed(2)} xGA | ${hTackles.toFixed(0)}% desarmes`,
      awayDetail: `${aXGA.toFixed(2)} xGA | ${aTackles.toFixed(0)}% desarmes`,
      advantage:
        hDef > aDef + 3
          ? 'Mandante Superior'
          : aDef > hDef + 3
          ? 'Visitante Superior'
          : 'Equilibrado',
    },
    {
      name: 'Goleiro & Baliza',
      icon: Crosshair,
      homeScore: hGk,
      awayScore: aGk,
      homeDetail: `${hGPrev >= 0 ? '+' : ''}${hGPrev.toFixed(2)} gols evitados`,
      awayDetail: `${aGPrev >= 0 ? '+' : ''}${aGPrev.toFixed(2)} gols evitados`,
      advantage:
        hGk > aGk + 3
          ? 'Mandante Superior'
          : aGk > hGk + 3
          ? 'Visitante Superior'
          : 'Equilibrado',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Section: Radar Chart + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar SVG Visualizer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
          <div className="w-full flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-800">
            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Radar de Força Setorial</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-blue-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                {homeTeamName}
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                {awayTeamName}
              </span>
            </div>
          </div>

          <div className="relative py-2 flex items-center justify-center">
            <svg width={size} height={size} className="overflow-visible">
              {/* Background concentric polygons (rings at 25%, 50%, 75%, 100%) */}
              {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => {
                const ringPoints = axes
                  .map((_, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = center + radius * level * Math.cos(angle);
                    const y = center + radius * level * Math.sin(angle);
                    return `${x},${y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={lvlIdx}
                    points={ringPoints}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={lvlIdx === 3 ? '1.5' : '1'}
                    strokeDasharray={lvlIdx < 3 ? '3 3' : undefined}
                  />
                );
              })}

              {/* Axis spokes and labels */}
              {axes.map((axis, i) => {
                const { x, y, labelX, labelY } = getAxisEndpoint(i);
                return (
                  <g key={i}>
                    <line x1={center} y1={center} x2={x} y2={y} stroke="#475569" strokeWidth="1" />
                    <text
                      x={labelX}
                      y={labelY}
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {axis.label}
                    </text>
                  </g>
                );
              })}

              {/* Home Team Polygon (Blue) */}
              <polygon
                points={homePoints}
                fill="rgba(59, 130, 246, 0.35)"
                stroke="#3b82f6"
                strokeWidth="2.5"
                className="transition-all duration-500"
              />

              {/* Away Team Polygon (Amber) */}
              <polygon
                points={awayPoints}
                fill="rgba(245, 158, 11, 0.35)"
                stroke="#f59e0b"
                strokeWidth="2.5"
                className="transition-all duration-500"
              />

              {/* Dots at vertices */}
              {axes.map((axis, i) => {
                const hCoord = getCoordinates(safeHomeSectoral[axis.key] ?? 50, i);
                const aCoord = getCoordinates(safeAwaySectoral[axis.key] ?? 50, i);
                return (
                  <g key={i}>
                    <circle cx={hCoord.x} cy={hCoord.y} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                    <circle cx={aCoord.x} cy={aCoord.y} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-center text-[11px] pt-2 border-t border-slate-800 font-mono">
            <div className="bg-slate-800/80 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[10px]">{homeTeamName}</span>
              <span className="text-blue-400 font-bold">{(safeHomeSectoral.overall ?? 50).toFixed(1)} / 100</span>
            </div>
            <div className="bg-slate-800/80 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[10px]">{awayTeamName}</span>
              <span className="text-amber-400 font-bold">{(safeAwaySectoral.overall ?? 50).toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* 4 Sectors Detailed Breakdown (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              Comparativo Setor a Setor (0 a 100)
            </span>
          </div>

          <div className="space-y-2.5">
            {sectors.map((sec, idx) => {
              const Icon = sec.icon;
              const total = sec.homeScore + sec.awayScore;
              const homePct = total > 0 ? (sec.homeScore / total) * 100 : 50;

              return (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{sec.name}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sec.advantage.includes('Mandante')
                          ? 'bg-blue-100 text-blue-800'
                          : sec.advantage.includes('Visitante')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sec.advantage}
                    </span>
                  </div>

                  {/* Dual comparative progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-blue-700">
                        {sec.homeScore.toFixed(0)} <span className="text-[10px] text-slate-400 font-sans font-normal">pts</span>
                      </span>
                      <span className="font-bold text-amber-700">
                        {sec.awayScore.toFixed(0)} <span className="text-[10px] text-slate-400 font-sans font-normal">pts</span>
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full transition-all duration-500"
                        style={{ width: `${homePct}%` }}
                      ></div>
                      <div
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{ width: `${100 - homePct}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[48%]">{sec.homeDetail}</span>
                      <span className="truncate max-w-[48%] text-right">{sec.awayDetail}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: 3 Advanced Sectoral Indices (BTI, Finishing Efficiency, Goalkeeper Prevented) */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              Índices Quantitativos Avançados por Setor
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Métricas refinadas com base nas 111 variáveis estatísticas de jogos finalizados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Index 1: BTI & Verticalidade */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">1. Índice BTI / Verticalidade</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">Criação</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Mede a capacidade de transformar posse de bola em toques na área adversária e passes verticais no terço final.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{homeTeamName}</span>
                <span className="text-sm font-black text-blue-700">{(homeIndices?.bti ?? 0).toFixed(1)}</span>
                <span className="text-[9px] text-slate-500 block font-sans">{homeIndices?.btiLabel ?? 'Normal'}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{awayTeamName}</span>
                <span className="text-sm font-black text-amber-700">{(awayIndices?.bti ?? 0).toFixed(1)}</span>
                <span className="text-[9px] text-slate-500 block font-sans">{awayIndices?.btiLabel ?? 'Normal'}</span>
              </div>
            </div>
          </div>

          {/* Index 2: Eficiência de Finalização e xGOT */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">2. Eficiência de Finalização</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Ataque</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Relação de gols reais e xGOT sobre o xG gerado. Valores acima de 1.05x indicam alta letalidade dos atacantes.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{homeTeamName}</span>
                <span className={`text-sm font-black ${(homeIndices?.xgOverperformance ?? 0) >= 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {(homeIndices?.shotConversionRate ?? 10).toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {(homeIndices?.xgOverperformance ?? 0) >= 0 ? `+${(homeIndices?.xgOverperformance ?? 0).toFixed(2)}` : (homeIndices?.xgOverperformance ?? 0).toFixed(2)} xG
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{awayTeamName}</span>
                <span className={`text-sm font-black ${(awayIndices?.xgOverperformance ?? 0) >= 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {(awayIndices?.shotConversionRate ?? 10).toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500 block font-sans">
                  {(awayIndices?.xgOverperformance ?? 0) >= 0 ? `+${(awayIndices?.xgOverperformance ?? 0).toFixed(2)}` : (awayIndices?.xgOverperformance ?? 0).toFixed(2)} xG
                </span>
              </div>
            </div>
          </div>

          {/* Index 3: Gols Evitados & Baliza Segura */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">3. Gols Evitados / Baliza</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Goleiro</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Diferença entre xGOT enfrentado e gols sofridos reais. Saldo positivo representa defesas decisivas que salvaram pontos.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{homeTeamName}</span>
                <span className={`text-sm font-black ${(homeIndices?.goalsPreventedAvg ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {(homeIndices?.goalsPreventedAvg ?? 0) >= 0 ? `+${(homeIndices?.goalsPreventedAvg ?? 0).toFixed(2)}` : (homeIndices?.goalsPreventedAvg ?? 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block font-sans">{(homeIndices?.savesPct ?? 70).toFixed(0)}% defesas</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans">{awayTeamName}</span>
                <span className={`text-sm font-black ${(awayIndices?.goalsPreventedAvg ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {(awayIndices?.goalsPreventedAvg ?? 0) >= 0 ? `+${(awayIndices?.goalsPreventedAvg ?? 0).toFixed(2)}` : (awayIndices?.goalsPreventedAvg ?? 0).toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 block font-sans">{(awayIndices?.savesPct ?? 70).toFixed(0)}% defesas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

