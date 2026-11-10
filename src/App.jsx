
import { useState } from "react";
import "./App.css";

const canais = [
  { id: 1, nome: "TV Brasil", categoria: "TV", icone: "📺" },
  { id: 2, nome: "TV Cultura", categoria: "TV", icone: "📡" },
  { id: 3, nome: "TV Câmara", categoria: "TV", icone: "🏛️" },
  { id: 4, nome: "Esportes", categoria: "Esportes", icone: "⚽" },
  { id: 5, nome: "Futebol", categoria: "Esportes", icone: "🏆" },
  { id: 6, nome: "Basquete", categoria: "Esportes", icone: "🏀" },
];

export default function App() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);

  const filtrados = canais.filter((canal) => {
    const combinaCategoria =
      categoria === "Todos" || canal.categoria === categoria;

    const combinaBusca = canal.nome
      .toLowerCase()
      .includes(busca.toLowerCase());

    return combinaCategoria && combinaBusca;
  });

  return (
    <div className="app">
      <header className="topo">
        <div className="logo">
          <span>MANINHO</span> TV
        </div>

        <nav>
          <button onClick={() => setCategoria("Todos")}>Início</button>
          <button onClick={() => setCategoria("TV")}>Canais</button>
          <button onClick={() => setCategoria("Esportes")}>Esportes</button>
        </nav>

        <div className="status">
          <span className="bolinha"></span> ONLINE
        </div>
      </header>

      <main>
        <section className="destaque">
          <div>
            <span className="etiqueta">SUA TV NA INTERNET</span>
            <h1>Bem-vindo ao <span>MANINHO TV</span></h1>
            <p>
              Seus canais e esportes favoritos em um só lugar.
            </p>
            <button
              className="botao"
              onClick={() => {
                setCategoria("Todos");
                setSelecionado(null);
              }}
            >
              EXPLORAR CANAIS
            </button>
          </div>
          <div className="icone-tv">📺</div>
        </section>

        <section className="player-area">
          <div className="player">
            {selecionado ? (
              <div className="player-info">
                <span className="play-icon">▶</span>
                <h2>{selecionado.nome}</h2>
                <p>
                  Para assistir, precisamos adicionar uma transmissão
                  oficial autorizada para este canal.
                </p>
              </div>
            ) : (
              <div className="player-info">
                <span className="play-icon">▶</span>
                <h2>ASSISTA AQUI</h2>
                <p>Escolha um canal para começar.</p>
              </div>
            )}
          </div>
        </section>

        <section className="conteudo">
          <div className="titulo">
            <div>
              <h2>Explore os canais</h2>
              <p>Escolha o que deseja assistir</p>
            </div>
          </div>

          <input
            className="pesquisa"
            placeholder="🔎 Pesquisar canais..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="filtros">
            {["Todos", "TV", "Esportes"].map((item) => (
              <button
                key={item}
                className={categoria === item ? "ativo" : ""}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grade">
            {filtrados.map((canal) => (
              <button
                className={
                  "card " +
                  (selecionado?.id === canal.id ? "selecionado" : "")
                }
                key={canal.id}
                onClick={() => setSelecionado(canal)}
              >
                <span className="card-icone">{canal.icone}</span>
                <h3>{canal.nome}</h3>
                <span className="card-categoria">
                  {canal.categoria}
                </span>
                <span className="assistir">Selecionar →</span>
              </button>
            ))}
          </div>

          {filtrados.length === 0 && (
            <p className="vazio">Nenhum canal encontrado.</p>
          )}
        </section>
      </main>

      <footer>
        <div className="logo">
          <span>MANINHO</span> TV
        </div>
        <p>© 2026 MANINHO TV - Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
