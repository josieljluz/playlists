# 📦 Importações necessárias
import requests  # Usada para fazer requisições HTTP (baixar arquivos da internet)
import os        # Pode ser usada para manipular arquivos/diretórios (não usada diretamente neste script)
from datetime import datetime  # Permite obter a data e hora atuais

# 📁 Dicionário com as URLs dos arquivos e os respectivos nomes com os quais serão salvos localmente
PLAYLISTS = {
    # URLs do site m3u4u.com
    "http://m3u4u.com/m3u/3wk1y24kx7uzdevxygz7": "epgbrasil.m3u",
    "http://m3u4u.com/epg/3wk1y24kx7uzdevxygz7": "epgbrasil.xml.gz",
    "http://m3u4u.com/m3u/782dyqdrqkh1xegen4zp": "epgbrasilportugal.m3u",
    "http://m3u4u.com/epg/782dyqdrqkh1xegen4zp": "epgbrasilportugal.xml.gz",
    "http://m3u4u.com/m3u/jq2zy9epr3bwxmgwyxr5": "epgportugal.m3u",
    "http://m3u4u.com/epg/jq2zy9epr3bwxmgwyxr5": "epgportugal.xml.gz",

    # URLs de arquivos hospedados no GitLab (listas M3U personalizadas)
    "https://gitlab.com/josieljefferson12/playlists/-/raw/main/playlist.m3u": "playlist.m3u",
    "https://gitlab.com/josielluz/playlists/-/raw/main/playlists.m3u": "playlists.m3u",
    "https://gitlab.com/josieljefferson12/playlists/-/raw/main/pornstars.m3u": "pornstars.m3u"
}

# 🔽 Função responsável por baixar o conteúdo da URL e salvar localmente com o nome indicado
def download_file(url, filename):
    try:
        # Faz a requisição GET para a URL com stream=True (útil para arquivos grandes)
        response = requests.get(url, stream=True)

        # Se a resposta HTTP tiver erro (ex: 404 ou 403), essa linha lançará uma exceção
        response.raise_for_status()

        # Abre o arquivo no modo binário de escrita ('wb') e grava o conteúdo baixado em partes (chunks)
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):  # 8192 bytes por parte
                f.write(chunk)

        # Exibe uma mensagem indicando que o download foi concluído com sucesso
        print(f"✅ Arquivo baixado: {filename}")

        # Gera uma string com a data e hora atual no formato personalizado
        timestamp = datetime.now().strftime("# Atualizado em %d/%m/%Y - %H:%M:%S BRT\n")

        # Abre novamente o arquivo em modo de adição ('a'), agora como texto, para incluir o timestamp no final
        with open(filename, 'a') as f:
            f.write(timestamp)

    # Captura qualquer exceção que ocorra durante o processo de download ou escrita do arquivo
    except Exception as e:
        print(f"❌ Erro ao baixar {url}: {e}")  # Exibe mensagem de erro com a URL problemática

# 🚀 Função principal responsável por iterar sobre todas as URLs e iniciar os downloads
def main():
    print("🔄 Iniciando atualização das playlists...")  # Mensagem de início no terminal

    # Percorre cada par (URL, nome do arquivo) no dicionário PLAYLISTS
    for url, filename in PLAYLISTS.items():
        download_file(url, filename)  # Chama a função que realiza o download e salva o arquivo

    print("✅ Todas as playlists foram atualizadas!")  # Mensagem final ao concluir todos os downloads

# ▶️ Ponto de entrada do script — só executa se o script for chamado diretamente
if __name__ == "__main__":
    main()  # Chama a função principal
