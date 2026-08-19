"""
Script de Sincronização Automática de Dados de Futebol (Football-Data.co.uk)
-----------------------------------------------------------------------------
Este script é executado diariamente via GitHub Actions para:
1. Baixar os dados atualizados das principais ligas europeias do football-data.co.uk.
2. Consolidar os jogos, estatísticas (gols, chutes, escanteios, cartões) e odds.
3. Atualizar a base de dados do sistema (data/football_db.json) e gerar o CSV consolidado.
4. Opcionalmente, enviar os dados via POST para a API do sistema (se configurado).
"""

import os
import io
import json
import urllib.request
from datetime import datetime
import pandas as pd

# Mapeamento das ligas (PAIS, NOME_LIGA, URL_CSV)
LIGAS_INFO = [
    ("ING", "Premier League", "https://www.football-data.co.uk/mmz4281/2627/E0.csv"),
    ("ING", "Championship", "https://www.football-data.co.uk/mmz4281/2627/E1.csv"),
    ("ING", "League 1", "https://www.football-data.co.uk/mmz4281/2627/E2.csv"),
    ("ING", "League 2", "https://www.football-data.co.uk/mmz4281/2627/E3.csv"),
    ("ESC", "Premiere League", "https://www.football-data.co.uk/mmz4281/2627/SC0.csv"),
    ("ESC", "Division 1", "https://www.football-data.co.uk/mmz4281/2627/SC1.csv"),
    ("ESC", "Division 2", "https://www.football-data.co.uk/mmz4281/2627/SC2.csv"),
    ("ESC", "Division 3", "https://www.football-data.co.uk/mmz4281/2627/SC3.csv"),
    ("ALE", "Bundesliga 1", "https://www.football-data.co.uk/mmz4281/2627/D1.csv"),
    ("ALE", "Bundesliga 2", "https://www.football-data.co.uk/mmz4281/2627/D2.csv"),
    ("ITA", "Serie A", "https://www.football-data.co.uk/mmz4281/2627/I1.csv"),
    ("ITA", "Serie B", "https://www.football-data.co.uk/mmz4281/2627/I2.csv"),
    ("ESP", "La Liga 1", "https://www.football-data.co.uk/mmz4281/2627/SP1.csv"),
    ("ESP", "La Liga 2", "https://www.football-data.co.uk/mmz4281/2627/SP2.csv"),
    ("FRA", "Le Championnat", "https://www.football-data.co.uk/mmz4281/2627/F1.csv"),
    ("FRA", "Division 2", "https://www.football-data.co.uk/mmz4281/2627/F2.csv"),
    ("HOL", "Eredivisie", "https://www.football-data.co.uk/mmz4281/2627/N1.csv"),
    ("BEL", "Jupiler League", "https://www.football-data.co.uk/mmz4281/2627/B1.csv"),
    ("POR", "Liga I", "https://www.football-data.co.uk/mmz4281/2627/P1.csv"),
    ("TUR", "Futbol Ligi 1", "https://www.football-data.co.uk/mmz4281/2627/T1.csv"),
    ("GRE", "Ethniki Katigoria", "https://www.football-data.co.uk/mmz4281/2526/G1.csv")
]

# Nomes amigáveis para os países
COUNTRY_NAMES = {
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
    "GRE": "Grécia",
}

def parse_date_time(date_str, time_str=None):
    """Converte strings de data e hora para formato ISO 8601"""
    if pd.isna(date_str) or not str(date_str).strip():
        return datetime.utcnow().isoformat()
    
    clean_date = str(date_str).strip()
    clean_time = str(time_str).strip() if pd.notna(time_str) and str(time_str).strip() else "15:00"
    
    # Formatos de data comuns do football-data
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
    """Baixa os CSVs de todas as ligas configuradas"""
    dfs = []
    print("Iniciando o carregamento dos arquivos CSV do football-data.co.uk...\n")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    for pais, liga, url in LIGAS_INFO:
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read().decode('latin1')
                df = pd.read_csv(io.StringIO(content), on_bad_lines='skip')
            
            if 'HomeTeam' in df.columns:
                df = df.dropna(subset=['HomeTeam'])
                
            if not df.empty:
                df.insert(0, 'PAIS', pais)
                df.insert(1, 'LIGA', liga)
                dfs.append(df)
                print(f"✓ Sucesso: {pais} - {liga} ({len(df)} jogos)")
            else:
                print(f"⚠ Aviso: O link {pais} - {liga} não possui jogos válidos no momento.")
        except Exception as e:
            print(f"✗ Ignorado (Erro/Indisponível): {pais} - {liga} -> {e}")

    return dfs

def update_system_database(dfs):
    """Atualiza o arquivo data/football_db.json do sistema preservando a estrutura"""
    os.makedirs('data', exist_ok=True)
    db_file_path = os.path.join('data', 'football_db.json')
    
    # Carrega banco existente para preservar IDs existentes
    current_db = {"countries": [], "leagues": [], "teams": [], "matches": []}
    if os.path.exists(db_file_path):
        try:
            with open(db_file_path, 'r', encoding='utf-8') as f:
                current_db = json.load(f)
        except Exception as e:
            print(f"Erro ao ler banco existente, recriando: {e}")

    # Mapas de busca por nome
    countries_map = {c['name'].upper(): c for c in current_db.get('countries', [])}
    leagues_map = {f"{l['countryName']}_{l['name']}".upper(): l for l in current_db.get('leagues', [])}
    teams_map = {t['name'].upper(): t for t in current_db.get('teams', [])}
    matches_map = {}
    
    for m in current_db.get('matches', []):
        key = f"{m.get('countryName')}_{m.get('leagueName')}_{m.get('homeTeamName')}_{m.get('awayTeamName')}_{m.get('matchDate', '')[:10]}".upper()
        matches_map[key] = m

    # Gerador de IDs sequenciais
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
            country_name = COUNTRY_NAMES.get(pais_code, pais_code)
            league_name = str(row.get('LIGA', '')).strip()
            home_team_name = str(row.get('HomeTeam', '')).strip()
            away_team_name = str(row.get('AwayTeam', '')).strip()

            if not home_team_name or not away_team_name or pd.isna(home_team_name) or pd.isna(away_team_name):
                continue

            # 1. Garante País
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

            # 2. Garante Liga
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

            # 3. Garante Time Mandante
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

            # 4. Garante Time Visitante
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

            # Placar FT e HT
            fthg = safe_num(row.get('FTHG'))
            ftag = safe_num(row.get('FTAG'))
            hthg = safe_num(row.get('HTHG'))
            htag = safe_num(row.get('HTAG'))

            status = "FINALIZADO" if fthg is not None and ftag is not None else "AGENDADO"

            # Estatísticas Detalhadas
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
                # Atualiza jogo existente
                existing_match = matches_map[m_key]
                existing_match['homeScore'] = fthg
                existing_match['awayScore'] = ftag
                existing_match['status'] = status
                existing_match['matchDate'] = iso_date
                existing_match['referee'] = str(row.get('Referee', '')) if pd.notna(row.get('Referee')) else existing_match.get('referee', '')
                
                # Preserva estatísticas e adiciona novas
                existing_stats = existing_match.get('stats', {})
                for k, v in stats.items():
                    if v is not None:
                        existing_stats[k] = v
                existing_match['stats'] = existing_stats

                # Preserva odds e adiciona novas
                existing_odds = existing_match.get('odds', {})
                for k, v in odds.items():
                    if v is not None:
                        existing_odds[k] = v
                existing_match['odds'] = existing_odds
            else:
                # Cria novo registro de partida
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

    # Salva no arquivo JSON
    with open(db_file_path, 'w', encoding='utf-8') as f:
        json.dump(final_db, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Banco de Dados (data/football_db.json) atualizado com sucesso!")
    print(f"  - Países: {len(updated_countries)}")
    print(f"  - Ligas: {len(updated_leagues)}")
    print(f"  - Times: {len(updated_teams)}")
    print(f"  - Jogos: {len(updated_matches)}")

    # Opcional: Se houver URL de API configurada via variável de ambiente, envia via POST
    api_url = os.environ.get('APP_API_URL')
    if api_url:
        try:
            req = urllib.request.Request(
                f"{api_url.rstrip('/')}/api/db/save",
                data=json.dumps(final_db).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                print(f"✓ Dados sincronizados com a API externa: {api_url}")
        except Exception as e:
            print(f"⚠ Aviso ao enviar para API externa: {e}")

    return final_db

def main():
    print("==================================================")
    print("  SINCRONIZADOR AUTOMÁTICO DE DADOS DE FUTEBOL   ")
    print("==================================================")
    
    dfs = fetch_and_consolidate_data()
    
    if dfs:
        # 1. Gera CSV consolidado
        df_final = pd.concat(dfs, ignore_index=True)
        nome_arquivo_csv = "jogos_consolidados.csv"
        df_final.to_csv(nome_arquivo_csv, index=False, encoding='utf-8-sig')
        print(f"\n✓ Arquivo CSV '{nome_arquivo_csv}' gerado com {len(df_final)} jogos.")

        # 2. Atualiza o banco do sistema
        update_system_database(dfs)
        
        print("\n--------------------------------------------------")
        print("Processamento matinal concluído com sucesso!")
        print("--------------------------------------------------")
    else:
        print("\nNenhum jogo pôde ser carregado dos links fornecidos.")

if __name__ == "__main__":
    main()
