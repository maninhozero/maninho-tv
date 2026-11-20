
import { useEffect, useRef, useState } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { supabase } from "./supabase";
import "./App.css";

// Plugin Android registrado em MainActivity.java.
const ImmersiveMode = registerPlugin("ImmersiveMode");

const EMAIL_ADMIN = "maninhomaninho20182018@gmail.com";
const CHAVE_PIX = "87981332269";

const canaisIniciais = [];

const formularioVazio = {
  nome: "",
  categoria: "TV",
  logo_url: "",
  stream_url: "",
  stream_url_2: ""
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

// CONFIGURACOES DO SITE
const configuracaoVazia = {
  id: 1,
  apk_url: "",
  download_ativo: true,
  tutorial_titulo: "Como usar o MANINHO TV",
  tutorial_descricao: "Aprenda a utilizar nosso aplicativo.",
  tutorial_url: "",
  tutorial_ativo: true
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

// Converte links comuns do YouTube para o formato de incorporacao.
function obterUrlVideo(url) {
  if (!url) return "";

  try {
    const endereco = new URL(url);
    const host = endereco.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = endereco.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const id = endereco.searchParams.get("v");

      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }

      if (endereco.pathname.startsWith("/embed/")) {
        return url;
      }

      if (endereco.pathname.startsWith("/shorts/")) {
        const idShorts = endereco.pathname.split("/")[2];
        return idShorts
          ? `https://www.youtube.com/embed/${idShorts}`
          : "";
      }
    }
  } catch (error) {
    console.error("Link de vídeo inválido:", error);
  }

  return "";
}

export default function App() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [mostrarEscolhaServidor, setMostrarEscolhaServidor] = useState(false);

  // CONTROLES DO PLAYER E TELA CHEIA
  const playerRef = useRef(null);
  const [telaCheia, setTelaCheia] = useState(false);
  const telaCheiaRef = useRef(false);
  telaCheiaRef.current = telaCheia;
  const [mostrarBotaoVoltar, setMostrarBotaoVoltar] = useState(true);
  const temporizadorVoltarRef = useRef(null);

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

  // CONFIGURACOES DE DOWNLOAD E TUTORIAL
  const [configSite, setConfigSite] = useState(configuracaoVazia);
  const [carregandoConfig, setCarregandoConfig] = useState(true);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [mensagemConfig, setMensagemConfig] = useState("");

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

  // Orientação e barras do sistema: no Android usamos o plugin nativo.
  // No navegador, mantemos o plugin ScreenOrientation como alternativa.
  async function ajustarOrientacaoTelaCheia(ativo) {
    if (Capacitor.isNativePlatform()) {
      try {
        await ImmersiveMode.setOrientation({
          orientation: ativo ? "landscape" : "unspecified"
        });
        return;
      } catch (error) {
        console.warn("Plugin nativo de orientação indisponível:", error);
      }
    }

    try {
      if (ativo) {
        await ScreenOrientation.lock({ orientation: "landscape" });
      } else {
        await ScreenOrientation.unlock();
      }
    } catch (error) {
      try {
        const orientacao = window.screen?.orientation;

        if (ativo && typeof orientacao?.lock === "function") {
          await orientacao.lock("landscape");
        } else if (!ativo && typeof orientacao?.unlock === "function") {
          orientacao.unlock();
        }
      } catch (erroFallback) {
        console.warn(
          "Não foi possível alterar a orientação da tela:",
          error,
          erroFallback
        );
      }
    }
  }

  async function ajustarBarrasAndroid(ativo) {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await ImmersiveMode.setEnabled({ enabled: ativo });
    } catch (error) {
      console.error("Não foi possível alterar as barras do Android:", error);
    }
  }

  function atualizarClasseTelaCheia(ativo) {
    document.documentElement.classList.toggle("modo-tela-cheia", ativo);
    document.body.classList.toggle("modo-tela-cheia", ativo);
  }

  useEffect(() => {
    function atualizarEstadoTelaCheia() {
      // A tela cheia nativa do Android é controlada pelo estado React,
      // não pela Fullscreen API do navegador.
      if (Capacitor.isNativePlatform()) return;

      const ativo =
        document.fullscreenElement === playerRef.current ||
        document.webkitFullscreenElement === playerRef.current;

      telaCheiaRef.current = ativo;
      setTelaCheia(ativo);
      atualizarClasseTelaCheia(ativo);
      ajustarOrientacaoTelaCheia(ativo);
    }

    function receberToqueNativo() {
      // MainActivity envia este evento sem consumir o toque original.
      // Também detecta toques dentro de iframes de outros domínios.
      revelarBotaoVoltar();
    }

    document.addEventListener("fullscreenchange", atualizarEstadoTelaCheia);
    document.addEventListener("webkitfullscreenchange", atualizarEstadoTelaCheia);
    window.addEventListener("maninho-native-touch", receberToqueNativo);

    return () => {
      document.removeEventListener("fullscreenchange", atualizarEstadoTelaCheia);
      document.removeEventListener("webkitfullscreenchange", atualizarEstadoTelaCheia);
      window.removeEventListener("maninho-native-touch", receberToqueNativo);
      atualizarClasseTelaCheia(false);

      if (Capacitor.isNativePlatform()) {
        ImmersiveMode.setEnabled({ enabled: false }).catch(() => {});
        ImmersiveMode.setOrientation({ orientation: "unspecified" }).catch(() => {});
      } else {
        ajustarOrientacaoTelaCheia(false);
      }
    };
  }, []);

  // Mostra o botão ao entrar e esconde após 3 segundos sem interação.
  useEffect(() => {
    if (temporizadorVoltarRef.current) {
      window.clearTimeout(temporizadorVoltarRef.current);
      temporizadorVoltarRef.current = null;
    }

    if (!telaCheia) {
      setMostrarBotaoVoltar(true);
      return undefined;
    }

    setMostrarBotaoVoltar(true);
    temporizadorVoltarRef.current = window.setTimeout(() => {
      setMostrarBotaoVoltar(false);
      temporizadorVoltarRef.current = null;
    }, 3000);

    return () => {
      if (temporizadorVoltarRef.current) {
        window.clearTimeout(temporizadorVoltarRef.current);
        temporizadorVoltarRef.current = null;
      }
    };
  }, [telaCheia]);

  function revelarBotaoVoltar() {
    if (!telaCheiaRef.current) return;

    setMostrarBotaoVoltar(true);

    if (temporizadorVoltarRef.current) {
      window.clearTimeout(temporizadorVoltarRef.current);
    }

    temporizadorVoltarRef.current = window.setTimeout(() => {
      setMostrarBotaoVoltar(false);
      temporizadorVoltarRef.current = null;
    }, 3000);
  }

  async function alternarTelaCheia() {
    const elemento = playerRef.current;
    if (!elemento) return;

    try {
      // No Android, não dependemos da Fullscreen API do WebView.
      // O player é expandido pelo CSS e as barras são controladas nativamente.
      if (Capacitor.isNativePlatform()) {
        const novoEstado = !telaCheia;

        if (novoEstado) {
          telaCheiaRef.current = true;
          setTelaCheia(true);
          atualizarClasseTelaCheia(true);
          await ajustarOrientacaoTelaCheia(true);
          await ajustarBarrasAndroid(true);
        } else {
          telaCheiaRef.current = false;
          setTelaCheia(false);
          atualizarClasseTelaCheia(false);
          await ajustarBarrasAndroid(false);
          await ajustarOrientacaoTelaCheia(false);
        }

        return;
      }

      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }

        telaCheiaRef.current = false;
        setTelaCheia(false);
        atualizarClasseTelaCheia(false);
        await ajustarOrientacaoTelaCheia(false);
        return;
      }

      if (elemento.requestFullscreen) {
        await elemento.requestFullscreen();
        await ajustarOrientacaoTelaCheia(true);
      } else if (elemento.webkitRequestFullscreen) {
        elemento.webkitRequestFullscreen();
        await ajustarOrientacaoTelaCheia(true);
      } else {
        window.alert("A tela cheia não é compatível com este navegador.");
      }
    } catch (error) {
      console.error("Não foi possível alterar a tela cheia:", error);
      window.alert("Não foi possível ativar a tela cheia neste dispositivo.");
    }
  }

  useEffect(() => {
    carregarCanais();
    carregarJogos();
    carregarConfiguracoesSite();

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

  // ==========================================
  // CONFIGURACOES DO SITE
  // ==========================================

  async function carregarConfiguracoesSite() {
    setCarregandoConfig(true);

    const { data, error } = await supabase
      .from("configuracoes_site")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar configurações:", error);
      setMensagemConfig(
        "Não foi possível carregar as configurações do site."
      );
    } else if (data) {
      setConfigSite({
        ...configuracaoVazia,
        ...data
      });
    }

    setCarregandoConfig(false);
  }

  function atualizarConfigSite(e) {
    const { name, value, type, checked } = e.target;

    setConfigSite((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function salvarConfiguracoesSite(e) {
    e.preventDefault();
    setMensagemConfig("");

    if (!administrador) {
      setMensagemConfig(
        "Somente o administrador pode alterar essas configurações."
      );
      return;
    }

    const apkUrl = configSite.apk_url.trim();
    const tutorialUrl = configSite.tutorial_url.trim();

    if (apkUrl && !/^https?:\/\//i.test(apkUrl)) {
      setMensagemConfig(
        "O link do aplicativo precisa começar com http:// ou https://."
      );
      return;
    }

    if (
      tutorialUrl &&
      !/^https?:\/\//i.test(tutorialUrl)
    ) {
      setMensagemConfig(
        "O link do tutorial precisa começar com http:// ou https://."
      );
      return;
    }

    setSalvandoConfig(true);

    const dados = {
      id: 1,
      apk_url: apkUrl,
      download_ativo: configSite.download_ativo,
      tutorial_titulo:
        configSite.tutorial_titulo.trim() ||
        "Como usar o MANINHO TV",
      tutorial_descricao:
        configSite.tutorial_descricao.trim(),
      tutorial_url: tutorialUrl,
      tutorial_ativo: configSite.tutorial_ativo,
      atualizado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from("configuracoes_site")
      .upsert(dados, { onConflict: "id" });

    if (error) {
      console.error("Erro ao salvar configurações:", error);
      setMensagemConfig(
        "Erro ao salvar configurações: " + error.message
      );
    } else {
      setConfigSite({
        ...configuracaoVazia,
        ...dados
      });

      setMensagemConfig(
        "Configurações do site salvas com sucesso!"
      );

      await carregarConfiguracoesSite();
    }

    setSalvandoConfig(false);
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
      await carregarConfiguracoesSite();
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
      stream_url: canal.stream_url || "",
      stream_url_2: canal.stream_url_2 || ""
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

    for (const [rotulo, endereco] of [
      ["Servidor 1", formulario.stream_url],
      ["Servidor 2", formulario.stream_url_2]
    ]) {
      if (endereco.trim() && !/^https?:\/\//i.test(endereco.trim())) {
        setMensagem(`O link do ${rotulo} precisa começar com http:// ou https://.`);
        return;
      }
    }

    setSalvando(true);

    const dados = {
      nome: formulario.nome.trim(),
      categoria: formulario.categoria,
      logo_url: formulario.logo_url.trim() || null,
      stream_url: formulario.stream_url.trim() || null,
      stream_url_2: formulario.stream_url_2.trim() || null
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
    url: "",
    stream1: canal.stream_url || "",
    stream2: canal.stream_url_2 || "",
    online: true
  }));

  const todosCanais = [...canaisIniciais, ...canaisOnline];

  const filtrados = todosCanais.filter((canal) => {
    const combinaCategoria =
      categoria === "Todos" ||
      String(canal.categoria || "").trim().toLowerCase() === categoria.trim().toLowerCase();

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
      String(canal.categoria || "").trim().toLowerCase() === categoriaAdmin.trim().toLowerCase();

    return nomeCombina && categoriaCombina;
  });

  const jogosDeHoje = jogos.filter(
    (jogo) =>
      jogo.ativo &&
      jogo.data_jogo === dataLocalHoje()
  );

  const urlVideoTutorial = obterUrlVideo(configSite.tutorial_url);

  function assistirCanal(canal) {
    setSelecionado({ ...canal, url: "" });
    setMostrarEscolhaServidor(true);

    window.setTimeout(() => {
      document.querySelector(".player-area")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  }

  function escolherServidor(numero) {
    if (!selecionado) return;
    const endereco = numero === 2
      ? selecionado.stream2
      : selecionado.stream1;

    if (!endereco) return;

    setSelecionado((anterior) => ({
      ...anterior,
      url: endereco,
      servidorEscolhido: numero
    }));
    setMostrarEscolhaServidor(false);
  }


  function explorarCanais() {
    setCategoria("Todos");
    setBusca("");
    setSelecionado(null);
    setMostrarEscolhaServidor(false);
    setMostrarPainel(false);
    setMostrarLogin(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navegarParaCategoria(novaCategoria) {
    setCategoria(novaCategoria);
    setBusca("");
    setSelecionado(null);
    setMostrarEscolhaServidor(false);
    setMostrarPainel(false);
    setMostrarLogin(false);

    window.setTimeout(() => {
      document.getElementById("lista-canais")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);
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

          <span className="marca-maninho">MANINHO</span><strong className="marca-tv">TV</strong>
        </div>

        <nav className="menu-principal">
          <button onClick={explorarCanais}>⌂ Início</button>
          {["Filmes", "Séries", "Desenhos", "TV", "Esportes"].map((item) => (
            <button
              key={item}
              className={categoria === item ? "ativo" : ""}
              onClick={() => navegarParaCategoria(item)}
            >
              {item === "Filmes" ? "🎬 " : item === "Séries" ? "🎭 " : item === "Desenhos" ? "🐉 " : item === "TV" ? "📺 " : "⚽ "}
              {item}
            </button>
          ))}
          <button onClick={irParaDoacoes}>❤️ Apoie</button>
          <button type="button" className="botao-menu-admin" onClick={abrirAcessoAdmin}>
            {administrador ? "👑 Painel ADM" : "🔐 Área ADM"}
          </button>
        </nav>

        <div className="status">
          <span className="bolinha"></span> ONLINE
        </div>
      </header>

      <nav className="categorias-destaque" aria-label="Categorias do MANINHO TV">
        {[
          { nome: "Filmes", icone: "🎬", cor: "roxo" },
          { nome: "Séries", icone: "🎭", cor: "rosa" },
          { nome: "Desenhos", icone: "🐉", cor: "azul" },
          { nome: "TV", icone: "📺", cor: "ciano" },
          { nome: "Esportes", icone: "⚽", cor: "verde" }
        ].map((item) => (
          <button
            type="button"
            key={item.nome}
            className={`categoria-destaque-card ${item.cor} ${categoria === item.nome ? "ativo" : ""}`}
            onClick={() => navegarParaCategoria(item.nome)}
          >
            {item.nome === "TV" ? (
              <span className="categoria-tv-foto-wrap">
                <img
                  className="categoria-tv-foto"
                  src={logoSite}
                  alt="MANINHO TV"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="categoria-tv-hashtag">#</span>
              </span>
            ) : (
              <span>{item.icone}</span>
            )}
            <strong>{item.nome}</strong>
          </button>
        ))}
        <button type="button" className="categoria-destaque-card adm" onClick={abrirAcessoAdmin}>
          <span>👑</span>
          <strong>ADM</strong>
        </button>
      </nav>

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

        {/* DOWNLOAD DO APLICATIVO */}

        {!carregandoConfig && configSite.download_ativo && (
          <section
            className="conteudo"
            id="baixar-aplicativo"
          >
            <div
              className="card"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                padding: "25px",
                border: "1px solid #ed3030",
                background:
                  "linear-gradient(135deg, #151b27, #24202a)"
              }}
            >
              <div style={{ flex: "1", minWidth: "220px" }}>
                <span className="etiqueta">
                  APLICATIVO OFICIAL
                </span>

                <h2 style={{ marginTop: "12px" }}>
                  📱 MANINHO TV no seu celular
                </h2>

                <p>
                  Baixe nosso aplicativo e tenha acesso ao MANINHO TV
                  diretamente no seu celular.
                </p>
              </div>

              {configSite.apk_url ? (
                <a
                  href={configSite.apk_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="botao"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    minWidth: "190px",
                    textAlign: "center"
                  }}
                >
                  ⬇ BAIXAR APLICATIVO
                </a>
              ) : (
                <span
                  style={{
                    opacity: 0.7,
                    fontSize: "14px"
                  }}
                >
                  Download em breve.
                </span>
              )}
            </div>
          </section>
        )}

        {/* TUTORIAL DO APLICATIVO */}

        {!carregandoConfig && configSite.tutorial_ativo && (
          <section
            className="conteudo"
            id="tutorial-aplicativo"
          >
            <div className="titulo">
              <div>
                <h2>
                  🎬 {configSite.tutorial_titulo || "Como usar o MANINHO TV"}
                </h2>

                <p>
                  {configSite.tutorial_descricao ||
                    "Aprenda a utilizar nosso aplicativo."}
                </p>
              </div>

              <span className="etiqueta">
                TUTORIAL
              </span>
            </div>

            {urlVideoTutorial ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: "850px",
                  margin: "20px auto",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  borderRadius: "14px",
                  border: "1px solid #26364b",
                  background: "#080b10"
                }}
              >
                <iframe
                  src={urlVideoTutorial}
                  title={configSite.tutorial_titulo || "Tutorial MANINHO TV"}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "0"
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="vazio">
                Tutorial em vídeo em breve.
              </p>
            )}
          </section>
        )}

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
                      disabled={!canal?.stream_url && !canal?.stream_url_2}
                      onClick={() => {
                        if (!canal?.stream_url && !canal?.stream_url_2) return;

                        assistirCanal({
                          id: `online-${canal.id}`,
                          bancoId: canal.id,
                          nome: canal.nome,
                          categoria: canal.categoria,
                          icone: canal.logo_url || "📺",
                          stream1: canal.stream_url || "",
                          stream2: canal.stream_url_2 || "",
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

        {/* ESCOLHA DO SERVIDOR */}

        {mostrarEscolhaServidor && selecionado && (
          <div className="servidor-modal-fundo" role="dialog" aria-modal="true" aria-labelledby="titulo-escolha-servidor">
            <div className="servidor-modal">
              <button
                type="button"
                className="servidor-modal-fechar"
                onClick={() => {
                  setMostrarEscolhaServidor(false);
                  setSelecionado(null);
                }}
                aria-label="Fechar"
              >
                ×
              </button>
              <span className="servidor-modal-icone">📺</span>
              <h2 id="titulo-escolha-servidor">Onde deseja assistir?</h2>
              <p>{selecionado.nome}</p>
              <div className="servidor-opcoes">
                {selecionado.stream1 && (
                  <button type="button" onClick={() => escolherServidor(1)}>
                    <strong>▶ SERVIDOR 1</strong>
                    <small>Opção principal</small>
                  </button>
                )}
                {selecionado.stream2 && (
                  <button type="button" onClick={() => escolherServidor(2)}>
                    <strong>▶ SERVIDOR 2</strong>
                    <small>Opção alternativa</small>
                  </button>
                )}
              </div>
              {!selecionado.stream1 && !selecionado.stream2 && (
                <p className="servidor-sem-link">Este canal ainda não possui links de transmissão cadastrados.</p>
              )}
            </div>
          </div>
        )}

        {/* PLAYER */}

        <section className="player-area">

          {selecionado && (
            <div className="canal-acoes">
              <h2>{selecionado.nome}</h2>

            </div>
          )}

          <div
            className={`player ${telaCheia ? "player-imersivo" : ""}`}
            ref={playerRef}
            onPointerMove={revelarBotaoVoltar}
            onTouchStart={revelarBotaoVoltar}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#050505"
            }}
          >

            {selecionado?.url ? (
              <iframe
                key={`${selecionado.id}-${selecionado.servidorEscolhido || 1}`}
                src={selecionado.url}
                title={selecionado.nome}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  minHeight: "300px",
                  border: "0"
                }}
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

            <div
              className="player-marca"
              aria-label="Marca d’água MANINHO TV"
              style={{
                position: "absolute",
                left: "14px",
                bottom: "14px",
                zIndex: 20,
                pointerEvents: "none",
                fontWeight: 900,
                fontSize: "clamp(15px, 2.5vw, 22px)",
                letterSpacing: "1px",
                color: "#ff3038",
                textShadow: "0 2px 6px #000, 0 0 4px #000",
                userSelect: "none"
              }}
            >
              <span className="marca-maninho">MANINHO</span> <strong className="marca-tv">TV</strong>
            </div>

            {telaCheia && mostrarBotaoVoltar && (
              <button
                type="button"
                className="player-botao-voltar"
                onClick={alternarTelaCheia}
                aria-label="Voltar e sair da tela cheia"
              >
                ↙ VOLTAR
              </button>
            )}

          </div>

          <div className="player-controles">
            <button
              type="button"
              className="player-botao-tela-cheia"
              onClick={alternarTelaCheia}
              aria-label={telaCheia ? "Sair da tela cheia" : "Ativar tela cheia"}
            >
              {telaCheia ? "⛶ SAIR DA TELA CHEIA" : "⛶ TELA CHEIA"}
            </button>
          </div>
        </section>

        {/* LISTA DE CANAIS */}

        <section className="conteudo" id="lista-canais">

          <div className="titulo">
            <div>
              <h2>{categoria === "Todos" ? "Explore o conteúdo" : `Categoria ${categoria}`}</h2>
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
            {["Todos", "Filmes", "Séries", "Desenhos", "TV", "Esportes"].map((item) => (
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
                Gerencie os canais, a programação e as configurações
                do MANINHO TV.
              </p>

              {/* CONFIGURACOES DE DOWNLOAD E TUTORIAL */}

              <div
                style={{
                  margin: "25px 0",
                  padding: "20px",
                  border: "1px solid #ed3030",
                  borderRadius: "14px",
                  background: "#111923"
                }}
              >
                <h3>📱 Download do aplicativo e tutorial</h3>

                <p>
                  Configure o link de download do APK e o vídeo
                  que aparecerão na página inicial.
                </p>

                {carregandoConfig && (
                  <p>Carregando configurações...</p>
                )}

                <form onSubmit={salvarConfiguracoesSite}>

                  <h3>⬇️ Área de download</h3>

                  <label>Link direto do aplicativo APK</label>

                  <input
                    type="url"
                    name="apk_url"
                    value={configSite.apk_url}
                    onChange={atualizarConfigSite}
                    placeholder="https://seusite.com/maninho-tv.apk"
                  />

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      margin: "15px 0"
                    }}
                  >
                    <input
                      type="checkbox"
                      name="download_ativo"
                      checked={configSite.download_ativo}
                      onChange={atualizarConfigSite}
                      style={{
                        width: "18px",
                        height: "18px"
                      }}
                    />

                    Mostrar área de download no site
                  </label>

                  <hr
                    style={{
                      border: "0",
                      borderTop: "1px solid #344154",
                      margin: "22px 0"
                    }}
                  />

                  <h3>🎬 Área de tutorial</h3>

                  <label>Título do tutorial</label>

                  <input
                    type="text"
                    name="tutorial_titulo"
                    value={configSite.tutorial_titulo}
                    onChange={atualizarConfigSite}
                    placeholder="Como usar o MANINHO TV"
                  />

                  <label>Descrição do tutorial</label>

                  <textarea
                    name="tutorial_descricao"
                    value={configSite.tutorial_descricao}
                    onChange={atualizarConfigSite}
                    placeholder="Escreva uma explicação para os visitantes..."
                    rows="4"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      resize: "vertical",
                      fontFamily: "inherit",
                      marginBottom: "12px"
                    }}
                  />

                  <label>Link do vídeo do YouTube</label>

                  <input
                    type="url"
                    name="tutorial_url"
                    value={configSite.tutorial_url}
                    onChange={atualizarConfigSite}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />

                  <small
                    style={{
                      display: "block",
                      opacity: 0.7,
                      margin: "5px 0 15px"
                    }}
                  >
                    Aceita links do YouTube, youtu.be e Shorts.
                  </small>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      margin: "15px 0"
                    }}
                  >
                    <input
                      type="checkbox"
                      name="tutorial_ativo"
                      checked={configSite.tutorial_ativo}
                      onChange={atualizarConfigSite}
                      style={{
                        width: "18px",
                        height: "18px"
                      }}
                    />

                    Mostrar tutorial no site
                  </label>

                  <button
                    className="botao"
                    type="submit"
                    disabled={salvandoConfig || carregandoConfig}
                  >
                    {salvandoConfig
                      ? "SALVANDO..."
                      : "💾 SALVAR CONFIGURAÇÕES DO SITE"}
                  </button>

                  {mensagemConfig && (
                    <p
                      style={{
                        marginTop: "15px",
                        color: mensagemConfig.includes("sucesso")
                          ? "#42d392"
                          : "#ff7777"
                      }}
                    >
                      {mensagemConfig}
                    </p>
                  )}

                </form>
              </div>

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
                  <option value="Filmes">Filmes</option>
                  <option value="Séries">Séries</option>
                  <option value="Desenhos">Desenhos</option>
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
                  type="url"
                  value={formulario.stream_url}
                  onChange={atualizarFormulario}
                  placeholder="https://..."
                />

                <label>Link da transmissão — Servidor 2 (opcional)</label>
                <input
                  name="stream_url_2"
                  type="url"
                  value={formulario.stream_url_2}
                  onChange={atualizarFormulario}
                  placeholder="https://..."
                />
                <small style={{ display: "block", opacity: 0.7, margin: "-4px 0 14px" }}>
                  O usuário poderá escolher entre os dois servidores ao abrir o canal.
                </small>

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
                  {["Todos", "Filmes", "Séries", "Desenhos", "TV", "Esportes"].map((item) => (
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

      <nav className="menu-inferior" aria-label="Navegação inferior">
        <button type="button" onClick={explorarCanais}><span>⌂</span>Início</button>
        <button type="button" className={categoria === "Filmes" ? "ativo" : ""} onClick={() => navegarParaCategoria("Filmes")}><span>🎬</span>Filmes</button>
        <button type="button" className={categoria === "Séries" ? "ativo" : ""} onClick={() => navegarParaCategoria("Séries")}><span>🎭</span>Séries</button>
        <button type="button" className={categoria === "Desenhos" ? "ativo" : ""} onClick={() => navegarParaCategoria("Desenhos")}><span>🐉</span>Desenhos</button>
        <button type="button" className={categoria === "Esportes" ? "ativo" : ""} onClick={() => navegarParaCategoria("Esportes")}><span>🏆</span>Esportes</button>
        <button type="button" onClick={abrirAcessoAdmin}><span>⚙️</span>ADM</button>
      </nav>

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

          <span className="marca-maninho">MANINHO</span><strong className="marca-tv">TV</strong>

        </div>

        <p>
          © 2026 MANINHO TV - Todos os direitos reservados.
        </p>

      </footer>

    </div>
  );
}
