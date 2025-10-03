import pandas as pd
import glob
import json
import os
from datetime import datetime, time

def excel_serial_to_datetime(serial):
    if pd.isna(serial) or not isinstance(serial, (int, float)) or serial <= 0:
        return None
    return pd.to_datetime('1899-12-30') + pd.to_timedelta(serial, 'D')

def format_time_from_serial(serial):
    dt = excel_serial_to_datetime(serial)
    return dt.strftime('%H:%M') if dt else ""

def process_files():
    print("Iniciando processamento dos arquivos Excel...")
    
    file_paths = glob.glob("dados_brutos/*.xlsx")
    if not file_paths:
        print("Nenhum arquivo Excel encontrado na pasta 'dados_brutos'.")
        with open('docs/data.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
        return

    try:
        df_list = [pd.read_excel(f) for f in file_paths]
        df = pd.concat(df_list, ignore_index=True)
        print(f"{len(df)} linhas de dados carregadas de {len(file_paths)} arquivo(s).")
    except Exception as e:
        print(f"Erro ao ler ou concatenar os arquivos Excel: {e}")
        return

    required_columns = [
        'ATIVO', 'Atividade', 'Inicia', 'HR Turma Pronta', 'Duração', 'SB', 'SB_4',
        'Quantidade', 'Quantidade_1', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11',
        'Prévia - 1', 'Prévia - 2', 'DATA', 'Gerência da Via', 'Trecho', 'Programar para D+1'
    ]
    for col in required_columns:
        if col not in df.columns:
            df[col] = None
            
    numeric_cols = ['Inicia', 'HR Turma Pronta', 'Duração', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11', 'Quantidade', 'Quantidade_1']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    df['display_identificador'] = df.apply(lambda row: f"<strong>{row['ATIVO'] or ''}</strong><br/>{row['Atividade'] or ''}", axis=1)
    df['display_inicio'] = df.apply(lambda row: f"{format_time_from_serial(row['Inicia'])}<br/>{format_time_from_serial(row['HR Turma Pronta'])}", axis=1)
    df['display_tempo_prog'] = df['Duração'].apply(format_time_from_serial)
    df['display_local'] = df.apply(lambda row: f"{row['SB'] or ''}<br/>{row['SB_4'] or ''}", axis=1)
    df['display_quantidade'] = df.apply(lambda row: f"{row.get('Quantidade', 0) or 0}<br/>{row.get('Quantidade_1', 0) or 0}", axis=1)

    def get_detalhamento(row):
        has_end_time = any(pd.notna(row[col]) and row[col] > 0 for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11'])
        return row['Prévia - 2'] if has_end_time else row['Prévia - 1']
    df['display_detalhamento'] = df.apply(get_detalhamento, axis=1)

    df['timer_start_timestamp'] = df['HR Turma Pronta'].apply(lambda x: excel_serial_to_datetime(x).isoformat() if pd.notna(x) and x > 0 else None)
    df['timer_end_timestamp'] = df.apply(lambda row: (excel_serial_to_datetime(row['Fim']) or excel_serial_to_datetime(row['Fim_8']) or excel_serial_to_datetime(row['Fim_10']) or excel_serial_to_datetime(row['Fim_11'])).isoformat() if any(pd.notna(row[col]) and row[col] > 0 for col in ['Fim', 'Fim_8', 'Fim_10', 'Fim_11']) else None, axis=1)
    
    output_columns = [
        'Gerência da Via', 'Trecho', 'ATIVO', 'Atividade', 'Programar para D+1', 'DATA',
        'display_identificador', 'display_inicio', 'display_tempo_prog', 'display_local', 'display_quantidade', 'display_detalhamento',
        'timer_start_timestamp', 'timer_end_timestamp'
    ]
    
    df_final = df[[col for col in output_columns if col in df.columns]].copy()
    
    # --- LINHA DA CORREÇÃO FINAL ---
    # Substitui todos os valores NaN (inválidos em JSON) por None (que se torna 'null' em JSON)
    df_final = df_final.where(pd.notnull(df_final), None)
    
    result_list = df_final.to_dict(orient='records')
    os.makedirs('docs', exist_ok=True)
    with open('docs/data.json', 'w', encoding='utf-8') as f:
        json.dump(result_list, f, ensure_ascii=False, indent=2)
        
    print("Arquivo 'docs/data.json' gerado com sucesso, limpo e em formato JSON válido.")

if __name__ == "__main__":
    process_files()