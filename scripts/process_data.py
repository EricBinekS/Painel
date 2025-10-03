# scripts/process_data.py
import pandas as pd
import glob
import json
import os

def process_files():
    """
    Lê arquivos Excel da pasta 'dados_brutos', processa os dados
    e salva o resultado em 'docs/data.json'.
    """
    print("Iniciando processamento dos arquivos Excel...")

    # Encontra todos os arquivos .xlsx na pasta dados_brutos
    file_paths = glob.glob("dados_brutos/*.xlsx")
    if not file_paths:
        print("Nenhum arquivo Excel encontrado na pasta 'dados_brutos'. Encerrando.")
        # Cria um JSON vazio para não quebrar o frontend
        with open('docs/data.json', 'w', encoding='utf-8') as f:
            json.dump([], f)
        return

    try:
        # Lê e concatena todos os arquivos em um único DataFrame do pandas
        df_list = [pd.read_excel(f) for f in file_paths]
        df = pd.concat(df_list, ignore_index=True)
        print(f"{len(df)} linhas de dados carregadas de {len(file_paths)} arquivo(s).")
    except Exception as e:
        print(f"Erro ao ler ou concatenar os arquivos Excel: {e}")
        return

    # --- AQUI COMEÇA A TRANSFORMAÇÃO ---
    # Garante que as colunas que usaremos na lógica existam, preenchendo com valores padrão se não existirem
    required_columns = [
        'ATIVO', 'Atividade', 'Inicia', 'HR Turma Pronta', 'Duração', 'SB', 'SB_4',
        'Quantidade', 'Quantidade_1', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11',
        'Prévia - 1', 'Prévia - 2', 'DATA', 'Gerência da Via', 'Trecho', 'Programar para D+1'
    ]
    for col in required_columns:
        if col not in df.columns:
            df[col] = None # Adiciona a coluna com valores nulos se ela não existir

    # Converte colunas para numérico, tratando erros e preenchendo com 0
    numeric_cols = ['Inicia', 'HR Turma Pronta', 'Duração', 'Fim', 'Fim_8', 'Fim_10', 'Fim_11', 'Quantidade', 'Quantidade_1']
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Seleciona apenas as colunas que vamos usar para o JSON final, para otimizar
    final_columns = [col for col in required_columns if col in df.columns]
    output_df = df[final_columns].copy()

    # Converte o DataFrame para uma lista de dicionários (formato JSON)
    result_list = output_df.to_dict(orient='records')

    # Cria o diretório 'docs' se ele não existir
    os.makedirs('docs', exist_ok=True)

    # Salva o JSON final no local que o site lê
    with open('docs/data.json', 'w', encoding='utf-8') as f:
        json.dump(result_list, f, ensure_ascii=False, indent=2)

    print("Arquivo 'docs/data.json' gerado com sucesso.")

if __name__ == "__main__":
    process_files()