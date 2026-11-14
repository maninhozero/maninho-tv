
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./App.css";

const EMAIL_ADMIN = "maninhomaninho20182018@gmail.com";
const CHAVE_PIX = "87981332269";

const canaisIniciais = [];

const formularioVazio = {
  nome: "",
  categoria: "TV",
  logo_url: "",
  stream_url: ""
};

const formularioJogoVazio = {
  titulo: "",
  campeonato: "",
  data_jogo: "",
  horario: "",
  canal_id: "",
  time_casa: "",
  escudo_casa_url: "",
  time_visitante: "",
  escudo_visitante_url: "",
  ativo: true
};

function dataLocalHoje() {
  const agora = new Date();

  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0")
  ].join("-");
}

function formatarData(data) {
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function App() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);

  const [canaisBanco, setCanaisBanco] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroBanco, setErroBanco] = useState("");

  // PROGRAMACAO DE JOGOS
  const [jogos, setJogos] = useState([]);
  const [carregandoJogos, setCarregandoJogos] = useState(false);
  const [formularioJogo, setFormularioJogo] = useState(
    formularioJogoVazio
  );
  const [editandoJogo, setEditandoJogo] = useState(null);
  const [salvandoJogo, setSalvandoJogo] = useState(false);
  const [mensagemJogo, setMensagemJogo] = useState("");

  const [sessao, setSessao] = useState(null);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarPainel, setMostrarPainel] = useState(false);

  const [email, setEmail] = useState(EMAIL_ADMIN);
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [erroLogin, setErroLogin] = useState("");
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [formulario, setFormulario] = useState(formularioVazio);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [buscaAdmin, setBuscaAdmin] = useState("");
  const [categoriaAdmin, setCategoriaAdmin] = useState("Todos");

  const [pixCopiado, setPixCopiado] = useState(false);

  const administrador =
    sessao?.user?.email?.toLowerCase() === EMAIL_ADMIN;

  const logoSite = `${import.meta.env.BASE_URL}logo.png`;
  const imagemPix = `${import.meta.env.BASE_URL}pix.png`;

  useEffect(() => {
    carregarCanais();
    carregarJogos();

    let ativo = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;

      if (error) {
        console.error(error);
        return;
      }

      setSessao(data.session);

      if (
        data.session?.user?.email?.toLowerCase() === EMAIL_ADMIN
      ) {
        setMostrarPainel(true);
        carregarJogos();
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((evento, session) => {
      setSessao(session);

      if (evento === "PASSWORD_RECOVERY") {
        setModoRecuperacao(true);
        setMostrarLogin(false);
        setMostrarPainel(false);
      }

      if (!session) {
        setMostrarPainel(false);
      }
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function carregarCanais() {
    setCarregando(true);
    setErroBanco("");

    const { data, error } = await supabase
      .from("canais")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setErroBanco("Não foi possível carregar os canais do banco.");
    } else {
      setCanaisBanco(data || []);
    }

    setCarregando(false);
  }

  async function carregarJogos() {
    setCarregandoJogos(true);

    const { data, error } = await supabase
      .from("jogos")
      .select("*")
      .order("data_jogo", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      console.error("Erro ao carregar jogos:", error);
      setJogos([]);
    } else {
      setJogos(data || []);
    }

    setCarregandoJogos(false);
  }

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
      setPixCopiado(true);

      window.setTimeout(() => {
        setPixCopiado(false);
      }, 2500);
    } catch (error) {
      console.error(error);
      window.prompt("Copie a chave PIX:", CHAVE_PIX);
    }
  }

  async function recuperarSenha() {
    setErroLogin("");
    setMensagemRecuperacao("");

    if (email.trim().toLowerCase() !== EMAIL_ADMIN) {
      setErroLogin("Confira o e-mail do administrador.");
      return;
    }

    setEnviandoEmail(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: window.location.href
      }
    );

    if (error) {
      console.error(error);
      setErroLogin("Erro ao enviar o e-mail: " + error.message);
    } else {
      setMensagemRecuperacao(
        "E-mail enviado! Confira sua caixa de entrada e também o spam."
      );
    }

    setEnviandoEmail(false);
  }

  async function atualizarSenha(e) {
    e.preventDefault();
    setMensagemRecuperacao("");

    if (novaSenha.length < 8) {
      setMensagemRecuperacao(
        "A senha precisa ter pelo menos 8 caracteres."
      );
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemRecuperacao("As senhas não são iguais.");
      return;
    }

    setSalvandoSenha(true);

    const { error } = await supabase.auth.updateUser({
      password: novaSenha
    });

    if (error) {
      console.error(error);
      setMensagemRecuperacao("Erro ao atualizar: " + error.message);
    } else {
      setMensagemRecuperacao("Senha atualizada com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
      setModoRecuperacao(false);
      setMostrarLogin(true);

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    setSalvandoSenha(false);
  }

  async function entrarAdmin(e) {
    e.preventDefault();
    setErroLogin("");
    setEntrando(true);

    if (email.trim().toLowerCase() !== EMAIL_ADMIN) {
      setErroLogin(
        "Este e-mail não tem autorização de administrador."
      );
      setEntrando(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha
    });

    if (error) {
      console.error(error);
      setErroLogin(
        "Não foi possível entrar. Confira seu e-mail e sua senha."
      );
    } else if (data.user?.email?.toLowerCase() !== EMAIL_ADMIN) {
      await supabase.auth.signOut();
      setErroLogin("Conta sem permissão de administrador.");
    } else {
      setSessao(data.session);
      setMostrarLogin(false);
      setMostrarPainel(true);
      setSenha("");
      setErroLogin("");
      await carregarJogos();
    }

    setEntrando(false);
  }

  async function sairAdmin() {
    await supabase.auth.signOut();

    setSessao(null);
    setMostrarPainel(false);
    setMostrarLogin(false);
    setEditando(null);
    setFormulario(formularioVazio);
    setEditandoJogo(null);
    setFormularioJogo(formularioJogoVazio);
  }

  function abrirAcessoAdmin() {
    if (administrador) {
      setMostrarPainel((anterior) => !anterior);
      setMostrarLogin(false);
    } else {
      setMostrarLogin((anterior) => !anterior);
      setMostrarPainel(false);
    }

    setErroLogin("");
  }

  function atualizarFormulario(e) {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function prepararEdicao(canal) {
    setEditando(canal);

    setFormulario({
      nome: canal.nome || "",
      categoria: canal.categoria || "TV",
      logo_url: canal.logo_url || "",
      stream_url: canal.stream_url || ""
    });

    setMensagem("");
  }

  function cancelarEdicao() {
    setEditando(null);
    setFormulario(formularioVazio);
    setMensagem("");
  }

  async function salvarCanal(e) {
    e.preventDefault();
    setMensagem("");

    if (!formulario.nome.trim()) {
      setMensagem("Digite o nome do canal.");
      return;
    }

    if (
      formulario.logo_url.trim() &&
      !/^https?:\/\//i.test(formulario.logo_url.trim())
    ) {
      setMensagem(
        "A URL da logo precisa começar com http:// ou https://."
      );
      return;
    }

    setSalvando(true);

    const dados = {
      nome: formulario.nome.trim(),
      categoria: formulario.categoria,
      logo_url: formulario.logo_url.trim() || null,
      stream_url: formulario.stream_url.trim() || null
    };

    let resultado;

    if (editando) {
      resultado = await supabase
        .from("canais")
        .update(dados)
        .eq("id", editando.id);
    } else {
      resultado = await supabase
        .from("canais")
        .insert([dados]);
    }

    if (resultado.error) {
      console.error(resultado.error);
      setMensagem(
        "Erro ao salvar. Confira as permissões do Supabase."
      );
    } else {
      setMensagem(
        editando
          ? "Canal atualizado com sucesso!"
          : "Canal cadastrado com sucesso!"
      );

      setFormulario(formularioVazio);
      setEditando(null);
      await carregarCanais();
    }

    setSalvando(false);
  }

  async function excluirCanal(id) {
    if (!administrador) {
      setMensagem("Somente o administrador pode excluir canais.");
      return;
    }

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este canal? Essa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    setMensagem("");

    const { data, error } = await supabase
      .from("canais")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error(error);
      setMensagem(
        "Não foi possível excluir. Confira as permissões do Supabase."
      );
      return;
    }

    if (!data || data.length === 0) {
      setMensagem(
        "Nenhum canal foi excluído. Verifique as permissões de administrador."
      );
      return;
    }

    setMensagem("Canal excluído com sucesso!");

    if (selecionado?.bancoId === id) {
      setSelecionado(null);
    }

    if (editando?.id === id) {
      setEditando(null);
      setFormulario(formularioVazio);
    }

    await carregarCanais();
  }

  // ==========================================
  // GERENCIAMENTO DA PROGRAMACAO
  // ==========================================

  function atualizarFormularioJogo(e) {
    const { name, value } = e.target;

    setFormularioJogo((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function salvarJogo(e) {
    e.preventDefault();
    setMensagemJogo("");

    if (!administrador) {
      setMensagemJogo("Apenas o administrador pode cadastrar jogos.");
      return;
    }

    if (
      !formularioJogo.time_casa.trim() ||
      !formularioJogo.time_visitante.trim() ||
      !formularioJogo.data_jogo ||
      !formularioJogo.horario ||
      !formularioJogo.canal_id
    ) {
      setMensagemJogo(
        "Preencha os times, a data, o horário e o canal."
      );
      return;
    }

    if (
      formularioJogo.escudo_casa_url.trim() &&
      !/^https?:\/\//i.test(formularioJogo.escudo_casa_url.trim())
    ) {
      setMensagemJogo(
        "A URL do escudo da casa precisa começar com http:// ou https://."
      );
      return;
    }

    if (
      formularioJogo.escudo_visitante_url.trim() &&
      !/^https?:\/\//i.test(formularioJogo.escudo_visitante_url.trim())
    ) {
      setMensagemJogo(
        "A URL do escudo visitante precisa começar com http:// ou https://."
      );
      return;
    }

    const canalExiste = canaisBanco.some(
      (canal) =>
        String(canal.id) === String(formularioJogo.canal_id)
    );

    if (!canalExiste) {
      setMensagemJogo("Selecione um canal válido.");
      return;
    }

    setSalvandoJogo(true);

    const nomeCasa = formularioJogo.time_casa.trim();
    const nomeVisitante = formularioJogo.time_visitante.trim();

    const dados = {
      titulo: `${nomeCasa} x ${nomeVisitante}`,
      time_casa: nomeCasa,
      escudo_casa_url:
        formularioJogo.escudo_casa_url.trim() || null,
      time_visitante: nomeVisitante,
      escudo_visitante_url:
        formularioJogo.escudo_visitante_url.trim() || null,
      campeonato: formularioJogo.campeonato.trim() || null,
      data_jogo: formularioJogo.data_jogo,
      horario: formularioJogo.horario,
      canal_id: String(formularioJogo.canal_id),
      ativo: formularioJogo.ativo
    };

    let resultado;

    if (editandoJogo) {
      resultado = await supabase
        .from("jogos")
        .update(dados)
        .eq("id", editandoJogo.id);
    } else {
      resultado = await supabase
        .from("jogos")
        .insert([dados]);
    }

    if (resultado.error) {
      console.error(resultado.error);
      setMensagemJogo(
        "Erro ao salvar jogo: " + resultado.error.message
      );
    } else {
      setMensagemJogo(
        editandoJogo
          ? "Jogo atualizado com sucesso!"
          : "Jogo cadastrado com sucesso!"
      );

      setFormularioJogo(formularioJogoVazio);
      setEditandoJogo(null);

      await carregarJogos();
    }

    setSalvandoJogo(false);
  }

  function prepararEdicaoJogo(jogo) {
    setEditandoJogo(jogo);

    const partesTitulo = (jogo.titulo || "").split(" x ");

    setFormularioJogo({
      titulo: jogo.titulo || "",
      campeonato: jogo.campeonato || "",
      data_jogo: jogo.data_jogo || "",
      horario: jogo.horario?.slice(0, 5) || "",
      canal_id: String(jogo.canal_id || ""),
      time_casa: jogo.time_casa || partesTitulo[0] || "",
      escudo_casa_url: jogo.escudo_casa_url || "",
      time_visitante: jogo.time_visitante || partesTitulo[1] || "",
      escudo_visitante_url: jogo.escudo_visitante_url || "",
      ativo: jogo.ativo !== false
    });

    setMensagemJogo("");
  }

  function cancelarEdicaoJogo() {
    setEditandoJogo(null);
    setFormularioJogo(formularioJogoVazio);
    setMensagemJogo("");
  }

  async function excluirJogo(id) {
    if (!administrador) return;

    const confirmar = window.confirm(
      "Deseja realmente excluir este jogo?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("jogos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMensagemJogo("Erro ao excluir jogo: " + error.message);
      return;
    }

    setMensagemJogo("Jogo excluído com sucesso!");

    if (editandoJogo?.id === id) {
      cancelarEdicaoJogo();
    }

    await carregarJogos();
  }

  function alternarPublicacaoJogo(jogo) {
    const partesTitulo = (jogo.titulo || "").split(" x ");

    setFormularioJogo({
      titulo: jogo.titulo || "",
      campeonato: jogo.campeonato || "",
      data_jogo: jogo.data_jogo || "",
      horario: jogo.horario?.slice(0, 5) || "",
      canal_id: String(jogo.canal_id || ""),
      time_casa: jogo.time_casa || partesTitulo[0] || "",
      escudo_casa_url: jogo.escudo_casa_url || "",
      time_visitante: jogo.time_visitante || partesTitulo[1] || "",
      escudo_visitante_url: jogo.escudo_visitante_url || "",
      ativo: !jogo.ativo
    });

    setEditandoJogo(jogo);
    setMensagemJogo(
      "Altere a publicação e clique em ATUALIZAR JOGO."
    );
  }

  // ==========================================
  // NAVEGACAO E CANAIS
  // ==========================================

  function irParaDoacoes() {
    setMostrarLogin(false);
    setMostrarPainel(false);

    document.getElementById("apoie")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  const canaisOnline = canaisBanco.map((canal) => ({
    id: `online-${canal.id}`,
    bancoId: canal.id,
    nome: canal.nome,
    categoria: canal.categoria,
    icone: canal.logo_url || "📺",
    url: canal.stream_url || "",
    online: true
  }));

  const todosCanais = [...canaisIniciais, ...canaisOnline];

  const filtrados = todosCanais.filter((canal) => {
    const combinaCategoria =
      categoria === "Todos" ||
      canal.categoria.toLowerCase() === categoria.toLowerCase();

    const combinaBusca = canal.nome
      .toLowerCase()
      .includes(busca.trim().toLowerCase());

    return combinaCategoria && combinaBusca;
  });

  const canaisAdminFiltrados = canaisBanco.filter((canal) => {
    const nomeCombina = canal.nome
      .toLowerCase()
      .includes(buscaAdmin.trim().toLowerCase());

    const categoriaCombina =
      categoriaAdmin === "Todos" ||
      canal.categoria === categoriaAdmin;

    return nomeCombina && categoriaCombina;
  });

  const jogosDeHoje = jogos.filter(
    (jogo) =>
      jogo.ativo &&
      jogo.data_jogo === dataLocalHoje()
  );

  function assistirCanal(canal) {
    setSelecionado(canal);

    window.setTimeout(() => {
      document.querySelector(".player-area")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  }

  function abrirCanalNovaAba(canal) {
    if (!canal.url) {
      window.alert("Este canal ainda não possui um link cadastrado.");
      return;
    }

    window.open(canal.url, "_blank", "noopener,noreferrer");
  }

  function explorarCanais() {
    setCategoria("Todos");
    setBusca("");
    setSelecionado(null);
    setMostrarPainel(false);
    setMostrarLogin(false);
  }

  // ==========================================
  // RECUPERACAO DE SENHA
  // ==========================================

  if (modoRecuperacao) {
    return (
      <div className="app">
        <main className="area-admin">
          <form
            className="painel-admin"
            onSubmit={atualizarSenha}
          >
            <h2>🔐 Criar nova senha</h2>

            <p>
              Digite sua nova senha para acessar o MANINHO TV.
            </p>

            <label>Nova senha</label>

            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              autoComplete="new-password"
              required
            />

            <label>Confirmar nova senha</label>

            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              autoComplete="new-password"
              required
            />

            {mensagemRecuperacao && (
              <p className="mensagem-erro">
                {mensagemRecuperacao}
              </p>
            )}

            <button
              className="botao"
              type="submit"
              disabled={salvandoSenha}
            >
              {salvandoSenha
                ? "ATUALIZANDO..."
                : "SALVAR NOVA SENHA"}
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ==========================================
  // SITE
  // ==========================================

  return (
    <div className="app">

      <header className="topo">
        <div className="logo">
          <img
            src={logoSite}
            alt="Logo MANINHO TV"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: "50px",
              height: "50px",
              objectFit: "contain",
              flexShrink: 0
            }}
          />

          <span>MANINHO</span> TV
        </div>

        <nav>
          <button onClick={explorarCanais}>
            Início
          </button>

          <button
            onClick={() => {
              setCategoria("TV");
              setBusca("");
              setMostrarPainel(false);
              setMostrarLogin(false);
            }}
          >
            Canais
          </button>

          <button
            onClick={() => {
              setCategoria("Esportes");
              setBusca("");
              setMostrarPainel(false);
              setMostrarLogin(false);
            }}
          >
            Esportes
          </button>

          <button onClick={irParaDoacoes}>
            ❤️ Apoie o site
          </button>

          <button
            type="button"
            onClick={abrirAcessoAdmin}
          >
            {administrador
              ? "⚙️ Painel ADM"
              : "🔐 Área ADM"}
          </button>
        </nav>

        <div className="status">
          <span className="bolinha"></span> ONLINE
        </div>
      </header>

      <main>

        {/* DESTAQUE PRINCIPAL */}

        <section className="destaque">
          <div>
            <span className="etiqueta">
              SUA TV NA INTERNET
            </span>

            <h1>
              Bem-vindo ao <span>MANINHO TV</span>
            </h1>

            <p>
              Seus canais e esportes favoritos em um só lugar.
            </p>

            <button
              className="botao"
              onClick={explorarCanais}
            >
              EXPLORAR CANAIS
            </button>
          </div>

          <div className="icone-tv">📺</div>
        </section>

        {/* JOGOS DE HOJE */}

        <section className="conteudo agenda-jogos">

          <div className="titulo">
            <div>
              <h2>⚽ Jogos de Hoje</h2>
              <p>
                Confira a programação esportiva do dia
              </p>
            </div>

            <span className="etiqueta">
              PROGRAMAÇÃO
            </span>
          </div>

          {carregandoJogos && (
            <p>Carregando programação...</p>
          )}

          {!carregandoJogos && jogosDeHoje.length > 0 && (
            <div className="grade">

              {jogosDeHoje.map((jogo) => {
                const canal = canaisBanco.find(
                  (item) =>
                    String(item.id) === String(jogo.canal_id)
                );

                const partesTitulo = (jogo.titulo || "").split(" x ");
                const timeCasa =
                  jogo.time_casa || partesTitulo[0] || jogo.titulo;
                const timeVisitante =
                  jogo.time_visitante || partesTitulo[1] || "";

                return (
                  <div
                    className="card jogo-card"
                    key={jogo.id}
                  >
                    <span className="card-categoria">
                      {jogo.campeonato || "FUTEBOL"}
                    </span>

                    <div className="confronto-jogo">

                      <div className="time-jogo">
                        {jogo.escudo_casa_url ? (
                          <img
                            src={jogo.escudo_casa_url}
                            alt={`Escudo ${timeCasa}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>⚽</span>
                        )}

                        <strong>{timeCasa}</strong>
                      </div>

                      <strong className="versus-jogo">
                        VS
                      </strong>

                      <div className="time-jogo">
                        {jogo.escudo_visitante_url ? (
                          <img
                            src={jogo.escudo_visitante_url}
                            alt={`Escudo ${timeVisitante || "time visitante"}`}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>⚽</span>
                        )}

                        <strong>
                          {timeVisitante || "A definir"}
                        </strong>
                      </div>

                    </div>

                    <div className="horario-jogo">
                      🕒 {jogo.horario?.slice(0, 5)}
                    </div>

                    <div className="canal-jogo">

                      {canal?.logo_url ? (
                        <img
                          src={canal.logo_url}
                          alt={canal.nome}
                        />
                      ) : (
                        <span>📺</span>
                      )}

                      <span>
                        {canal?.nome || "Canal não encontrado"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="botao-assistir-card"
                      disabled={!canal?.stream_url}
                      onClick={() => {
                        if (!canal?.stream_url) return;

                        assistirCanal({
                          id: `online-${canal.id}`,
                          bancoId: canal.id,
                          nome: canal.nome,
                          categoria: canal.categoria,
                          icone: canal.logo_url || "📺",
                          url: canal.stream_url,
                          online: true
                        });
                      }}
                    >
                      ▶ ASSISTIR AGORA
                    </button>
                  </div>
                );
              })}

            </div>
          )}

          {!carregandoJogos && jogosDeHoje.length === 0 && (
            <p className="vazio">
              Nenhum jogo programado para hoje.
            </p>
          )}

        </section>

        {/* PLAYER */}

        <section className="player-area">

          {selecionado && (
            <div className="canal-acoes">
              <h2>{selecionado.nome}</h2>

              {selecionado.url && (
                <a
                  className="abrir-canal"
                  href={selecionado.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ ABRIR CANAL EM NOVA ABA
                </a>
              )}
            </div>
          )}

          <div className="player">

            {selecionado?.url ? (
              <iframe
                key={selecionado.id}
                src={selecionado.url}
                title={selecionado.nome}
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <div className="player-info">
                <span className="play-icon">▶</span>

                <h2>
                  {selecionado
                    ? selecionado.nome
                    : "ASSISTA AQUI"}
                </h2>

                <p>
                  {selecionado
                    ? "Este canal ainda não possui uma transmissão cadastrada."
                    : "Escolha um canal para começar."}
                </p>
              </div>
            )}

          </div>
        </section>

        {/* LISTA DE CANAIS */}

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

          {carregando && (
            <p>Carregando canais...</p>
          )}

          {erroBanco && (
            <p className="vazio">{erroBanco}</p>
          )}

          <div className="grade">

            {filtrados.map((canal) => (
              <div
                className={
                  "card " +
                  (selecionado?.id === canal.id ? "selecionado" : "")
                }
                key={canal.id}
              >

                <span className="card-icone">
                  {canal.icone?.startsWith("http") ? (
                    <img
                      src={canal.icone}
                      alt={canal.nome}
                      style={{
                        width: 55,
                        height: 55,
                        objectFit: "contain"
                      }}
                    />
                  ) : (
                    canal.icone
                  )}
                </span>

                <h3>{canal.nome}</h3>

                <span className="card-categoria">
                  {canal.categoria}
                </span>

                <div
                  className="acoes-canal-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "100%",
                    marginTop: "12px"
                  }}
                >

                  <button
                    type="button"
                    className="botao-assistir-card"
                    onClick={() => assistirCanal(canal)}
                    style={{
                      width: "100%",
                      padding: "11px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#00aaff",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    ▶ ASSISTIR AGORA
                  </button>

                  <button
                    type="button"
                    className="botao-nova-aba-card"
                    onClick={() => abrirCanalNovaAba(canal)}
                    disabled={!canal.url}
                    title={
                      !canal.url
                        ? "Canal sem link cadastrado"
                        : "Abrir em outra aba"
                    }
                    style={{
                      width: "100%",
                      padding: "11px",
                      border: "1px solid #00aaff",
                      borderRadius: "8px",
                      background: "#192638",
                      color: "#fff",
                      fontWeight: "bold",
                      cursor: canal.url ? "pointer" : "not-allowed",
                      opacity: canal.url ? 1 : 0.5
                    }}
                  >
                    ↗ ABRIR EM OUTRA ABA
                  </button>

                </div>
              </div>
            ))}

          </div>

          {filtrados.length === 0 && !carregando && (
            <p className="vazio">
              Nenhum canal encontrado.
            </p>
          )}

        </section>

        {/* AREA ADMINISTRATIVA */}

        <section className="area-admin">

          {mostrarLogin && !administrador && (
            <form
              className="painel-admin"
              onSubmit={entrarAdmin}
            >
              <h2>🔐 Login administrativo</h2>

              <label>E-mail</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label>Senha</label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />

              {erroLogin && (
                <p className="mensagem-erro">
                  {erroLogin}
                </p>
              )}

              {mensagemRecuperacao && (
                <p>{mensagemRecuperacao}</p>
              )}

              <button
                className="botao"
                type="submit"
                disabled={entrando}
              >
                {entrando ? "ENTRANDO..." : "ENTRAR"}
              </button>

              <button
                type="button"
                className="botao-admin"
                onClick={recuperarSenha}
                disabled={enviandoEmail}
              >
                {enviandoEmail
                  ? "ENVIANDO..."
                  : "ESQUECI MINHA SENHA"}
              </button>
            </form>
          )}

          {administrador && mostrarPainel && (
            <div className="painel-admin">

              <h2>⚙️ Painel administrativo</h2>

              <p>
                Gerencie os canais e a programação do MANINHO TV.
              </p>

              {/* CADASTRO DE CANAIS */}

              <form onSubmit={salvarCanal}>

                <h3>
                  {editando
                    ? "✏️ Editando canal"
                    : "➕ Cadastrar novo canal"}
                </h3>

                <label>Nome do canal</label>

                <input
                  name="nome"
                  value={formulario.nome}
                  onChange={atualizarFormulario}
                  placeholder="Ex.: TV Brasil"
                  required
                />

                <label>Categoria</label>

                <select
                  name="categoria"
                  value={formulario.categoria}
                  onChange={atualizarFormulario}
                >
                  <option value="TV">TV</option>
                  <option value="Esportes">Esportes</option>
                </select>

                <label>Link da logo (URL da imagem)</label>

                <input
                  name="logo_url"
                  value={formulario.logo_url}
                  onChange={atualizarFormulario}
                  placeholder="https://site.com/logo.png"
                />

                {formulario.logo_url.trim() && (
                  <div
                    style={{
                      margin: "12px 0",
                      padding: "12px",
                      border: "1px solid #00aaff",
                      borderRadius: "10px",
                      textAlign: "center"
                    }}
                  >
                    <p>Pré-visualização da logo</p>

                    <img
                      src={formulario.logo_url}
                      alt="Pré-visualização da logo"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.display = "inline-block";
                      }}
                      style={{
                        width: "90px",
                        height: "90px",
                        objectFit: "contain",
                        marginTop: "10px"
                      }}
                    />
                  </div>
                )}

                <label>
                  Link da transmissão autorizada
                </label>

                <input
                  name="stream_url"
                  value={formulario.stream_url}
                  onChange={atualizarFormulario}
                  placeholder="https://..."
                />

                <button
                  className="botao"
                  type="submit"
                  disabled={salvando}
                >
                  {salvando
                    ? "SALVANDO..."
                    : editando
                    ? "ATUALIZAR CANAL"
                    : "CADASTRAR CANAL"}
                </button>

                {editando && (
                  <button
                    type="button"
                    className="botao-admin"
                    onClick={cancelarEdicao}
                  >
                    CANCELAR EDIÇÃO
                  </button>
                )}

              </form>

              {mensagem && (
                <p style={{ margin: "15px 0" }}>
                  {mensagem}
                </p>
              )}

              {/* LISTA DE CANAIS ADMIN */}

              <div style={{ marginTop: "25px" }}>

                <h3>
                  📺 Canais cadastrados ({canaisBanco.length})
                </h3>

                <input
                  className="pesquisa"
                  placeholder="🔎 Pesquisar no painel..."
                  value={buscaAdmin}
                  onChange={(e) => setBuscaAdmin(e.target.value)}
                />

                <div className="filtros">
                  {["Todos", "TV", "Esportes"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        categoriaAdmin === item ? "ativo" : ""
                      }
                      onClick={() => setCategoriaAdmin(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {canaisAdminFiltrados.length === 0 ? (
                  <p className="vazio">
                    Nenhum canal encontrado no painel.
                  </p>
                ) : (
                  canaisAdminFiltrados.map((canal) => (
                    <div
                      className="admin-canal"
                      key={canal.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                        margin: "12px 0",
                        padding: "12px",
                        border: "1px solid #26364b",
                        borderRadius: "10px"
                      }}
                    >

                      {canal.logo_url ? (
                        <img
                          src={canal.logo_url}
                          alt=""
                          style={{
                            width: "42px",
                            height: "42px",
                            objectFit: "contain"
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "28px" }}>
                          📺
                        </span>
                      )}

                      <div
                        style={{
                          flex: "1",
                          minWidth: "120px"
                        }}
                      >
                        <strong>{canal.nome}</strong>

                        <p
                          style={{
                            fontSize: "12px",
                            opacity: 0.7
                          }}
                        >
                          {canal.categoria}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => prepararEdicao(canal)}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirCanal(canal.id)}
                      >
                        🗑️ Excluir
                      </button>

                    </div>
                  ))
                )}

              </div>

              {/* PROGRAMACAO DE JOGOS NO ADMIN */}

              <div className="admin-programacao">

                <h3>⚽ Gerenciar jogos do dia</h3>

                <p>
                  Cadastre os confrontos, os escudos dos times e selecione
                  um canal já existente no MANINHO TV.
                </p>

                <form onSubmit={salvarJogo}>

                  <h3>
                    {editandoJogo
                      ? "✏️ Editando jogo"
                      : "➕ Cadastrar novo jogo"}
                  </h3>

                  <label>Time da casa</label>

                  <input
                    name="time_casa"
                    value={formularioJogo.time_casa}
                    onChange={atualizarFormularioJogo}
                    placeholder="Ex.: Flamengo"
                    required
                  />

                  <label>URL do escudo do time da casa</label>

                  <input
                    name="escudo_casa_url"
                    value={formularioJogo.escudo_casa_url}
                    onChange={atualizarFormularioJogo}
                    placeholder="https://site.com/escudo-flamengo.png"
                  />

                  {formularioJogo.escudo_casa_url.trim() && (
                    <div className="preview-escudo">
                      <p>Pré-visualização do escudo da casa</p>

                      <img
                        src={formularioJogo.escudo_casa_url}
                        alt="Escudo do time da casa"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "inline-block";
                        }}
                      />
                    </div>
                  )}

                  <label>Time visitante</label>

                  <input
                    name="time_visitante"
                    value={formularioJogo.time_visitante}
                    onChange={atualizarFormularioJogo}
                    placeholder="Ex.: Palmeiras"
                    required
                  />

                  <label>URL do escudo do time visitante</label>

                  <input
                    name="escudo_visitante_url"
                    value={formularioJogo.escudo_visitante_url}
                    onChange={atualizarFormularioJogo}
                    placeholder="https://site.com/escudo-palmeiras.png"
                  />

                  {formularioJogo.escudo_visitante_url.trim() && (
                    <div className="preview-escudo">
                      <p>Pré-visualização do escudo visitante</p>

                      <img
                        src={formularioJogo.escudo_visitante_url}
                        alt="Escudo do time visitante"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        onLoad={(e) => {
                          e.currentTarget.style.display = "inline-block";
                        }}
                      />
                    </div>
                  )}

                  <label>Campeonato</label>

                  <input
                    name="campeonato"
                    value={formularioJogo.campeonato}
                    onChange={atualizarFormularioJogo}
                    placeholder="Ex.: Brasileirão"
                  />

                  <label>Data do jogo</label>

                  <input
                    type="date"
                    name="data_jogo"
                    value={formularioJogo.data_jogo}
                    onChange={atualizarFormularioJogo}
                    required
                  />

                  <label>Horário</label>

                  <input
                    type="time"
                    name="horario"
                    value={formularioJogo.horario}
                    onChange={atualizarFormularioJogo}
                    required
                  />

                  <label>Canal da transmissão</label>

                  <select
                    name="canal_id"
                    value={formularioJogo.canal_id}
                    onChange={atualizarFormularioJogo}
                    required
                  >
                    <option value="">
                      Selecione um canal
                    </option>

                    {canaisBanco.map((canal) => (
                      <option
                        key={canal.id}
                        value={String(canal.id)}
                      >
                        {canal.nome}
                      </option>
                    ))}
                  </select>

                  {canaisBanco.length === 0 && (
                    <p className="mensagem-erro">
                      Cadastre pelo menos um canal antes de cadastrar jogos.
                    </p>
                  )}

                  <label className="publicar-jogo">
                    <input
                      type="checkbox"
                      checked={formularioJogo.ativo}
                      onChange={(e) =>
                        setFormularioJogo((anterior) => ({
                          ...anterior,
                          ativo: e.target.checked
                        }))
                      }
                    />

                    Publicar jogo na página inicial
                  </label>

                  <button
                    className="botao"
                    type="submit"
                    disabled={salvandoJogo || canaisBanco.length === 0}
                  >
                    {salvandoJogo
                      ? "SALVANDO..."
                      : editandoJogo
                      ? "ATUALIZAR JOGO"
                      : "CADASTRAR JOGO"}
                  </button>

                  {editandoJogo && (
                    <button
                      type="button"
                      className="botao-admin"
                      onClick={cancelarEdicaoJogo}
                    >
                      CANCELAR EDIÇÃO
                    </button>
                  )}

                </form>

                {mensagemJogo && (
                  <p className="mensagem-jogo">
                    {mensagemJogo}
                  </p>
                )}

                <div className="lista-jogos-admin">

                  <h3>
                    📅 Jogos cadastrados ({jogos.length})
                  </h3>

                  {carregandoJogos && (
                    <p>Carregando jogos...</p>
                  )}

                  {!carregandoJogos && jogos.length === 0 && (
                    <p className="vazio">
                      Nenhum jogo cadastrado.
                    </p>
                  )}

                  {jogos.map((jogo) => {
                    const canal = canaisBanco.find(
                      (item) =>
                        String(item.id) === String(jogo.canal_id)
                    );

                    const partesTitulo = (jogo.titulo || "").split(" x ");
                    const timeCasa =
                      jogo.time_casa || partesTitulo[0] || jogo.titulo;
                    const timeVisitante =
                      jogo.time_visitante || partesTitulo[1] || "";

                    return (
                      <div
                        key={jogo.id}
                        className="admin-jogo"
                      >

                        <div className="admin-jogo-info">

                          <div className="admin-confronto">

                            {jogo.escudo_casa_url && (
                              <img
                                src={jogo.escudo_casa_url}
                                alt={`Escudo ${timeCasa}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}

                            <strong>
                              {timeCasa}
                              {timeVisitante
                                ? ` x ${timeVisitante}`
                                : ""}
                            </strong>

                            {jogo.escudo_visitante_url && (
                              <img
                                src={jogo.escudo_visitante_url}
                                alt={`Escudo ${timeVisitante}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}

                          </div>

                          <p>
                            {jogo.campeonato || "Sem campeonato"}
                          </p>

                          <p>
                            📅 {formatarData(jogo.data_jogo)}
                            {" · "}
                            🕒 {jogo.horario?.slice(0, 5)}
                          </p>

                          <p>
                            📺 {canal?.nome || "Canal não encontrado"}
                          </p>

                          <span
                            className={
                              jogo.ativo
                                ? "status-jogo publicado"
                                : "status-jogo oculto"
                            }
                          >
                            {jogo.ativo
                              ? "PUBLICADO"
                              : "OCULTO"}
                          </span>

                        </div>

                        <div className="admin-jogo-acoes">

                          <button
                            type="button"
                            onClick={() => prepararEdicaoJogo(jogo)}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => alternarPublicacaoJogo(jogo)}
                          >
                            {jogo.ativo
                              ? "👁️ Ocultar"
                              : "👁️ Publicar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => excluirJogo(jogo.id)}
                          >
                            🗑️ Excluir
                          </button>

                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>

              <button
                type="button"
                className="botao-admin"
                onClick={sairAdmin}
              >
                SAIR DO PAINEL
              </button>

            </div>
          )}

        </section>

        {/* APOIE O SITE */}

        <section className="apoie" id="apoie">

          <div className="apoie-conteudo">

            <span className="apoie-icone">❤️</span>

            <h2>Ajude a manter o MANINHO TV!</h2>

            <p>
              Gostou do nosso site? Sua contribuição é voluntária
              e ajuda a apoiar a manutenção e as melhorias do projeto.
            </p>

            <div className="pix-caixa">

              <span>CHAVE PIX</span>

              <strong>{CHAVE_PIX}</strong>

              <img
                src={imagemPix}
                alt="QR Code PIX do MANINHO TV"
                className="pix-qrcode"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <button
                type="button"
                className="botao"
                onClick={copiarPix}
              >
                {pixCopiado
                  ? "✓ CHAVE COPIADA!"
                  : "📋 COPIAR CHAVE PIX"}
              </button>

            </div>

            <p className="agradecimento">
              Obrigado por apoiar o MANINHO TV! 💙
            </p>

          </div>

        </section>

      </main>

      <footer>

        <div className="logo">

          <img
            src={logoSite}
            alt="Logo MANINHO TV"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            style={{
              width: "45px",
              height: "45px",
              objectFit: "contain",
              flexShrink: 0
            }}
          />

          <span>MANINHO</span> TV

        </div>

        <p>
          © 2026 MANINHO TV - Todos os direitos reservados.
        </p>

      </footer>

    </div>
  );
}
