"""
Script de Sincronização Automática de Dados de Futebol (Football-Data.co.uk)
-----------------------------------------------------------------------------
Este script é executado diariamente via GitHub Actions ou manualmente para:
1. Baixar os dados atualizados das ligas europeias do football-data.co.uk para a temporada 2627.
2. Ignorar silenciosamente campeonatos que ainda não iniciaram ou links indisponíveis sem abortar.
3. Consolidar os jogos, estatísticas e odds no formato exato de jogos_consolidados.csv.
4. Atualizar a base de dados do sistema (data/football_db.json) e o CSV consolidado.
"""

import os
import io
import json
import urllib.request
import urllib.error
from datetime import datetime
import pandas as pd

# Temporada Atual solicitada: 2627 (2026/2027)
TEMPORADA = os.environ.get('FOOTBALL_SEASON', '2627')

# Lista com a estrutura (PAIS, LIGA, LINK)
LIGAS_INFO = [
    ("ING", "Premier League", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/E0.csv"),
    ("ING", "Championship", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/E1.csv"),
    ("ING", "League 1", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/E2.csv"),
    ("ING", "League 2", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/E3.csv"),
    ("ESC", "Premiere League", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SC0.csv"),
    ("ESC", "Division 1", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SC1.csv"),
    ("ESC", "Division 2", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SC2.csv"),
    ("ESC", "Division 3", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SC3.csv"),
    ("ALE", "Bundesliga 1", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/D1.csv"),
    ("ALE", "Bundesliga 2", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/D2.csv"),
    ("ITA", "Serie A", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/I1.csv"),
    ("ITA", "Serie B", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/I2.csv"),
    ("ESP", "La Liga 1", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SP1.csv"),
    ("ESP", "La Liga 2", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/SP2.csv"),
    ("FRA", "Le Championnat", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/F1.csv"),
    ("FRA", "Division 2", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/F2.csv"),
    ("HOL", "Eredivisie", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/N1.csv"),
    ("BEL", "Jupiler League", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/B1.csv"),
    ("POR", "Liga I", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/P1.csv"),
    ("TUR", "Futbol Ligi 1", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/T1.csv"),
    ("GRE", "Ethniki Katigoria", f"https://www.football-data.co.uk/mmz4281/{TEMPORADA}/G1.csv")
]

# Mapeamento das siglas para nomes completos de países
MAPEAMENTO_PAISES = {
    "ING": "Inglaterra",
    "ESC": "Escócia",
    "ALE": "Alemanha",
    "ITA": "Itália",
    "ESP": "Espanha",
    "FRA": "França",
    "HOL": "Holanda",
    "BEL": "Bélgica",
    "POR": "Portugal",
    "TUR": "Turquia",
    "GRE": "Grécia"
}

# Lista de colunas para exclusão do CSV consolidado
COLUNAS_PARA_REMOVER = [
    "ï»¿Div", "Div", "FTR", "HTR", "BFDH", "BFDD", "BFDA", "BVH", "BVD", "BVA",
    "BWH", "BWD", "BWA", "PPH", "PPD", "PPA", "SKBH", "SKBD", "SKBA",
    "MaxH", "MaxD", "MaxA", "AvgH", "AvgD", "AvgA", "BFEH", "BFED", "BFEA",
    "MaxAHH", "MaxAHA", "AvgAHH", "AvgAHA", "BFEAHH", "BFEAHA", "B365CH",
    "B365CD", "B365CA", "BFDCH", "BFDCD", "BFDCA", "BVCH", "BVCD", "BVCA",
    "BWCH", "BWCD", "BWCA", "PPCH", "PPCD", "PPCA", "SKBCH", "SKBCD", "SKBCA",
    "MaxCH", "MaxCD", "MaxCA", "AvgCH", "AvgCD", "AvgCA", "BFECH", "BFECD",
    "BFECA", "B365C>2.5", "B365C<2.5", "MaxC>2.5", "MaxC<2.5", "AvgC>2.5",
    "AvgC<2.5", "BFEC>2.5", "BFEC<2.5", "AHCh", "B365CAHH", "B365CAHA",
    "MaxCAHH", "MaxCAHA", "AvgCAHH", "AvgCAHA", "BFECAHH", "BFECAHA",
    "Max>2.5", "Max<2.5", "Avg>2.5", "Avg<2.5", "BFE>2.5", "BFE<2.5"
]

# Dicionário de renomeação de colunas
MAPEAMENTO_COLUNAS = {
    "PAIS": "Pais",
    "LIGA": "Liga",
    "Date": "Data",
    "Time": "Hora",
    "HomeTeam": "Mandante",
    "AwayTeam": "Visitante",
    "FTHG": "Placar_Mandante_FT",
    "FTAG": "Placar_Visitante_FT",
    "HTHG": "Placar_Mandante_HT",
    "HTAG": "Placar_Visitante_HT",
    "Referee": "Arbitro",
    "HxG": "xG_Mandante_FT",
    "AxG": "xG_Visitante_FT",
    "HS": "Finalizacoes_Mandante_FT",
    "AS": "Finalizacoes_Visitante_FT",
    "HST": "Chutes_Gol_Mandante_FT",
    "AST": "Chutes_Gol_Visitante_FT",
    "HF": "Faltas_Mandante_FT",
    "AF": "Faltas_Visitante_FT",
    "HC": "Escanteios_Mandante_FT",
    "AC": "Escanteios_Visitante_FT",
    "HY": "Cartao_Amarelo_Mandante_FT",
    "AY": "Cartao_Amarelo_Visitante_FT",
    "HR": "Cartao_Vermelho_Mandante_FT",
    "AR": "Cartao_Vermelho_Visitante_FT",
    "B365H": "Odd_Home_FT",
    "B365D": "Odd_Draw_FT",
    "B365A": "Odd_Away_FT",
    "B365>2.5": "Odd_Over25_FT",
    "B365<2.5": "Odd_Under25_FT",
    "AHh": "Linha_Handicap_Asiático_Mandante_FT",
    "B365AHH": "Odd_Handicap_Asiático_Mandante_FT",
    "B365AHA": "Odd_Handicap_Asiático_Visitante_FT"
}

def parse_date_time(date_str, time_str=None):
    """Converte strings de data e hora para formato ISO 8601"""
    if pd.isna(date_str) or not str(date_str).strip():
        return datetime.utcnow().isoformat()
    
    clean_date = str(date_str).strip()
    clean_time = str(time_str).strip() if pd.notna(time_str) and str(time_str).strip() else "15:00"
    
    parsed_date = None
    for fmt in ["%d/%m/%Y", "%d/%m/%y", "%Y-%m-%d"]:
        try:
            parsed_date = datetime.strptime(clean_date, fmt)
            break
        except ValueError:
            continue
            
    if not parsed_date:
        parsed_date = datetime.utcnow()
        
    try:
        if len(clean_time) == 5:
            hour, minute = map(int, clean_time.split(':'))
        else:
            hour, minute = 15, 0
    except Exception:
        hour, minute = 15, 0
        
    final_dt = parsed_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return final_dt.isoformat()

def safe_num(val):
    """Converte valor para float ou int seguro, ou None"""
    if pd.isna(val):
        return None
    try:
        num = float(val)
        return int(num) if num.is_integer() else num
    except (ValueError, TypeError):
        return None

def fetch_and_consolidate_data():
    """Baixa os CSVs de todas as ligas configuradas. Ignora ligas não iniciadas."""
    dfs = []
    print(f"🔄 Iniciando o carregamento dos arquivos CSV (Temporada: {TEMPORADA})...\n")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    for pais, liga, url in LIGAS_INFO:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as response:
                content = response.read().decode('latin1')
                df = pd.read_csv(io.StringIO(content), on_bad_lines='skip')
            
            # Remove linhas totalmente vazias ou sem dados de jogos
            if 'HomeTeam' in df.columns:
                df = df.dropna(subset=['HomeTeam'])
                
            if not df.empty:
                # Insere a sigla do país no final do nome da liga
                liga_com_sigla = f"{liga} {pais}"
                df.insert(0, 'PAIS', pais)
                df.insert(1, 'LIGA', liga_com_sigla)
                dfs.append(df)
                print(f"✓ Sucesso: {pais} - {liga_com_sigla} ({len(df)} jogos carregados)")
            else:
                # Campeonato ainda não possui jogos registrados
                print(f"ℹ Ignorado (Campeonato ainda não começou ou sem jogos): {pais} - {liga}")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print(f"ℹ Ignorado (Campeonato ainda não iniciado / Arquivo não publicado no servidor): {pais} - {liga}")
            else:
                print(f"⚠ Aviso HTTP {e.code}: {pais} - {liga} ({url})")
        except Exception as e:
            # Ignora graciosamente sem travar o processamento
            print(f"ℹ Ignorado (Ainda não disponível): {pais} - {liga}")

    return dfs

def generate_consolidated_csv(dfs):
    """Gera o arquivo jogos_consolidados.csv exatamente com a formatação solicitada"""
    if not dfs:
        print("\nℹ Nenhum campeonato com jogos iniciados no momento para consolidar.")
        return None
        
    df_final = pd.concat(dfs, ignore_index=True)

    # Substitui as siglas pelos nomes completos na coluna PAIS
    df_final["PAIS"] = df_final["PAIS"].replace(MAPEAMENTO_PAISES)

    # Exclui apenas as colunas que realmente existem no DataFrame
    df_final = df_final.drop(columns=[col for col in COLUNAS_PARA_REMOVER if col in df_final.columns])

    # Renomeia as colunas do DataFrame
    df_final = df_final.rename(columns=MAPEAMENTO_COLUNAS)

    # Cria a coluna Linha_Handicap_Asiático_Visitante_FT com o sinal invertido
    if "Linha_Handicap_Asiático_Mandante_FT" in df_final.columns:
        df_final["Linha_Handicap_Asiático_Visitante_FT"] = pd.to_numeric(
            df_final["Linha_Handicap_Asiático_Mandante_FT"], errors='coerce'
        ).apply(lambda x: -x if pd.notnull(x) and x != 0 else x)

    # Reorganiza a ordem exata das colunas de Handicap Asiático
    colunas = list(df_final.columns)
    hc_cols = [
        "Linha_Handicap_Asiático_Mandante_FT",
        "Odd_Handicap_Asiático_Mandante_FT",
        "Linha_Handicap_Asiático_Visitante_FT",
        "Odd_Handicap_Asiático_Visitante_FT"
    ]

    if all(col in colunas for col in hc_cols):
        for col in hc_cols:
            colunas.remove(col)

        if "Odd_Under25_FT" in colunas:
            idx = colunas.index("Odd_Under25_FT") + 1
        else:
            idx = len(colunas)

        colunas[idx:idx] = hc_cols
        df_final = df_final[colunas]

    nome_arquivo_csv = "jogos_consolidados.csv"
    df_final.to_csv(nome_arquivo_csv, index=False, encoding='utf-8-sig')
    print(f"\n✓ Arquivo CSV consolidado '{nome_arquivo_csv}' atualizado com {len(df_final)} partidas.")
    return df_final

def update_system_database(dfs):
    """Atualiza o arquivo data/football_db.json do sistema preservando a estrutura"""
    if not dfs:
        return None
        
    os.makedirs('data', exist_ok=True)
    db_file_path = os.path.join('data', 'football_db.json')
    
    current_db = {"countries": [], "leagues": [], "teams": [], "matches": []}
    if os.path.exists(db_file_path):
        try:
            with open(db_file_path, 'r', encoding='utf-8') as f:
                current_db = json.load(f)
        except Exception as e:
            print(f"Erro ao ler banco existente, recriando: {e}")

    countries_map = {c['name'].upper(): c for c in current_db.get('countries', [])}
    leagues_map = {f"{l['countryName']}_{l['name']}".upper(): l for l in current_db.get('leagues', [])}
    teams_map = {t['name'].upper(): t for t in current_db.get('teams', [])}
    matches_map = {}
    
    for m in current_db.get('matches', []):
        key = f"{m.get('countryName')}_{m.get('leagueName')}_{m.get('homeTeamName')}_{m.get('awayTeamName')}_{m.get('matchDate', '')[:10]}".upper()
        matches_map[key] = m

    country_counter = len(countries_map) + 1
    league_counter = len(leagues_map) + 1
    team_counter = len(teams_map) + 1
    match_counter = len(matches_map) + 1

    updated_countries = list(current_db.get('countries', []))
    updated_leagues = list(current_db.get('leagues', []))
    updated_teams = list(current_db.get('teams', []))
    updated_matches = list(current_db.get('matches', []))

    for df in dfs:
        for _, row in df.iterrows():
            pais_code = str(row.get('PAIS', '')).strip()
            country_name = MAPEAMENTO_PAISES.get(pais_code, pais_code)
            league_name = str(row.get('LIGA', '')).strip()
            home_team_name = str(row.get('HomeTeam', '')).strip()
            away_team_name = str(row.get('AwayTeam', '')).strip()

            if not home_team_name or not away_team_name or pd.isna(home_team_name) or pd.isna(away_team_name):
                continue

            # 1. País
            c_key = country_name.upper()
            if c_key not in countries_map:
                country_obj = {
                    "id": f"PAIS-{country_counter:03d}",
                    "name": country_name,
                    "code": pais_code,
                    "createdAt": datetime.utcnow().isoformat()
                }
                country_counter += 1
                countries_map[c_key] = country_obj
                updated_countries.append(country_obj)
            else:
                country_obj = countries_map[c_key]

            # 2. Liga
            l_key = f"{country_name}_{league_name}".upper()
            if l_key not in leagues_map:
                league_obj = {
                    "id": f"LIGA-{league_counter:03d}",
                    "name": league_name,
                    "countryId": country_obj["id"],
                    "countryName": country_name,
                    "createdAt": datetime.utcnow().isoformat()
                }
                league_counter += 1
                leagues_map[l_key] = league_obj
                updated_leagues.append(league_obj)
            else:
                league_obj = leagues_map[l_key]

            # 3. Mandante
            ht_key = home_team_name.upper()
            if ht_key not in teams_map:
                home_team_obj = {
                    "id": f"TIME-{team_counter:03d}",
                    "name": home_team_name,
                    "countryId": country_obj["id"],
                    "countryName": country_name,
                    "leagueId": league_obj["id"],
                    "leagueName": league_name,
                    "createdAt": datetime.utcnow().isoformat()
                }
                team_counter += 1
                teams_map[ht_key] = home_team_obj
                updated_teams.append(home_team_obj)
            else:
                home_team_obj = teams_map[ht_key]

            # 4. Visitante
            at_key = away_team_name.upper()
            if at_key not in teams_map:
                away_team_obj = {
                    "id": f"TIME-{team_counter:03d}",
                    "name": away_team_name,
                    "countryId": country_obj["id"],
                    "countryName": country_name,
                    "leagueId": league_obj["id"],
                    "leagueName": league_name,
                    "createdAt": datetime.utcnow().isoformat()
                }
                team_counter += 1
                teams_map[at_key] = away_team_obj
                updated_teams.append(away_team_obj)
            else:
                away_team_obj = teams_map[at_key]

            # Data e Hora
            date_val = row.get('Date')
            time_val = row.get('Time')
            iso_date = parse_date_time(date_val, time_val)

            # Placar
            fthg = safe_num(row.get('FTHG'))
            ftag = safe_num(row.get('FTAG'))
            hthg = safe_num(row.get('HTHG'))
            htag = safe_num(row.get('HTAG'))

            status = "FINALIZADO" if fthg is not None and ftag is not None else "AGENDADO"

            # Estatísticas
            stats = {
                "halftimeHomeScore": hthg,
                "halftimeAwayScore": htag,
                "shotsHomeFT": safe_num(row.get('HS')),
                "shotsAwayFT": safe_num(row.get('AS')),
                "shotsOnTargetHomeFT": safe_num(row.get('HST')),
                "shotsOnTargetAwayFT": safe_num(row.get('AST')),
                "cornersHomeFT": safe_num(row.get('HC')),
                "cornersAwayFT": safe_num(row.get('AC')),
                "yellowCardsHomeFT": safe_num(row.get('HY')),
                "yellowCardsAwayFT": safe_num(row.get('AY')),
                "redCardsHomeFT": safe_num(row.get('HR')),
                "redCardsAwayFT": safe_num(row.get('AR')),
                "foulsHome": safe_num(row.get('HF')),
                "foulsAway": safe_num(row.get('AF')),
            }

            # Odds
            odds = {
                "homeFT": safe_num(row.get('B365H') or row.get('AvgH') or row.get('MaxH') or row.get('PSH')),
                "drawFT": safe_num(row.get('B365D') or row.get('AvgD') or row.get('MaxD') or row.get('PSD')),
                "awayFT": safe_num(row.get('B365A') or row.get('AvgA') or row.get('MaxA') or row.get('PSA')),
                "over25FT": safe_num(row.get('B365>2.5') or row.get('Avg>2.5') or row.get('Max>2.5') or row.get('P>2.5')),
                "under25FT": safe_num(row.get('B365<2.5') or row.get('Avg<2.5') or row.get('Max<2.5') or row.get('P<2.5')),
                "homeHT": safe_num(row.get('B365HHT')),
                "drawHT": safe_num(row.get('B365DHT')),
                "awayHT": safe_num(row.get('B365AHT')),
            }

            m_key = f"{country_name}_{league_name}_{home_team_name}_{away_team_name}_{iso_date[:10]}".upper()
            
            if m_key in matches_map:
                existing_match = matches_map[m_key]
                existing_match['homeScore'] = fthg
                existing_match['awayScore'] = ftag
                existing_match['status'] = status
                existing_match['matchDate'] = iso_date
                existing_match['referee'] = str(row.get('Referee', '')) if pd.notna(row.get('Referee')) else existing_match.get('referee', '')
                
                existing_stats = existing_match.get('stats', {})
                for k, v in stats.items():
                    if v is not None:
                        existing_stats[k] = v
                existing_match['stats'] = existing_stats

                existing_odds = existing_match.get('odds', {})
                for k, v in odds.items():
                    if v is not None:
                        existing_odds[k] = v
                existing_match['odds'] = existing_odds
            else:
                new_match = {
                    "id": f"JOGO-{match_counter:03d}",
                    "countryId": country_obj["id"],
                    "countryName": country_name,
                    "leagueId": league_obj["id"],
                    "leagueName": league_name,
                    "homeTeamId": home_team_obj["id"],
                    "homeTeamName": home_team_name,
                    "awayTeamId": away_team_obj["id"],
                    "awayTeamName": away_team_name,
                    "homeScore": fthg,
                    "awayScore": ftag,
                    "matchDate": iso_date,
                    "status": status,
                    "referee": str(row.get('Referee', '')) if pd.notna(row.get('Referee')) else '',
                    "stats": stats,
                    "odds": odds,
                    "createdAt": datetime.utcnow().isoformat()
                }
                match_counter += 1
                matches_map[m_key] = new_match
                updated_matches.append(new_match)

    final_db = {
        "countries": updated_countries,
        "leagues": updated_leagues,
        "teams": updated_teams,
        "matches": updated_matches
    }

    with open(db_file_path, 'w', encoding='utf-8') as f:
        json.dump(final_db, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Banco de Dados (data/football_db.json) sincronizado!")
    print(f"  - Países: {len(updated_countries)}")
    print(f"  - Ligas: {len(updated_leagues)}")
    print(f"  - Times: {len(updated_teams)}")
    print(f"  - Jogos: {len(updated_matches)}")

    return final_db

def main():
    print("==================================================")
    print(f"  SINCRONIZADOR AUTOMÁTICO DE FUTEBOL ({TEMPORADA})  ")
    print("==================================================")
    
    dfs = fetch_and_consolidate_data()
    
    if dfs:
        # 1. Gera jogos_consolidados.csv no padrão corrigido
        generate_consolidated_csv(dfs)

        # 2. Atualiza o banco estruturado do sistema
        update_system_database(dfs)
        
        print("\n--------------------------------------------------")
        print("✅ Sincronização e consolidação concluídas com sucesso!")
        print("--------------------------------------------------")
    else:
        print("\nℹ Nenhum jogo novo encontrado para a temporada 2627 no momento. Os arquivos existentes foram mantidos.")

if __name__ == "__main__":
    main()
