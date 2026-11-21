// Torre de Controle - Aluminier · liga as contas (logica.js) e as telas (tela.js) ao banco da Aluminier.
import { html, render } from './vendor/preact-htm.js';
import { Logica } from './logica.js?v=20261121165031';
import { desenhar } from './tela.js?v=20261121165031';
import { SUPABASE_URL, SUPABASE_CHAVE, STORAGE_KEY, EMPRESA } from './config.js?v=20261121165031';
import { NOVIDADES } from './novidades.js?v=20261121165031';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, { auth: { storageKey: STORAGE_KEY, persistSession: true, autoRefreshToken: true } });
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* sem armazenamento: segue sem lembrar */ } };

// ---------- Versão publicada (o publicar.ps1 troca 20261121165031 pela data e hora) ----------
const VERSAO = (new URL(import.meta.url).searchParams.get('v') || '');
const versaoDoHtml = (txt) => { const m = String(txt).match(/app\.js\?v=(\d{10,})/); return m ? m[1] : ''; };

// ---------- Banco ⇄ tela ----------
const n = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const TABELA = { tarugo: 'tarugo', sucata: 'sucata', retornos: 'retornos', dias: 'dias', cot: 'cotacoes' };
const doBanco = {
  tarugo: (r) => ({ id: r.id, data: r.data, forn: r.forn, kg: n(r.kg), preco: n(r.preco), so_mo: n(r.so_mo), origem: r.origem }),
  sucata: (r) => ({ id: r.id, data: r.data, forn: r.forn, peso: n(r.peso), perda: n(r.perda) || 0, preco: r.preco == null ? NaN : n(r.preco), usina: r.usina || '', nf: r.nf || '', mo: r.mo == null ? NaN : n(r.mo), pagto: r.pagto || '', pago: !!r.pago, semPreco: !!r.sem_preco }),
  retornos: (r) => ({ id: r.id, data: r.data, usina: r.usina, nfRet: r.nf_ret || '', nfRem: r.nf_rem || '', kg: n(r.kg) }),
  dias: (r) => ({ id: r.id, data: r.data, produz: n(r.produz) || 0, kgfat: n(r.kgfat) || 0, fat: n(r.fat) || 0 }),
  cot: (r) => ({ id: r.id, data: r.data, origem: r.origem || '', forn: r.forn, tipo: r.tipo, preco: n(r.preco), perda: n(r.perda) || 0, frete: n(r.frete) || 0, mo: n(r.mo) || 0 })
};
const fin = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
const paraBanco = {
  tarugo: (r) => ({ data: r.data, forn: r.forn, kg: r.kg, preco: fin(r.preco) }),
  sucata: (r) => ({ data: r.data, forn: r.forn, peso: r.peso, perda: r.perda, preco: fin(r.preco), usina: r.usina || null, nf: r.nf || null, mo: fin(r.mo), pagto: r.pagto || null, sem_preco: !(r.preco > 0) }),
  retornos: (r) => ({ data: r.data, usina: r.usina, nf_ret: r.nfRet || null, nf_rem: r.nfRem || null, kg: r.kg }),
  dias: (r) => ({ data: r.data, produz: r.produz || 0, kgfat: r.kgfat || 0, fat: r.fat || 0 }),
  cot: (r) => ({ data: r.data || null, forn: r.forn, tipo: r.tipo, preco: r.preco, perda: r.perda || 0, frete: r.frete || 0, mo: r.mo || 0 })
};
async function lerTudo(tabela, filtroExcluido = true) {
  const tudo = [];
  for (let de = 0; ; de += 1000) {
    let q = sb.from(tabela).select('*').order('id', { ascending: true }).range(de, de + 999);
    if (filtroExcluido) q = q.is('excluido_em', null);
    const { data, error } = await q;
    if (error) throw error;
    tudo.push(...data);
    if (data.length < 1000) return tudo;
  }
}
const STATUS = { recebida: 'Recebida', em_analise: 'Em análise', feita: 'Feita', nao_vamos_fazer: 'Não vamos fazer' };
const PAPEIS = [['admin', 'Administrador'], ['operador', 'Lança e vê'], ['leitura', 'Só vê'], ['pendente', 'Aguardando liberação'], ['bloqueado', 'Bloqueado']];

class App extends Logica {
  constructor(props) {
    super(props);
    Object.assign(this.state, {
      tab: lsGet('alu-aba', 'apresentacao'), // quem é novo começa na Apresentação
      sessao: null, perfil: null, carregando: true, falhaCarga: '', verificando: true, salvando: false, historicoAte: '',
      tarugo: [], dias: [], sucata: [], retornos: [], cot: [], meses: {}, listaMeses: [], mes: '', fs: {}, periodo: '12',
      ini: {}, sugs: [], usuarios: [], login: { email: '', senha: '', modo: 'entrar', msg: '', ocupado: false },
      novaVersao: false, novidades: null, errosSeguidos: 0, historicoVazio: false, importando: false, respostas: {}
    });
  }

  // ---------- sessão ----------
  async componentDidMount() {
    const { data } = await sb.auth.getSession();
    this.aoEntrar(data.session);
    sb.auth.onAuthStateChange((ev, sessao) => {
      if (ev === 'PASSWORD_RECOVERY') this.setState({ recuperando: true }); // veio do link "Esqueci a senha": pede a senha nova
      if ((sessao && sessao.user.id) !== this._uid) this.aoEntrar(sessao);
    });
    // versão nova: confere a cada 2 minutos e quando a pessoa volta para a aba. Nunca recarrega sozinho.
    this._versao = setInterval(() => this.verificarVersao(), 120000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.verificarVersao(); });
    this.verificarVersao();
    this.mostrarNovidadesSeAtualizou();
  }
  async aoEntrar(sessao, forcar) {
    const uid = sessao ? sessao.user.id : null;
    if (!forcar && uid && uid === this._uid && this.state.perfil) return; // mesmo usuário: não carrega duas vezes
    this._uid = uid;
    this.setState({ sessao, perfil: null, verificando: false });
    if (!sessao) { this.setState({ carregando: false }); return; }
    const { data: perfil, error } = await sb.from('perfis').select('*').eq('user_id', sessao.user.id).maybeSingle();
    if (error) { this.setState({ perfil: { papel: 'erro' }, falhaCarga: 'Não consegui conferir o seu acesso (' + error.message + '). Confira a internet e tente de novo.', carregando: false }); return; }
    if (forcar && perfil && !['admin', 'operador', 'leitura'].includes(perfil.papel)) this.aviso('Ainda não liberaram o seu acesso. Tente daqui a pouco.');
    this.setState({ perfil });
    if (perfil && ['admin', 'operador', 'leitura'].includes(perfil.papel)) await this.carregar();
    else this.setState({ carregando: false });
  }
  async sair() { await sb.auth.signOut({ scope: 'local' }); this.setState({ sessao: null, perfil: null }); }

  async carregar() {
    this.setState({ carregando: true, falhaCarga: '' });
    try {
      const [tarugo, dias, sucata, retornos, cot, meses, parametros] = await Promise.all([
        lerTudo('tarugo'), lerTudo('dias'), lerTudo('sucata'), lerTudo('retornos'), lerTudo('cotacoes'),
        sb.from('meses').select('*').then((r) => { if (r.error) throw r.error; return r.data; }),
        sb.from('parametros').select('*').then((r) => { if (r.error) throw r.error; return r.data; })
      ]);
      const st = {
        tarugo: tarugo.map(doBanco.tarugo), dias: dias.map(doBanco.dias), sucata: sucata.map(doBanco.sucata),
        retornos: retornos.map(doBanco.retornos), cot: cot.map(doBanco.cot), meses: {}
      };
      meses.forEach((m) => { st.meses[m.mes] = { mes: m.mes, necessidade: n(m.necessidade), carteiraKg: n(m.carteira_kg), carteiraPreco: n(m.carteira_preco), lme: n(m.lme), dolar: n(m.dolar), saldos: m.saldos || {}, previsao: m.previsao || [], aba: m.aba }; });
      const par = {}; parametros.forEach((p) => { par[p.chave] = p.valor; });
      st.fundicoes = Array.isArray(par.fundicoes) ? par.fundicoes : [];
      st.ini = Object.assign(Object.fromEntries(st.fundicoes.map((f) => [f.v, '0'])), Object.fromEntries(Object.entries(par.saldo_inicial || {}).map(([k, v]) => [k, String(v).replace('.', ',')])));
      st.usinaSel = this.state.usinaSel || (st.fundicoes[0] && st.fundicoes[0].v) || '';
      const todos = {}; st.tarugo.concat(st.dias, st.sucata).forEach((r) => { if (/^\d{4}-\d{2}/.test(r.data || '')) todos[r.data.slice(0, 7)] = 1; });
      Object.keys(st.meses).forEach((m) => { todos[m] = 1; });
      st.listaMeses = Object.keys(todos).sort().reverse();
      const comFat = {}; st.dias.forEach((d) => { if (d.kgfat > 0) comFat[d.data.slice(0, 7)] = 1; });
      const lembrado = lsGet('alu-mes', '');
      st.mes = (lembrado && todos[lembrado]) ? lembrado : (st.listaMeses.find((m) => comFat[m]) || st.listaMeses[0] || new Date().toISOString().slice(0, 7));
      if (!st.listaMeses.length) st.listaMeses = [st.mes];
      const carga = par.historico_carregado || null;
      this.setState(Object.assign(st, { historicoVazio: !carga, historicoAte: carga ? String(carga.ate || '') : '', historico: true }));
      const br = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','));
      this.setState((s) => ({ par: Object.assign({}, s.par, this.parDoMes(st.mes, st.meses), { moPadrao: br(par.mo_padrao ?? 2.9), sobraMin: br(par.sobra_min), maxParado: br(par.max_parado), taxa: br(par.taxa) }) }));
      // voltou do "Atualizar": devolve o que estava digitado (nada se perde)
      const rasc = lsGet('alu-rascunho', null);
      if (rasc && rasc.fs) { this.setState({ fs: rasc.fs, tab: rasc.tab || this.state.tab }); lsSet('alu-rascunho', null); }
      await this.carregarSugestoes();
      if (this.state.perfil.papel === 'admin') await this.carregarUsuarios();
    } catch (e) {
      this.setState({ falhaCarga: 'Não consegui carregar os dados agora (' + (e.message || e) + '). Confira a internet e clique em Tentar de novo.' });
    }
    this.setState({ carregando: false });
  }

  // ---------- gravação (as contas e a tela continuam as da Logica) ----------
  // Uma gravação por vez: clique duplo ou Enter duplo não grava duas linhas.
  grava(lista, r) {
    if (this._salvando) return 'Aguarde: ainda salvando o lançamento anterior.';
    this._salvando = true;
    this._grava(lista, r).finally(() => { this._salvando = false; });
    return '';
  }
  async _grava(lista, r) {
    if (this.state.perfil.papel === 'leitura') { this.setState({ erro: 'Seu acesso é só para ver. Peça ao administrador para lançar.' }); return; }
    if (this.state.historicoVazio) { this.setState({ erro: 'Antes de lançar, o administrador precisa carregar o histórico das planilhas (tela Usuários).' }); return; }
    this.setState({ salvando: true });
    try { await this._grava2(lista, r); } finally { this.setState({ salvando: false }); }
  }
  async _grava2(lista, r) {
    const aba = this.state.tab; // guardados agora: a pessoa pode trocar de tela enquanto o banco responde
    const tabela = TABELA[lista], ed = this.state.edit && this.state.edit.lista === lista ? this.state.edit : null;
    const linha = paraBanco[lista](r);
    let res;
    if (ed) res = await sb.from(tabela).update(linha).eq('id', ed.id).select().single();
    else {
      // cotação nova: grava primeiro e só depois aposenta a antiga do mesmo fornecedor/tipo/perda (se a nova falhar, a antiga fica)
      res = await sb.from(tabela).insert(linha).select().single();
      if (!res.error && lista === 'cot') {
        const velhas = this.state.cot.filter((x) => x.forn === r.forn && x.tipo === r.tipo && Math.abs((x.perda || 0) - (r.perda || 0)) < 1e-6).map((x) => x.id);
        if (velhas.length) { const v = await sb.from('cotacoes').update({ excluido_em: new Date().toISOString() }).in('id', velhas); if (v.error) this.aviso('A cotação nova foi salva, mas a antiga continua na lista: ' + v.error.message); }
      }
    }
    if (res.error) { this.falhou('Não salvou: ' + res.error.message); return; }
    this.setState({ errosSeguidos: 0 });
    const novo = doBanco[lista](res.data);
    if (ed) {
      this.setState((s) => ({ [lista]: s[lista].map((x) => (x.id === ed.id ? Object.assign({}, x, novo) : x)), edit: s.edit && s.edit.id === ed.id ? null : s.edit }));
      this.limpaF(aba);
      this.irParaMes(lista, novo);
      this.aviso('Alteração salva. As contas e o painel já foram refeitos.');
      return;
    }
    this.setState((s) => {
      let lst = s[lista];
      if (lista === 'cot') lst = lst.filter((x) => !(x.forn === novo.forn && x.tipo === novo.tipo && Math.abs((x.perda || 0) - (novo.perda || 0)) < 1e-6));
      return { [lista]: lst.concat([novo]) };
    });
    this.irParaMes(lista, novo);
    const f = (this.state.fs || {})[aba] || {};
    this.limpaF(aba, lista === 'sucata' ? Object.assign({}, f, { peso: '' }) : null);
    this.aviso(lista === 'sucata' ? 'Pesagem salva. Fornecedor, preço e fundição ficaram no formulário para a próxima.' : 'Lançamento salvo. As contas e o painel já foram atualizados.');
  }
  // lançou (ou corrigiu) com data de outro mês: vai para aquele mês, para o lançamento não "sumir" da lista
  irParaMes(lista, novo) {
    const ym = (novo.data || '').slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(ym) && ym !== this.state.mes && lista !== 'cot' && lista !== 'retornos') this.setState((s) => ({ mes: ym, listaMeses: s.listaMeses.indexOf(ym) >= 0 ? s.listaMeses : s.listaMeses.concat([ym]).sort().reverse(), par: Object.assign({}, s.par, this.parDoMes(ym)) }));
  }
  podeEscrever() {
    if (['admin', 'operador'].includes(this.state.perfil.papel)) return true;
    this.aviso('Seu acesso é só para ver. Peça ao administrador para mudar.'); return false;
  }
  // O banco devolve 0 linhas (sem erro) quando a regra de acesso não deixa: isso também é falha.
  async remover(lista, id) {
    if (!this.podeEscrever()) return;
    const { data, error } = await sb.from(TABELA[lista]).update({ excluido_em: new Date().toISOString() }).eq('id', id).select('id');
    if (error || !data || !data.length) { this.falhou('Não excluiu' + (error ? ': ' + error.message : '.')); return; }
    super.remover(lista, id);
  }
  async desfazer() {
    const u = this.ultimoExcluido; if (!u || !this.podeEscrever()) return;
    const { data, error } = await sb.from(TABELA[u.lista]).update({ excluido_em: null }).eq('id', u.item.id).select('id');
    if (error || !data || !data.length) { this.falhou('Não deu para desfazer' + (error ? ': ' + error.message : '.')); return; }
    super.desfazer();
  }
  async alternarPago(id) {
    const item = this.state.sucata.find((x) => x.id === id); if (!item || !this.podeEscrever()) return;
    const { data, error } = await sb.from('sucata').update({ pago: !item.pago }).eq('id', id).select('id');
    if (error || !data || !data.length) { this.falhou('Não salvou o pagamento' + (error ? ': ' + error.message : '.')); return; }
    this.setState((s) => ({ sucata: s.sucata.map((x) => (x.id === id ? Object.assign({}, x, { pago: !item.pago }) : x)) }));
    this.aviso(!item.pago ? 'Marcado como pago.' : 'Voltou para a pagar.');
  }
  falhou(texto) {
    const n2 = this.state.errosSeguidos + 1;
    this.setState({ erro: texto, errosSeguidos: n2 });
    if (n2 >= 2) this.setState({ balao: true, balaoTexto: '' }); // travou duas vezes: o balão abre sozinho
  }

  // metas e parâmetros: grava sozinho 1 segundo depois de parar de digitar
  agendarParametros() {
    if (!this.podeEscrever()) return;
    clearTimeout(this._tPar);
    // fotografia do que a pessoa digitou (mês, metas e saldos), não do que estiver na tela quando o timer disparar
    const fotografia = { mes: this.state.mes, par: Object.assign({}, this.state.par), ini: Object.assign({}, this.state.ini), meses: this.state.meses };
    this._tPar = setTimeout(async () => {
      const s = fotografia, num = (v) => { const x = this.num(v); return isFinite(x) ? x : null; };
      const params = [
        { chave: 'mo_padrao', valor: num(s.par.moPadrao) }, { chave: 'sobra_min', valor: num(s.par.sobraMin) },
        { chave: 'max_parado', valor: num(s.par.maxParado) }, { chave: 'taxa', valor: num(s.par.taxa) },
        { chave: 'saldo_inicial', valor: Object.fromEntries(Object.entries(s.ini).map(([k, v]) => [k, num(v) || 0])) }
      ];
      const r1 = await sb.from('parametros').upsert(params);
      const m = s.meses[s.mes] || {};
      const r2 = await sb.from('meses').upsert({ mes: s.mes, necessidade: num(s.par.necessidade), carteira_kg: num(s.par.carteiraKg), carteira_preco: num(s.par.carteiraPreco), lme: num(s.par.lme), dolar: num(s.par.dolar), saldos: m.saldos || {}, previsao: m.previsao || [] });
      if (r1.error || r2.error) { this.falhou('Não salvou as metas: ' + (r1.error || r2.error).message); return; }
      this.setState((st) => ({ meses: Object.assign({}, st.meses, { [s.mes]: Object.assign({}, m, { mes: s.mes, necessidade: num(s.par.necessidade), carteiraKg: num(s.par.carteiraKg), carteiraPreco: num(s.par.carteiraPreco), lme: num(s.par.lme), dolar: num(s.par.dolar) }) }) }));
      this.aviso('Metas e preços salvos.');
    }, 1000);
  }

  // ---------- sugestões e balão ----------
  async carregarSugestoes() {
    const { data } = await sb.from('sugestoes').select('*').order('criado_em', { ascending: false }).limit(200);
    this.setState({ sugs: (data || []).map((x) => ({ id: x.id, tipo: x.tipo, texto: x.texto, status: STATUS[x.status] || x.status, statusCod: x.status, resposta: x.resposta || '', email: x.email || '', tela: x.tela || '', quando: (x.criado_em || '').slice(0, 10) })) });
  }
  async novaSugestao(tipo, texto, tela) {
    const t = (texto || '').trim(); if (t.length < 3) { this.aviso('Escreva um pouco mais para eu entender.'); return false; }
    if (this._enviando) return false; // clique duplo não manda duas vezes
    this._enviando = true;
    try {
      const { error } = await sb.from('sugestoes').insert({ tipo, texto: t, tela }); // autor e e-mail o banco preenche
      if (error) { this.falhou('Não enviou: ' + error.message); this.aviso('Não enviou: ' + error.message); return false; }
      await this.carregarSugestoes();
      return true;
    } finally { this._enviando = false; }
  }
  async mandarBalao(tipo) {
    if (await this.novaSugestao(tipo, this.state.balaoTexto, this.state.tab)) { this.setState({ balaoTexto: '', balao: false, errosSeguidos: 0 }); this.aviso('Recebido. A resposta aparece em Sugestões.'); }
  }
  async responder(id) {
    // só o que mudou: mudar a situação não apaga a resposta, e mudar o texto não volta a situação
    const r = this.state.respostas[id] || {}, atual = this.state.sugs.find((x) => x.id === id) || {};
    const status = r.status || (atual.statusCod === 'recebida' ? 'em_analise' : atual.statusCod);
    const resposta = r.texto !== undefined ? (r.texto.trim() || null) : (atual.resposta || null);
    const { error } = await sb.from('sugestoes').update({ status, resposta, respondido_em: new Date().toISOString() }).eq('id', id);
    if (error) { this.aviso('Não salvou a resposta: ' + error.message); return; }
    this.setState((s) => { const rs = Object.assign({}, s.respostas); delete rs[id]; return { respostas: rs }; });
    await this.carregarSugestoes(); this.aviso('Resposta salva. Quem sugeriu vê em Sugestões.');
  }

  // ---------- usuários (só admin) ----------
  async carregarUsuarios() {
    const { data } = await sb.from('perfis').select('*').order('criado_em');
    this.setState({ usuarios: data || [] });
  }
  async mudarPapel(uid, papel) {
    if (uid === this.state.sessao.user.id && papel !== 'admin') { this.aviso('Você não pode tirar o seu próprio acesso de administrador.'); return; }
    const { error } = await sb.from('perfis').update({ papel }).eq('user_id', uid);
    if (error) { this.aviso('Não mudou: ' + error.message); return; }
    await this.carregarUsuarios(); this.aviso('Acesso atualizado.');
  }
  async importarArquivo(ev) {
    const arq = ev.target.files && ev.target.files[0]; if (!arq) return;
    this.setState({ importando: true });
    try {
      let txt = await arq.text();
      txt = txt.replace(/^[\s\S]*?window\.\w+\s*=\s*/, '').replace(/;\s*$/, ''); // aceita o .json ou o historico.js do protótipo
      const dados = JSON.parse(txt);
      const { data, error } = await sb.rpc('importar_historico', { dados });
      if (error) throw error;
      this.aviso('Histórico carregado: ' + data.tarugo + ' entradas de tarugo, ' + data.dias + ' dias, ' + data.sucata + ' compras de sucata.');
      await this.carregar();
    } catch (e) { this.aviso('Não carregou: ' + (e.message || e)); }
    this.setState({ importando: false });
    ev.target.value = '';
  }

  // ---------- versão nova e novidades ----------
  async verificarVersao() {
    if (!VERSAO || VERSAO.startsWith('__') || this.state.novaVersao) return;
    try {
      const r = await fetch(location.pathname + '?v=' + Date.now(), { cache: 'no-store' });
      const nova = versaoDoHtml(await r.text());
      if (nova && nova !== VERSAO) this.setState({ novaVersao: true });
    } catch (_) { /* sem rede: tenta de novo depois */ }
  }
  mostrarNovidadesSeAtualizou() {
    const vista = lsGet('alu-novidades', '');
    const ultima = NOVIDADES[0] && NOVIDADES[0].versao;
    if (ultima && vista && vista !== ultima) this.setState({ novidades: NOVIDADES.filter((x) => x.versao > vista) });
    if (ultima && !vista) lsSet('alu-novidades', ultima); // primeira vez: não mostra o quadro
  }

  // ---------- telas ----------
  telas() {
    const t = super.telas();
    if (t && t.ed && this.state.edit && this.state.edit.lista === 'sucata') { const id = this.state.edit.id; t.ed.pago = () => this.alternarPago(id); }
    if (t && t.ed && this.state.perfil && this.state.perfil.papel === 'leitura') { t.ed.temPago = false; }
    if (t && this.state.salvando) t.botao = 'Salvando…';
    return t;
  }
  renderVals() {
    const v = super.renderVals();
    const s = this.state, admin = s.perfil && s.perfil.papel === 'admin';
    // lembra a aba e o mês
    lsSet('alu-aba', s.tab); if (s.mes) lsSet('alu-mes', s.mes);
    if (admin) v.tabs.push({ label: 'Usuários', go: () => { this.setState({ tab: 'usuarios' }); this.carregarUsuarios(); }, style: 'height:44px;padding:0 16px;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer;white-space:nowrap;flex:0 0 auto;' + (s.tab === 'usuarios' ? 'background:#0d1117;color:#ffffff;border:1px solid #0d1117' : 'background:#ffffff;color:#2a3540;border:1px solid #c9cfd8') });
    v.parCampos = v.parCampos.map((c) => Object.assign({}, c, { onChange: (e) => { c.onChange(e); this.agendarParametros(); } }));
    v.sug.salvar = async (e) => { e.preventDefault(); if (await this.novaSugestao(s.sugTipo, s.sugTexto, 'sugestoes')) { this.setState({ sugTexto: '' }); this.aviso('Sugestão enviada. A resposta aparece aqui.'); } };
    v.sug.lista = s.sugs;
    v.msg.desfazer = () => this.desfazer();
    v.fonte = s.historicoVazio ? 'Ainda sem dados: o administrador carrega o histórico em Usuários' : v.fonte;
    return v;
  }

  render() {
    const s = this.state;
    if (s.recuperando && s.sessao) return this.telaNovaSenha();
    if (s.verificando) return html`<div class="centro">Carregando…</div>`; // ainda conferindo se já está logado: não mostra o login à toa
    if (!s.sessao) return this.telaLogin();
    if (!s.perfil) return html`<div class="centro">Carregando…</div>`;
    if (s.perfil.papel === 'erro') return html`<div class="centro"><p>${s.falhaCarga}</p><button class="btn" onClick=${() => this.aoEntrar(s.sessao, true)}>Tentar de novo</button></div>`;
    if (!['admin', 'operador', 'leitura'].includes(s.perfil.papel)) return this.telaAguardando();
    if (s.carregando) return html`<div class="centro">Carregando os seus números…</div>`;
    if (s.falhaCarga) return html`<div class="centro"><p>${s.falhaCarga}</p><button class="btn" onClick=${() => this.carregar()}>Tentar de novo</button></div>`;
    const v = this.renderVals();
    const admin = s.perfil.papel === 'admin';
    return html`
      ${s.novaVersao ? html`<div class="faixa-versao" role="status"><span>Saiu uma versão nova, com melhorias. Salve o que estiver fazendo e clique em Atualizar.</span><button type="button" onClick=${() => { lsSet('alu-rascunho', { fs: s.fs, tab: s.tab }); location.reload(); }}>Atualizar</button></div>` : null}
      ${desenhar(v)}
      ${s.tab === 'sugestoes' ? this.blocoRespostas(admin) : null}
      ${s.tab === 'usuarios' && admin ? this.telaUsuarios() : null}
      <div class="rodape"><span>${s.sessao.user.email} · ${PAPEIS.find((p) => p[0] === s.perfil.papel)[1]}</span><button type="button" class="link" onClick=${() => this.sair()}>Sair</button></div>
      ${s.novidades && s.novidades.length ? html`<div class="modal" role="dialog" aria-modal="true" aria-label="Novidades"><div class="modal-caixa">
        <h2>O que mudou</h2>
        ${s.novidades.map((b) => html`<h3>${b.titulo}</h3><ul>${b.itens.map((i) => html`<li>${i}</li>`)}</ul>`)}
        <button class="btn" type="button" onClick=${() => { lsSet('alu-novidades', NOVIDADES[0].versao); this.setState({ novidades: null }); }}>Entendi</button>
      </div></div>` : null}`;
  }

  blocoRespostas(admin) {
    const s = this.state;
    const lista = s.sugs;
    return html`<section class="cartao" style="margin: 0 28px 28px;">
      <h2 class="h2">${admin ? 'Todas as sugestões (responda aqui)' : 'Suas sugestões e a resposta'}</h2>
      ${!lista.length ? html`<p class="ajuda">Nenhuma sugestão ainda.</p>` : null}
      ${lista.map((x) => html`<div class="sug">
        <div><span class="selo">${x.status}</span> <strong>${x.tipo}</strong> · ${x.quando.split('-').reverse().join('/')} ${admin ? ' · ' + x.email + (x.tela ? ' · tela ' + x.tela : '') : ''}</div>
        <div>${x.texto}</div>
        ${x.resposta ? html`<div class="resposta"><strong>Resposta:</strong> ${x.resposta}</div>` : (!admin ? html`<div class="ajuda" style="margin: 0;">Ainda sem resposta.</div>` : null)}
        ${admin ? html`<div class="linha">
          <label class="vis" for=${'st' + x.id}>Situação</label>
          <select id=${'st' + x.id} value=${(s.respostas[x.id] || {}).status || x.statusCod} onChange=${(e) => this.setState({ respostas: Object.assign({}, s.respostas, { [x.id]: Object.assign({}, s.respostas[x.id], { status: e.target.value }) }) })}>
            ${Object.entries(STATUS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}
          </select>
          <label class="vis" for=${'rp' + x.id}>Resposta</label>
          <input id=${'rp' + x.id} placeholder="Resposta para quem sugeriu" value=${(s.respostas[x.id] || {}).texto ?? x.resposta} onInput=${(e) => this.setState({ respostas: Object.assign({}, s.respostas, { [x.id]: Object.assign({}, s.respostas[x.id], { texto: e.target.value }) }) })} />
          <button class="btn-borda" type="button" onClick=${() => this.responder(x.id)}>Salvar resposta</button>
        </div>` : null}
      </div>`)}
    </section>`;
  }

  telaUsuarios() {
    const s = this.state;
    return html`<section style="padding: 0 28px 28px; display: flex; flex-direction: column; gap: 20px;">
      <div class="cartao">
        <h2 class="h2">Quem acessa o sistema</h2>
        <p class="ajuda">Quem cria o acesso na tela de entrada aparece aqui como "Aguardando liberação". Escolha o que cada pessoa pode fazer.</p>
        <div style="overflow-x: auto;"><table><thead><tr><th>E-mail</th><th>Desde</th><th>Acesso</th></tr></thead><tbody>
        ${s.usuarios.map((u) => html`<tr><td>${u.email}</td><td>${(u.criado_em || '').slice(0, 10).split('-').reverse().join('/')}</td><td>
          <label class="vis" for=${'pp' + u.user_id}>Acesso de ${u.email}</label>
          <select id=${'pp' + u.user_id} value=${u.papel} onChange=${(e) => this.mudarPapel(u.user_id, e.target.value)}>${PAPEIS.map((p) => html`<option value=${p[0]}>${p[1]}</option>`)}</select></td></tr>`)}
        </tbody></table></div>
      </div>
      ${s.historicoVazio ? html`<div class="cartao">
        <h2 class="h2">Carregar o histórico das planilhas</h2>
        <p class="ajuda">Uma vez só, com o banco vazio. Escolha o arquivo do histórico que a Capacity Case enviou. Os dados vão direto para o banco da Aluminier.</p>
        <label class="btn" style="display: inline-flex; align-items: center;">${s.importando ? 'Carregando…' : 'Escolher o arquivo'}<input type="file" accept=".json,.js" style="position: absolute; left: -9999px;" onChange=${(e) => this.importarArquivo(e)} disabled=${s.importando} /></label>
      </div>` : null}
    </section>`;
  }

  telaLogin() {
    const L = this.state.login, set = (o) => this.setState({ login: Object.assign({}, L, o) });
    const enviar = async (e) => {
      e.preventDefault(); set({ ocupado: true, msg: '' });
      let r;
      if (L.modo === 'entrar') r = await sb.auth.signInWithPassword({ email: L.email.trim(), password: L.senha });
      else if (L.modo === 'criar') r = await sb.auth.signUp({ email: L.email.trim(), password: L.senha, options: { emailRedirectTo: location.origin + location.pathname } });
      else r = await sb.auth.resetPasswordForEmail(L.email.trim(), { redirectTo: location.origin + location.pathname });
      const erro = r && r.error;
      const ok = L.modo === 'criar' ? 'Pronto. Confirme pelo link que chegou no seu e-mail e depois entre. O administrador libera o seu acesso.' : L.modo === 'senha' ? 'Se o e-mail existir, chega um link para criar uma senha nova.' : '';
      this.setState({ login: Object.assign({}, this.state.login, { ocupado: false, msg: erro ? traduzErro(erro.message) : ok }) });
    };
    return html`<div class="login">
      <form class="login-caixa" onSubmit=${enviar}>
        <div class="marca"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M27 8.5A12 12 0 1 0 27 25.5" fill="none" stroke="#d7aa42" stroke-width="3.2" stroke-linecap="round"></path><path d="M14 13h9M14 17h7M14 21h9" stroke="#d7aa42" stroke-width="2.4" stroke-linecap="round"></path></svg>
          <div><div class="marca-nome">Torre de Controle - ${EMPRESA}</div><div class="marca-sub">by Capacity Case</div></div></div>
        <h1>${L.modo === 'entrar' ? 'Entrar' : L.modo === 'criar' ? 'Criar acesso' : 'Esqueci a senha'}</h1>
        <label for="lg-email">E-mail</label>
        <input id="lg-email" type="email" autocomplete="email" required value=${L.email} onInput=${(e) => set({ email: e.target.value })} />
        ${L.modo !== 'senha' ? html`<label for="lg-senha">Senha</label>
        <input id="lg-senha" type="password" autocomplete=${L.modo === 'criar' ? 'new-password' : 'current-password'} minlength="8" required value=${L.senha} onInput=${(e) => set({ senha: e.target.value })} />` : null}
        <button class="btn" type="submit" disabled=${L.ocupado}>${L.ocupado ? 'Aguarde…' : L.modo === 'entrar' ? 'Entrar' : L.modo === 'criar' ? 'Criar acesso' : 'Mandar o link'}</button>
        ${L.msg ? html`<p class="msg" role="status">${L.msg}</p>` : null}
        <div class="links">
          ${L.modo !== 'entrar' ? html`<button type="button" class="link" onClick=${() => set({ modo: 'entrar', msg: '' })}>Já tenho acesso</button>` : null}
          ${L.modo !== 'criar' ? html`<button type="button" class="link" onClick=${() => set({ modo: 'criar', msg: '' })}>Criar acesso</button>` : null}
          ${L.modo !== 'senha' ? html`<button type="button" class="link" onClick=${() => set({ modo: 'senha', msg: '' })}>Esqueci a senha</button>` : null}
        </div>
      </form></div>`;
  }
  telaNovaSenha() {
    const L = this.state.login;
    const salvar = async (e) => {
      e.preventDefault();
      if ((L.senha || '').length < 8) { this.setState({ login: Object.assign({}, L, { msg: 'A senha precisa ter pelo menos 8 caracteres.' }) }); return; }
      const { error } = await sb.auth.updateUser({ password: L.senha });
      if (error) { this.setState({ login: Object.assign({}, L, { msg: traduzErro(error.message) }) }); return; }
      this.setState({ recuperando: false, login: Object.assign({}, L, { senha: '', msg: '' }) });
      this.aviso('Senha nova salva.');
    };
    return html`<div class="login"><form class="login-caixa" onSubmit=${salvar}>
      ${marca()}
      <h1>Criar senha nova</h1>
      <label for="lg-nova">Senha nova (pelo menos 8 caracteres)</label>
      <input id="lg-nova" type="password" autocomplete="new-password" minlength="8" required value=${L.senha} onInput=${(e) => this.setState({ login: Object.assign({}, L, { senha: e.target.value }) })} />
      <button class="btn" type="submit">Salvar senha</button>
      ${L.msg ? html`<p class="msg" role="status">${L.msg}</p>` : null}
    </form></div>`;
  }
  telaAguardando() {
    return html`<div class="login"><div class="login-caixa">${marca()}<h1>Quase lá</h1>
      <p>Seu acesso foi criado e está esperando o administrador liberar. Assim que ele liberar, é só voltar aqui.</p>
      <button class="btn" type="button" onClick=${() => this.aoEntrar(this.state.sessao, true)}>Já liberaram, entrar</button>
      <button class="link" type="button" onClick=${() => this.sair()}>Sair</button></div></div>`;
  }
}

function marca() {
  return html`<div class="marca"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M27 8.5A12 12 0 1 0 27 25.5" fill="none" stroke="#d7aa42" stroke-width="3.2" stroke-linecap="round"></path><path d="M14 13h9M14 17h7M14 21h9" stroke="#d7aa42" stroke-width="2.4" stroke-linecap="round"></path></svg>
    <div><div class="marca-nome">Torre de Controle - ${EMPRESA}</div><div class="marca-sub">by Capacity Case</div></div></div>`;
}

function traduzErro(m) {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha não conferem.';
  if (/Email not confirmed/i.test(m)) return 'Falta confirmar o e-mail: abra o link que chegou na sua caixa de entrada.';
  if (/already registered/i.test(m)) return 'Esse e-mail já tem acesso. Use Entrar ou Esqueci a senha.';
  if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (/rate limit/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  return m;
}

render(html`<${App} />`, document.getElementById('app'));
