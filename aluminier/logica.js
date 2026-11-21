// Contas e regras da Torre de Controle - Aluminier (vieram do protótipo validado pelo Conselho em 18/11/2026).
import { Component } from './vendor/preact-htm.js';
const DCLogic = Component;

export class Logica extends DCLogic {
  constructor(props) {
    super(props);
    let id = 1;
    // Este arquivo vai para um site público: nenhum dado de cliente aqui. Os dados vêm do banco (app.js).
    this.nextId = 1000;
    this.state = {
      tab: 'painel',
      msg: '',
      sucata: [], tarugo: [], retornos: [], dias: [], cot: [],
      usinaSel: '',
      fundicoes: [],
      par: { necessidade: '', carteiraKg: '', carteiraPreco: '', moPadrao: '2,90', lme: '', dolar: '' },
      ini: {},
      f: {}, fs: {}, periodo: '12',
      erro: '',
      sugs: [],
      sugTipo: 'Melhoria', sugTexto: '',
      balao: false, balaoTexto: ''
    };
    this.state.meses = {}; this.state.listaMeses = []; this.state.mes = '';
  }

  parDoMes(mes, meses) {
    const m = (meses || this.state.meses || {})[mes] || {};
    const br = v => v === null || v === undefined ? '' : String(v).replace('.', ',');
    return { necessidade: br(m.necessidade), carteiraKg: br(m.carteiraKg), carteiraPreco: br(m.carteiraPreco), lme: br(m.lme), dolar: br(m.dolar) };
  }
  // Saldo de sucata em cada fundição na virada: o da última aba mensal até o mês escolhido que tem esse bloco preenchido.
  virada(mes) {
    const ms = Object.keys(this.state.meses || {}).sort().filter(m => m <= mes).reverse();
    for (const m of ms) { const sd = this.state.meses[m].saldos || {}; const ks = Object.keys(sd).filter(k => sd[k] > 0); if (ks.length) return { mes: m, lista: ks.map(k => ({ usina: k, kg: sd[k] })).sort((a, b) => b.kg - a.kg) }; }
    return null;
  }
  noMes(r) { return (r.data || '').slice(0, 7) === this.state.mes; }
  dt(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1].slice(2) : (iso || ''); }
  iso(txt) {
    const ref = this.state.mes || new Date().toISOString().slice(0, 7);
    const m = /^(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?$/.exec((txt || '').trim());
    if (!m) { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    let ano = m[3] ? (m[3].length === 2 ? '20' + m[3] : m[3]) : ref.slice(0, 4);
    return ano + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  }
  rotMes(ym) { const n = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']; return n[+ym.slice(5, 7) - 1] + '/' + ym.slice(0, 4); }
  mesLongo(ym) { const n = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']; return n[+ym.slice(5, 7) - 1] + ' de ' + ym.slice(0, 4); }

  num(v) {
    if (v === null || v === undefined || v === '') return NaN;
    if (typeof v === 'number') return v;
    let s = String(v).trim().replace(/\s/g, '').replace('R$', '').replace('%', '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // "15.710" = quinze mil setecentos e dez
    return parseFloat(s);
  }
  pct(v) { const n = this.num(v); if (isNaN(n)) return NaN; return n > 1 ? n / 100 : n; }
  n0(v) { return isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '—'; }
  n2(v) { return isFinite(v) ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'; }
  rs(v) { return isFinite(v) ? 'R$ ' + this.n2(v) : '—'; }
  pc(v) { return isFinite(v) ? (v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : '—'; }
  hoje() { const d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }

  calcSucata(r) {
    const liq = r.peso * (1 - r.perda); const valor = r.peso * r.preco; const mo = liq * r.mo; const total = valor + mo;
    return { liq, valor, moRs: mo, total, kg: liq > 0 ? total / liq : NaN };
  }
  custoCot(c) { return c.tipo === 'tarugo pronto' ? c.preco : c.preco / (1 - c.perda) + c.frete + c.mo; }

  usinas() {
    const set = {}; Object.keys(this.state.ini).forEach(u => set[u] = 1);
    this.state.sucata.forEach(r => r.usina && (set[r.usina] = 1));
    this.state.retornos.forEach(r => r.usina && (set[r.usina] = 1));
    return Object.keys(set);
  }

  // Conta de metal de uma fundição: cada nota de remessa gera crédito (sucata − perda);
  // cada retorno de tarugo abate da nota vinculada ou, sem vínculo, da remessa mais antiga.
  conta(u) {
    const s = this.state;
    const ini = this.num(s.ini[u]) || 0;
    const grupos = [], porNf = {};
    if (ini > 0) grupos.push({ chave: '__ini', data: '', nf: 'Saldo da virada do mês', forns: [], sucata: 0, cred: ini, voltou: 0 });
    s.sucata.filter(r => r.usina === u).forEach(r => {
      const chave = r.nf ? 'nf:' + r.nf : 'sem:' + r.id;
      let g = porNf[chave];
      if (!g) { g = { chave, data: r.data, nf: r.nf || 'sem nota', forns: [], sucata: 0, cred: 0, voltou: 0 }; porNf[chave] = g; grupos.push(g); }
      if (g.forns.indexOf(r.forn) < 0) g.forns.push(r.forn);
      g.sucata += r.peso; g.cred += r.peso * (1 - r.perda);
    });
    let livre = ini < 0 ? -ini : 0;
    const rets = s.retornos.filter(r => r.usina === u);
    rets.forEach(r => {
      const g = r.nfRem && porNf['nf:' + r.nfRem];
      if (g) { const usa = Math.min(r.kg, Math.max(0, g.cred - g.voltou)); g.voltou += usa; livre += r.kg - usa; }
      else livre += r.kg;
    });
    grupos.forEach(g => { if (livre <= 0) return; const usa = Math.min(livre, Math.max(0, g.cred - g.voltou)); g.voltou += usa; livre -= usa; });
    const credTot = grupos.reduce((a, g) => a + (g.chave === '__ini' ? 0 : g.cred), 0);
    const retTot = rets.reduce((a, r) => a + r.kg, 0);
    return { usina: u, grupos, rets, saldo: ini + credTot - retTot };
  }

  totais() {
    const s = this.state;
    let sKg = 0, sTot = 0, aberto = 0, abertoN = 0, semPreco = 0, semUsina = 0;
    s.sucata.forEach(r => { if (!r.pago && r.preco > 0) { const c0 = this.calcSucata(r); aberto += c0.total; abertoN++; } if (!this.noMes(r)) return; if (r.semPreco || !(r.preco > 0)) { semPreco++; return; } if (!r.usina) semUsina++; const c = this.calcSucata(r); sKg += c.liq; sTot += c.total; });
    let tKg = 0, tVal = 0, tKgAll = 0, tSemPreco = 0; s.tarugo.filter(r => this.noMes(r)).forEach(r => { tKgAll += r.kg; if (r.preco > 0) { tKg += r.kg; tVal += r.kg * r.preco; } else tSemPreco++; });
    // tarugo que voltou da fundição lançado no sistema (depois da carga da planilha) também "chegou"
    s.retornos.filter(r => this.noMes(r) && this.depoisDaCarga(r)).forEach(r => { tKgAll += r.kg; tSemPreco++; });
    const contas = this.usinas().map(u => this.conta(u));
    const saldo = contas.reduce((a, c) => a + c.saldo, 0);
    const saldos = contas;
    let fKg = 0, fRs = 0, prod = 0; s.dias.filter(d => this.noMes(d)).forEach(d => { fKg += d.kgfat; fRs += d.fat; prod += d.produz; });
    const custoMedio = (sKg + tKg) > 0 ? (sTot + tVal) / (sKg + tKg) : NaN;
    return { semPreco, semUsina, tKgAll, tSemPreco, sKg, sTot, aberto, abertoN, tKg, tVal, saldo, saldos, fKg, fRs, prod, custoMedio, sucKg: sKg ? sTot / sKg : NaN, tarKg: tKg ? tVal / tKg : NaN, pm: fKg ? fRs / fKg : NaN };
  }

  // Cada tela de lançamento guarda o próprio rascunho: trocar de aba ou de mês não apaga o que foi digitado.
  setF(key) { return e => { const v = e.target.value; this.setState(st => { const fs = Object.assign({}, st.fs); fs[st.tab] = Object.assign({}, fs[st.tab], { [key]: v }); return { fs, erro: '' }; }); }; }
  limpaF(tab, manter) { this.setState(st => { const fs = Object.assign({}, st.fs); fs[tab] = manter || {}; return { fs }; }); }
  aviso(t, desfazer) { this.setState({ msg: t, msgUndo: !!desfazer }); clearTimeout(this._t); this._t = setTimeout(() => this.setState({ msg: '', msgUndo: false }), desfazer ? 9000 : 3500); }

  // Excluir: pede confirmação na linha (confDel) e deixa desfazer por alguns segundos.
  remover(lista, id) {
    const arr = this.state[lista], idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return;
    this.ultimoExcluido = { lista, item: arr[idx], idx };
    this.setState(st => ({ [lista]: st[lista].filter(x => x.id !== id), confDel: null, edit: st.edit && st.edit.id === id ? null : st.edit }));
    this.aviso('Lançamento excluído.', true);
  }
  desfazer() {
    const u = this.ultimoExcluido; if (!u) return;
    this.setState(st => { const a = st[u.lista].slice(); a.splice(Math.min(u.idx, a.length), 0, u.item); return { [u.lista]: a }; });
    this.ultimoExcluido = null; this.aviso('Exclusão desfeita.');
  }

  // Editar: leva o lançamento para o formulário da tela certa; salvar troca o registro no lugar.
  br(v) { return typeof v === 'number' && isFinite(v) ? String(Math.round(v * 10000) / 10000).replace('.', ',') : (v === null || v === undefined || (typeof v === 'number') ? '' : String(v)); }
  dataLonga(iso) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || ''); }
  editar(lista, r) {
    const b = v => this.br(v), pc = v => b(Math.round((v || 0) * 10000) / 100);
    const mapa = {
      sucata: ['sucata', { data: this.dataLonga(r.data), forn: r.forn, peso: b(r.peso), perda: pc(r.perda), preco: b(r.preco), usina: r.usina, nf: r.nf, mo: b(r.mo), pagto: r.pagto }],
      tarugo: ['tarugo', { data: this.dataLonga(r.data), forn: r.forn, kg: b(r.kg), preco: b(r.preco) }],
      dias: ['dia', { data: this.dataLonga(r.data), produz: b(r.produz), kgfat: b(r.kgfat), fat: b(r.fat) }],
      cot: ['precos', { forn: r.forn, tipo: r.tipo, data: this.dataLonga(r.data), preco: b(r.preco), perda: pc(r.perda), frete: b(r.frete), mo: b(r.mo) }],
      retornos: ['usina', { data: this.dataLonga(r.data), nfRet: r.nfRet, nfRem: r.nfRem, kg: b(r.kg) }]
    }[lista];
    const extra = lista === 'retornos' ? { usinaSel: r.usina } : {};
    const qtd = r.peso || r.kg || r.kgfat;
    this.setState(st => Object.assign({ tab: mapa[0], fs: Object.assign({}, st.fs, { [mapa[0]]: mapa[1] }), edit: { lista, id: r.id, texto: [r.data ? this.dt(r.data) : '', r.forn || (r.nfRet ? 'NF ' + r.nfRet : ''), qtd ? this.n0(qtd) + ' kg' : ''].filter(Boolean).join(' · ') }, erro: '', confDel: null }, extra));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  grava(lista, r) {
    const ed = this.state.edit;
    if (ed && ed.lista === lista) {
      const velho = this.state[lista].find(x => x.id === ed.id) || {};
      const novo = Object.assign({}, velho, r, { id: ed.id });
      if ('pago' in velho) novo.pago = velho.pago;
      this.setState(st => ({ [lista]: st[lista].map(x => x.id === ed.id ? novo : x), edit: null }));
      this.limpaF(this.state.tab);
      this.aviso('Alteração salva. As contas e o painel já foram refeitos.');
    } else {
      let lst = this.state[lista];
      if (lista === 'cot') lst = lst.filter(x => !(x.forn === r.forn && x.tipo === r.tipo && Math.abs((x.perda || 0) - (r.perda || 0)) < 1e-6));
      this.setState({ [lista]: lst.concat([r]) });
      // Lançou com data de outro mês: vai para aquele mês, para o lançamento não "sumir" da lista.
      const ym = (r.data || '').slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym) && ym !== this.state.mes && lista !== 'cot') this.setState(st => ({ mes: ym, listaMeses: st.listaMeses.indexOf(ym) >= 0 ? st.listaMeses : st.listaMeses.concat([ym]).sort().reverse(), par: Object.assign({}, st.par, this.parDoMes(ym)) }));
      // Sucata: a próxima pesagem costuma ser do mesmo fornecedor, preço e fundição; limpa só o peso.
      const f = (this.state.fs || {})[this.state.tab] || {};
      this.limpaF(this.state.tab, lista === 'sucata' ? Object.assign({}, f, { peso: '' }) : null);
      this.aviso(lista === 'sucata' ? 'Pesagem salva. Fornecedor, preço e fundição ficaram no formulário para a próxima.' : 'Lançamento salvo. As contas e o painel já foram atualizados.');
    }
    return '';
  }
  acoesLinha(lista, item) {
    const chave = lista + ':' + item.id, conf = this.state.confDel === chave;
    return {
      editar: () => this.editar(lista, item),
      confirmando: conf, naoConfirmando: !conf,
      pedirExcluir: () => this.setState({ confDel: chave }),
      naoExcluir: () => this.setState({ confDel: null }),
      excluir: () => this.remover(lista, item.id)
    };
  }

  telas() {
    const s = this.state, f = (s.fs && s.fs[s.tab]) || {}, T = this.totais();
    const campo = (key, label, opt) => { const c = Object.assign({ id: 'c-' + key, key, label, type: 'text', mode: 'decimal', list: '', ph: '' }, opt || {}, { value: f[key] || '', onChange: this.setF(key) }); c.isSel = !!c.opcoes; c.isInput = !c.opcoes; if (c.opcoes && !f[key] && c.padrao !== undefined) c.value = c.padrao; return c; };
    // As fundições vêm do banco (parametros.fundicoes): o código público não carrega nome de parceiro do cliente.
    const FUNDICOES = [{ v: '', l: 'Ainda não sei' }].concat((s.fundicoes || []).map(x => ({ v: x.v, l: x.l })));
    const def = {
      sucata: {
        eyebrow: 'LANÇAR', titulo: 'Comprei sucata', tituloLista: 'Sucata comprada neste mês',
        ajuda: 'Anote cada pesagem. Na perda, escreva só o número (5 para 5%). O quadro amarelo mostra na hora quanto vai custar o quilo de tarugo.',
        campos: [campo('data', 'Data', { mode: 'text', ph: this.hoje() }), campo('forn', 'Fornecedor', { mode: 'text', list: 'lista-forn' }), campo('peso', 'Peso (kg)'), campo('perda', 'Perda (%)', { ph: '5' }), campo('preco', 'Preço (R$/kg)'), campo('usina', 'Fundição que refunde', { opcoes: FUNDICOES }), campo('nf', 'NF de remessa', { mode: 'text', ph: 'opcional' }), campo('mo', 'Mão de obra (R$/kg)', { ph: s.par.moPadrao }), campo('pagto', 'Pagar em', { mode: 'text', ph: 'dd/mm' })],
        calc: () => { const r = { peso: this.num(f.peso), perda: this.pct(f.perda || 5), preco: this.num(f.preco), mo: this.num(f.mo || s.par.moPadrao) }; const c = this.calcSucata(r); return [{ label: 'Líquido', valor: this.n0(c.liq) + ' kg' }, { label: 'Valor da sucata', valor: this.rs(c.valor) }, { label: 'Mão de obra', valor: this.rs(c.moRs) }, { label: 'Total', valor: this.rs(c.total) }, { label: 'Custo final', valor: this.rs(c.kg) + '/kg' }]; },
        salvar: () => { const r = { id: this.nextId++, data: this.iso(f.data), forn: (f.forn || '').toUpperCase().trim(), peso: this.num(f.peso), perda: this.pct(f.perda || 5), preco: this.num(f.preco), usina: (f.usina || '').toUpperCase().trim(), nf: (f.nf || '').trim(), mo: this.num(f.mo || s.par.moPadrao), pagto: f.pagto || '', pago: false }; if (!r.forn || !(r.peso > 0) || !(r.preco > 0)) return 'Preencha fornecedor, peso e preço.'; r.semPreco = false; return this.grava('sucata', r); },
        colunas: ['Data', 'Fornecedor', 'Peso', 'Perda', 'Preço', 'Fundição', 'Nota', 'Sem a perda', 'Total', 'Quilo saiu a', 'Pagar em', 'Pagamento'],
        dir: [0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0],
        linhas: s.sucata.filter(r => this.noMes(r)).map(r => { const c = this.calcSucata(r); const sp = r.semPreco || !(r.preco > 0); return { id: r.id, lista: 'sucata', pago: sp ? undefined : r.pago, cel: [this.dt(r.data), r.forn, this.n0(r.peso), this.pc(r.perda), sp ? 'sem preço' : this.n2(r.preco), r.usina, r.nf, this.n0(c.liq), sp ? '—' : this.rs(c.total), sp ? '—' : this.n2(c.kg), r.pagto, sp ? 'Falta preço' : r.pago ? 'Pago' : this.venceu(r) ? 'Vencida' : 'A pagar'] }; }),
        resumo: this.n0(T.sKg) + ' kg líquidos · ' + this.rs(T.sTot) + ' · custo médio ' + this.rs(T.sucKg) + '/kg'
      },
      tarugo: {
        eyebrow: 'LANÇAR', titulo: 'Comprei tarugo pronto', tituloLista: 'Tarugo que chegou neste mês',
        ajuda: 'Anote cada carga que chegou. As linhas "sem preço" que vieram da planilha antiga quase sempre são tarugo que voltou da fundição.',
        campos: [campo('data', 'Data', { mode: 'text', ph: this.hoje() }), campo('forn', 'Fornecedor', { mode: 'text', list: 'lista-forn' }), campo('kg', 'Quantidade (kg)'), campo('preco', 'Preço (R$/kg)')],
        calc: () => [{ label: 'Valor', valor: this.rs(this.num(f.kg) * this.num(f.preco)) }],
        salvar: () => { const r = { id: this.nextId++, data: this.iso(f.data), forn: (f.forn || '').toUpperCase().trim(), kg: this.num(f.kg), preco: this.num(f.preco) }; if (!r.forn || !(r.kg > 0) || !(r.preco > 0)) return 'Preencha fornecedor, quantidade e preço.'; return this.grava('tarugo', r); },
        colunas: ['Data', 'Fornecedor', 'Quantidade', 'R$/kg', 'Valor'], dir: [0, 0, 1, 1, 1],
        linhas: s.tarugo.filter(r => this.noMes(r)).map(r => ({ id: r.id, lista: 'tarugo', cel: [this.dt(r.data), r.forn, this.n0(r.kg) + ' kg', r.preco > 0 ? this.n2(r.preco) : r.so_mo ? 'Só refusão (' + this.n2(r.so_mo) + ')' : 'Falta preço', r.preco > 0 ? this.rs(r.kg * r.preco) : '—'] })),
        resumo: this.n0(T.tKgAll) + ' kg no mês · ' + this.rs(T.tVal) + ' · preço médio ' + this.rs(T.tarKg) + '/kg' + (T.tSemPreco ? ' · ' + T.tSemPreco + ' sem preço' : '')
      },
      usina: (() => {
        const u = s.usinaSel, ct = this.conta(u);
        return {
          eyebrow: 'LANÇAR · ' + this.nomeUsina(u).toUpperCase(), titulo: 'Voltou tarugo da fundição', tituloLista: 'Sucata que você mandou, nota por nota',
          ajuda: 'A sucata que você mandou aparece aqui sozinha. Você só anota o tarugo que voltou. Se souber de qual nota ele é, escolha a nota; se não souber, o sistema desconta da nota mais antiga.',
          campos: [campo('data', 'Data', { mode: 'text', ph: this.hoje() }), campo('nfRet', 'NF da fundição', { mode: 'text' }), campo('nfRem', 'Abater da remessa (NF)', { mode: 'text', list: 'lista-nf', ph: 'mais antiga' }), campo('kg', 'Tarugo que voltou (kg)')],
          calc: () => { const kg = this.num(f.kg) || 0; return [{ label: 'Saldo de metal agora', valor: this.n0(ct.saldo) + ' kg' }, { label: 'Saldo depois', valor: this.n0(ct.saldo - kg) + ' kg' }]; },
          salvar: () => { const r = { id: this.nextId++, data: this.iso(f.data), usina: u, nfRet: (f.nfRet || '').trim(), nfRem: (f.nfRem || '').trim(), kg: this.num(f.kg) }; if (!(r.kg > 0)) return 'Preencha quantos kg de tarugo voltaram.'; return this.grava('retornos', r); },
          colunas: ['Data', 'Nota', 'Fornecedor', 'Sucata mandada', 'Vira tarugo (sem a perda)', 'Já voltou', 'Falta voltar', 'Situação'], dir: [0, 0, 0, 1, 1, 1, 1, 0],
          linhas: ct.grupos.map(g => { const falta = g.cred - g.voltou; const sit = g.voltou <= 0 ? 'Aguardando' : falta <= 0.5 ? 'Voltou tudo' : 'Parcial'; return { id: g.chave, lista: 'nf', semExcluir: true, cel: [this.dt(g.data), g.nf, g.forns.join(', '), g.sucata ? this.n0(g.sucata) : '', this.n0(g.cred), this.n0(g.voltou), this.n0(Math.max(0, falta)), sit] }; }),
          resumo: (() => {
            // As duas contas são diferentes e a tela diz isso: a daqui (nota por nota, desde o que foi lançado) e a foto da planilha no começo do mês.
            const vr = this.virada(s.mes), foto = vr && vr.lista.find(x => x.usina === u);
            const ult = ct.grupos.concat(ct.rets).map(x => x.data || '').sort().pop();
            return 'Pelas notas lançadas aqui' + (ult ? ' (até ' + this.dt(ult) + ')' : '') + ': ' + this.n0(ct.saldo) + ' kg' + (foto ? ' · A planilha mostrava ' + this.n0(foto.kg) + ' kg no começo de ' + this.mesLongo(vr.mes) + '. A diferença é o que ainda não foi lançado nota por nota.' : '');
          })(),
          chips: this.usinas().map(x => ({ label: this.nomeUsina(x) + ' · ' + this.n0(this.conta(x).saldo) + ' kg', go: () => this.setState({ usinaSel: x, erro: '' }), style: 'height:44px;padding:0 14px;border-radius:999px;font-weight:600;font-size:14px;cursor:pointer;' + (x === u ? 'background:#f6ebd2;color:#111827;border:1px solid #9c7518' : 'background:#ffffff;color:#2a3540;border:1px solid #c9cfd8') })),
          ret: ct.rets.slice().reverse().map(r => ({ data: this.dt(r.data), nf: r.nfRet || '—', vinc: r.nfRem || 'remessa mais antiga', kg: this.n0(r.kg), editar: () => this.editar('retornos', r), rotulo: 'Abrir o retorno de ' + this.dt(r.data) + ', ' + this.n0(r.kg) + ' kg' })),
          nfs: ct.grupos.filter(g => g.chave.indexOf('nf:') === 0).map(g => g.nf)
        };
      })(),
      dia: {
        eyebrow: 'LANÇAR', titulo: 'Fim do dia', tituloLista: 'Dias anotados neste mês',
        ajuda: 'Quanto a fábrica produziu e quanto você vendeu hoje (em quilos e em reais).',
        campos: [campo('data', 'Dia', { mode: 'text', ph: this.hoje() }), campo('produz', 'Produzido (kg)'), campo('kgfat', 'Faturado (kg)'), campo('fat', 'Faturado (R$)')],
        calc: () => { const pm = this.num(f.fat) / this.num(f.kgfat); return [{ label: 'Preço médio', valor: this.rs(pm) + '/kg' }, { label: 'Margem sobre o custo médio do metal', valor: this.rs(pm - T.custoMedio) + '/kg' }]; },
        // Dia em que só produziu (embalou e não faturou) também vale; venda precisa de kg e R$ juntos.
        salvar: () => { const r = { id: this.nextId++, data: this.iso(f.data), produz: this.num(f.produz) || 0, kgfat: this.num(f.kgfat) || 0, fat: this.num(f.fat) || 0 }; if (!(r.produz > 0) && !(r.kgfat > 0) && !(r.fat > 0)) return 'Preencha o que produziu ou o que vendeu hoje.'; if ((r.kgfat > 0) !== (r.fat > 0)) return 'Na venda, preencha os quilos e o valor em reais.'; return this.grava('dias', r); },
        colunas: ['Dia', 'Produziu (kg)', 'Vendeu (kg)', 'Vendeu (R$)', 'Preço do quilo'], dir: [0, 1, 1, 1, 1],
        linhas: s.dias.filter(d => this.noMes(d)).map(d => ({ id: d.id, lista: 'dias', cel: [this.dt(d.data), this.n0(d.produz), d.kgfat ? this.n0(d.kgfat) : '—', d.fat ? this.rs(d.fat) : '—', d.kgfat ? this.rs(d.fat / d.kgfat) : '—'] })),
        resumo: this.n0(T.prod) + ' kg produzidos · ' + this.n0(T.fKg) + ' kg faturados · preço médio ' + this.rs(T.pm) + '/kg'
      },
      precos: {
        eyebrow: 'PREÇOS', titulo: 'Preço que cada fornecedor está cobrando', tituloLista: 'Preços anotados (usados no "De quem comprar" do Painel)',
        ajuda: 'Anote o preço novo quando um fornecedor mudar. O preço novo substitui o antigo do mesmo fornecedor.',
        campos: [campo('forn', 'Fornecedor', { mode: 'text', list: 'lista-forn' }), campo('tipo', 'Tipo', { opcoes: [{ v: 'sucata', l: 'Sucata (vai refundir)' }, { v: 'tarugo pronto', l: 'Tarugo pronto' }], padrao: 'sucata' }), campo('data', 'Data da cotação', { mode: 'text', ph: this.hoje() }), campo('preco', 'Preço (R$/kg)'), campo('perda', 'Perda (%)', { ph: '5' }), campo('frete', 'Frete (R$/kg)', { ph: '0' }), campo('mo', 'Mão de obra (R$/kg)', { ph: s.par.moPadrao })],
        calc: () => { const tipo = /tar/i.test(f.tipo || '') ? 'tarugo pronto' : 'sucata'; const c = { tipo, preco: this.num(f.preco), perda: this.pct(f.perda || 5), frete: this.num(f.frete) || 0, mo: this.num(f.mo || s.par.moPadrao) }; return [{ label: 'Custo do tarugo', valor: this.rs(this.custoCot(c)) + '/kg' }]; },
        salvar: () => { const tipo = /tar/i.test(f.tipo || '') ? 'tarugo pronto' : 'sucata'; const r = { id: this.nextId++, data: this.iso(f.data), forn: (f.forn || '').toUpperCase().trim(), tipo, preco: this.num(f.preco), perda: tipo === 'sucata' ? this.pct(f.perda || 5) : 0, frete: this.num(f.frete) || 0, mo: tipo === 'sucata' ? this.num(f.mo || s.par.moPadrao) : 0 }; if (!r.forn || !(r.preco > 0)) return 'Preencha fornecedor e preço.'; return this.grava('cot', r); },
        colunas: ['Data', 'Fornecedor', 'Tipo', 'Preço', 'Perda', 'Frete', 'Mão de obra', 'Quilo de tarugo sai a'], dir: [0, 0, 0, 1, 1, 1, 1, 1],
        linhas: s.cot.map(c => ({ id: c.id, lista: 'cot', cel: [c.data ? this.dt(c.data) : 'sem data', c.forn, c.tipo, c.preco ? this.n2(c.preco) : 'sem preço', c.tipo === 'sucata' ? this.pc(c.perda) : '', c.frete ? this.n2(c.frete) : '', c.mo ? this.n2(c.mo) : '', c.preco ? this.rs(this.custoCot(c)) : '—'] })),
        resumo: s.cot.length + ' cotações'
      }
    };
    const t = def[s.tab];
    if (!t) return null;
    const calc = t.calc();
    // Edição em andamento nesta tela?
    const listaDaTela = { sucata: 'sucata', tarugo: 'tarugo', usina: 'retornos', dia: 'dias', precos: 'cot' }[s.tab];
    const ed = s.edit && s.edit.lista === listaDaTela ? s.edit : null;
    const item = ed ? (s[ed.lista] || []).find(x => x.id === ed.id) : null;
    const chave = ed ? ed.lista + ':' + ed.id : '';
    let impacto = 'Excluir este lançamento?';
    if (item && ed.lista === 'sucata' && item.usina) impacto = 'Excluir? O saldo na ' + this.nomeUsina(item.usina) + ' cai ' + this.n0(item.peso * (1 - item.perda)) + ' kg.';
    if (item && ed.lista === 'retornos') impacto = 'Excluir? O saldo na ' + this.nomeUsina(item.usina) + ' volta a subir ' + this.n0(item.kg) + ' kg.';
    if (item && ed.lista === 'sucata' && item.pago) impacto = 'Esta compra já está paga. ' + impacto;
    const subsTabs = [['sucata', 'Sucata'], ['tarugo', 'Tarugo comprado'], ['usina', 'Fundição'], ['dia', 'Produção e faturamento']];
    const ehLancar = subsTabs.some(x => x[0] === s.tab);
    return {
      eyebrow: t.eyebrow, titulo: t.titulo, ajuda: t.ajuda, tituloLista: t.tituloLista, resumo: t.resumo, erro: s.erro,
      campos: t.campos, temCalc: calc.length > 0, calc,
      temSubs: ehLancar,
      subs: subsTabs.map(x => ({ label: x[1], go: () => this.setState({ tab: x[0], ultLanc: x[0], erro: '' }), style: 'height:44px;padding:0 16px;border-radius:999px;font-weight:600;font-size:14px;cursor:pointer;' + (s.tab === x[0] ? 'background:#0d1117;color:#ffffff;border:1px solid #0d1117' : 'background:#ffffff;color:#2a3540;border:1px solid #c9cfd8') })),
      temChips: !!t.chips, chips: t.chips || [], temRet: !!t.ret, ret: t.ret || [], nfs: t.nfs || [],
      editando: !!ed, editTexto: ed ? ed.texto : '',
      botao: ed ? 'Salvar alteração' : 'Salvar lançamento', botaoLimpar: ed ? 'Cancelar' : 'Limpar',
      ed: {
        temPago: !!(item && ed.lista === 'sucata' && item.preco > 0),
        pagoLabel: item && item.pago ? 'Desfazer pago' : 'Marcar como pago',
        pago: () => { const novo = !(item && item.pago); this.setState(st => ({ sucata: st.sucata.map(x => x.id === ed.id ? Object.assign({}, x, { pago: novo }) : x) })); this.aviso(novo ? 'Marcado como pago.' : 'Voltou para em aberto.'); },
        confirmando: s.confDel === chave, naoConfirmando: s.confDel !== chave,
        impacto,
        pedirExcluir: () => this.setState({ confDel: chave }),
        naoExcluir: () => this.setState({ confDel: null }),
        excluir: () => { this.remover(ed.lista, ed.id); this.limpaF(s.tab); }
      },
      colunas: t.colunas.map((c, i) => ({ label: c, style: t.dir[i] ? 'text-align:right' : '' })),
      linhas: t.linhas.slice().reverse().map(l => {
        const orig = l.lista !== 'nf' ? (s[l.lista] || []).find(x => x.id === l.id) : null;
        return {
          style: (s.edit && s.edit.id === l.id ? 'background:#f6ebd2' : l.pago === false ? 'background:#faecd2' : ''),
          temEditar: !!orig,
          editar: () => orig && this.editar(l.lista, orig),
          rotulo: 'Abrir o lançamento ' + l.cel.slice(0, 2).join(' '),
          cel: l.cel.map((v, i) => ({ v: v, style: (t.dir[i] ? 'text-align:right;' : '') + (v === 'A pagar' || v === 'Parcial' ? 'color:#8a5406;font-weight:600' : v === 'Pago' || v === 'Voltou tudo' ? 'color:#1f7a4a;font-weight:600' : v === 'Falta preço' || v === 'Vencida' ? 'color:#b3382c;font-weight:600' : v === 'Aguardando' || v === 'Voltou da fundição' ? 'color:#2f5d8a;font-weight:600' : '') }))
        };
      }),
      salvar: (e) => { e.preventDefault(); const err = t.salvar(); if (err) this.setState({ erro: err }); },
      limpar: () => { this.setState({ erro: '', edit: null, confDel: null }); this.limpaF(s.tab); }
    };
  }
  venceu(r) { const m = /^(\d{1,2})[./](\d{1,2})/.exec(r.pagto || ''); if (!m) return false; const iso = (r.data || '').slice(0, 4) + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'); return iso < new Date().toISOString().slice(0, 10); }
  depoisDaCarga(r) { const ate = this.state.historicoAte; return !!ate && (r.data || '') > ate; }
  precoSucataRef() { const ps = (this.state.cot || []).filter(c => c.tipo === 'sucata' && c.preco > 0).map(c => c.preco); return ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : NaN; }
  nomeUsina(u) { const f = (this.state.fundicoes || []).find(x => x.v === u); return f ? f.l : u; }

  // Soma por mês, com a mesma régua do Painel.
  agregaMeses() {
    const s = this.state, agg = {};
    const A = ym => agg[ym] || (agg[ym] = { kg: 0, kgP: 0, val: 0, sucLiq: 0, sucTot: 0, prod: 0, kgfat: 0, fat: 0, forn: {} });
    const ok = d => /^\d{4}-\d{2}/.test(d || '');
    s.tarugo.forEach(r => { if (!ok(r.data)) return; const a = A(r.data.slice(0, 7)); a.kg += r.kg; if (r.preco > 0) { a.kgP += r.kg; a.val += r.kg * r.preco; const f = a.forn[r.forn] || (a.forn[r.forn] = { kg: 0, val: 0 }); f.kg += r.kg; f.val += r.kg * r.preco; } });
    s.sucata.forEach(r => { if (!ok(r.data) || !(r.preco > 0)) return; const c = this.calcSucata(r); const a = A(r.data.slice(0, 7)); a.sucLiq += c.liq; a.sucTot += c.total; });
    s.retornos.forEach(r => { if (!ok(r.data) || !this.depoisDaCarga(r)) return; A(r.data.slice(0, 7)).kg += r.kg; });
    s.dias.forEach(d => { if (!ok(d.data)) return; const a = A(d.data.slice(0, 7)); a.prod += d.produz; a.kgfat += d.kgfat; a.fat += d.fat; if (d.kgfat > 0) a.diasVenda = (a.diasVenda || 0) + 1; });
    Object.keys(agg).forEach(ym => {
      const a = agg[ym];
      a.custo = (a.kgP + a.sucLiq) ? (a.val + a.sucTot) / (a.kgP + a.sucLiq) : NaN; a.venda = a.kgfat ? a.fat / a.kgfat : NaN;
      a.cobertura = a.kg ? a.kgP / a.kg : NaN;
      // A sobra só aparece quando a conta está completa: ≥ 90% do tarugo com preço e ≥ 15 dias de venda anotados.
      a.completo = a.cobertura >= 0.9 && (a.diasVenda || 0) >= 15;
      a.sobra = a.completo ? a.venda - a.custo : NaN;
    });
    return agg;
  }

  // Tela Análises: cinco perguntas do dono, cada uma com a resposta numa frase.
  analises(agg, abrirMes) {
    const s = this.state, per = s.periodo || '12';
    const todos = Object.keys(agg).sort();
    const fim = todos[todos.length - 1] || '';
    let meses = todos;
    if (per === '12') meses = todos.slice(-12);
    if (per === 'ano') meses = todos.filter(m => m.slice(0, 4) === fim.slice(0, 4));
    const sobraMin = this.num(s.par.sobraMin), taxa = this.num(s.par.taxa);
    const cards = [];
    const card = (pergunta, numero, frase, tipo, selo) => cards.push(Object.assign({ pergunta, numero, frase }, this.selo(tipo || 'in', selo || '')));

    // 1. Sobra e o porquê
    const comFat = meses.filter(m => isFinite(agg[m].sobra));
    if (comFat.length) {
      const u = comFat[comFat.length - 1], a = agg[u], ant = comFat.length > 1 ? agg[comFat[comFat.length - 2]] : null;
      let frase = 'Em ' + this.mesLongo(u) + ' você vendeu o quilo por ' + this.rs(a.venda) + ' e pagou ' + this.rs(a.custo) + '.';
      if (ant) { const dv = a.venda - ant.venda, dc = a.custo - ant.custo; frase += ' Comparando com ' + this.mesLongo(comFat[comFat.length - 2]) + ': você vendeu ' + this.rs(Math.abs(dv)) + (dv >= 0 ? ' mais caro' : ' mais barato') + ' e pagou ' + this.rs(Math.abs(dc)) + (dc >= 0 ? ' a mais' : ' a menos') + '. Por isso sobrou ' + this.rs(Math.abs(dv - dc)) + (dv - dc >= 0 ? ' a mais' : ' a menos') + ' em cada quilo.'; }
      card('Quanto sobrou em cada quilo?', this.rs(a.sobra), frase, isFinite(sobraMin) ? (a.sobra >= sobraMin ? 'ok' : 'at') : 'in', isFinite(sobraMin) ? (a.sobra >= sobraMin ? 'bom' : 'abaixo do seu mínimo') : this.rotMes(u));
    } else card('Quanto sobrou em cada quilo?', '—', 'Neste período nenhum mês tem a conta completa: ou falta o custo do tarugo que voltou da fundição, ou faltam dias de venda anotados. Assim que o custo do tarugo da fundição entrar, este número aparece.', 'at', 'conta incompleta');

    // 2. De quem comprar: quanto paguei acima do mais barato de cada mês
    let excesso = 0, kgTot = 0; const fornPer = {};
    meses.forEach(m => {
      const fs = agg[m].forn, kgM = Object.keys(fs).reduce((x, k) => x + fs[k].kg, 0);
      const elegiveis = Object.keys(fs).filter(k => fs[k].kg >= 0.05 * kgM);
      const pmin = Math.min.apply(null, elegiveis.map(k => fs[k].val / fs[k].kg));
      Object.keys(fs).forEach(k => { const p = fs[k].val / fs[k].kg; if (isFinite(pmin) && p > pmin) excesso += fs[k].kg * (p - pmin); const fp = fornPer[k] || (fornPer[k] = { kg: 0, val: 0, meses: 0 }); fp.kg += fs[k].kg; fp.val += fs[k].val; fp.meses++; kgTot += fs[k].kg; });
    });
    const mediaGeral = Object.keys(fornPer).reduce((x, k) => x + fornPer[k].val, 0) / (kgTot || 1);
    const fornecedores = Object.keys(fornPer).map(k => ({ k, kg: fornPer[k].kg, p: fornPer[k].val / fornPer[k].kg, meses: fornPer[k].meses })).sort((a, b) => b.kg - a.kg).slice(0, 10)
      .map(x => ({ nome: x.k, kg: this.n0(x.kg), part: this.pc(x.kg / (kgTot || 1)), preco: this.rs(x.p), dif: (x.p - mediaGeral >= 0 ? '+' : '−') + this.n2(Math.abs(x.p - mediaGeral)), meses: String(x.meses), difStyle: 'text-align:right;font-weight:600;color:' + (x.p > mediaGeral + 0.05 ? '#8a5406' : '#111827') }));
    // Diferença por quilo entre o mais caro e o mais barato (sem somar um total em R$, que misturaria produtos e prazos diferentes)
    const relevantes = Object.keys(fornPer).filter(k => fornPer[k].kg >= 0.05 * (kgTot || 1)).map(k => ({ k, p: fornPer[k].val / fornPer[k].kg })).sort((a, b) => a.p - b.p);
    if (relevantes.length > 1) {
      const bar = relevantes[0], car = relevantes[relevantes.length - 1];
      card('Quem cobrou mais caro pelo tarugo pronto?', this.rs(car.p - bar.p) + ' por quilo', 'No período, ' + car.k + ' cobrou em média ' + this.rs(car.p) + ' e ' + bar.k + ' ' + this.rs(bar.p) + ' o quilo. Prazo de pagamento, frete e qualidade não entram nessa conta.', car.p - bar.p > 0.5 ? 'at' : 'in', meses.length + ' meses');
    } else card('Quem cobrou mais caro pelo tarugo pronto?', '—', 'Precisa de pelo menos dois fornecedores de tarugo pronto no período para comparar.', 'in', 'sem comparação');

    // 3. Metal parado
    const vr = this.virada(s.mes);
    const parado = vr ? vr.lista.reduce((x, u) => x + u.kg, 0) : 0;
    const ult = agg[s.mes] || agg[fim] || {}, custoRef = isFinite(ult.custo) ? ult.custo : this.totais().custoMedio;
    // sucata parada vale pelo preço da SUCATA (média das cotações), não pelo do tarugo
    const pSuc = this.precoSucataRef();
    const custoParado = isFinite(taxa) && isFinite(pSuc) ? parado * pSuc * taxa / 100 : NaN;
    card('Quanta sucata minha está parada nas fundições?', this.n0(parado) + ' kg', (vr ? 'É o que a planilha mostrava no começo de ' + this.mesLongo(vr.mes) + '. ' : 'A planilha não tem esse número para este mês. ') + (isFinite(pSuc) && parado ? 'Pelo preço médio da sucata nas suas cotações (' + this.rs(pSuc) + ' o quilo), é perto de ' + this.rs(parado * pSuc) + ' parados (estimativa). ' : '') + (isFinite(custoParado) ? 'Se esse dinheiro estivesse rendendo ' + this.n2(taxa) + '% ao mês, daria ' + this.rs(custoParado) + ' por mês.' : ''), 'in', vr ? vr.lista.length + ' fundições' : 'sem dado');
    const usinas = vr ? vr.lista.map(u => ({ nome: this.nomeUsina(u.usina), saldo: this.n0(u.kg) + ' kg', abertas: isFinite(pSuc) ? '≈ ' + this.rs(u.kg * pSuc) : '—' })) : [];

    // 4. Quanto do número eu enxergo
    const kgM = meses.reduce((x, m) => x + agg[m].kg, 0), kgPM = meses.reduce((x, m) => x + agg[m].kgP, 0);
    const semFat = meses.filter(m => !agg[m].kgfat).map(m => this.rotMes(m));
    const dups = []; meses.forEach(m => { const vistos = {}; s.dias.filter(d => d.data.slice(0, 7) === m && d.kgfat > 0).forEach(d => { const k = d.kgfat + '|' + d.fat; if (vistos[k]) dups.push(this.dt(vistos[k]) + ' e ' + this.dt(d.data) + ' (' + this.n0(d.kgfat) + ' kg)'); else vistos[k] = d.data; }); });
    card('O que falta anotar para os números ficarem certos?', semFat.length ? semFat.length + ' meses' : 'nada', (semFat.length ? 'Meses sem as vendas anotadas: ' + semFat.join(', ') + '. ' : 'Todos os meses têm as vendas anotadas. ') + 'Do tarugo que chegou, ' + this.pc(kgPM / kgM) + ' tem preço; o resto voltou da fundição sem preço. ' + (dups.length ? 'Vendas iguais em dois dias, pode ser cópia: ' + dups.join('; ') + '.' : ''), !semFat.length && kgPM / kgM >= 0.9 ? 'ok' : 'at', semFat.length ? 'falta anotar' : 'completo');

    // 5. Mercado e preço teto
    const lme = this.num(s.par.lme), dol = this.num(s.par.dolar), cart = this.num(s.par.carteiraPreco);
    const lmeR = isFinite(lme) && isFinite(dol) ? lme * dol / 1000 : NaN;
    let f5 = isFinite(lmeR) ? 'O alumínio na bolsa de Londres (LME) estava a ' + this.rs(lmeR) + ' o quilo. No tarugo pronto você pagou ' + this.rs(custoRef) + ', ou seja, ' + this.rs(custoRef - lmeR) + ' acima da bolsa. ' : 'Anote em Preços o valor da LME e do dólar do mês passado para comparar. ';
    if (isFinite(cart) && isFinite(sobraMin)) f5 += 'Para vender a ' + this.rs(cart) + ' e ainda sobrar ' + this.rs(sobraMin) + ' por quilo, não pague mais de ' + this.rs(cart - sobraMin) + ' no quilo.';
    else f5 += 'Se você anotar em Preços quanto quer que sobre por quilo, o sistema diz o preço máximo para pagar.';
    card('Estou pagando caro?', isFinite(cart) && isFinite(sobraMin) ? 'pague até ' + this.rs(cart - sobraMin) : (isFinite(lmeR) ? this.rs(custoRef - lmeR) + ' acima da bolsa' : '—'), f5, 'in', 'mercado');

    // Gráfico: custo x preço de venda por mês
    const vals = []; meses.forEach(m => { if (isFinite(agg[m].custo)) vals.push(agg[m].custo); if (isFinite(agg[m].venda)) vals.push(agg[m].venda); });
    const vmax = Math.max.apply(null, vals.concat([1])), vmin = Math.min.apply(null, vals.concat([vmax])) * 0.85;
    const h = v => isFinite(v) ? Math.max(4, Math.round(100 * (v - vmin) / (vmax - vmin || 1))) : 0;
    // Barras a partir do zero, com o valor escrito em cima de cada uma.
    const hz = v => isFinite(v) ? Math.max(2, Math.round(100 * v / vmax)) : 0;
    const barras = meses.map(m => { const a = agg[m]; return { rot: m.slice(5, 7) + '/' + m.slice(2, 4), abrir: abrirMes(m), titulo: this.rotMes(m) + ': paguei ' + this.rs(a.custo) + ', vendi ' + this.rs(a.venda), vC: isFinite(a.custo) ? this.n2(a.custo) : '', vV: isFinite(a.venda) ? this.n2(a.venda) : '', sC: 'width:16px;border-radius:3px 3px 0 0;background:#2a3540;height:' + hz(a.custo) + '%', sV: 'width:16px;border-radius:3px 3px 0 0;background:' + (isFinite(a.venda) ? '#d7aa42' : 'transparent') + ';height:' + (isFinite(a.venda) ? hz(a.venda) : 0) + '%', semV: !isFinite(a.venda) }; });

    const pers = [['12', 'Últimos 12 meses'], ['ano', 'Este ano'], ['tudo', 'Todo o histórico']];
    return {
      cards, fornecedores, usinas, barras,
      periodos: pers.map(p => ({ label: p[1], go: () => this.setState({ periodo: p[0] }), style: 'height:44px;padding:0 16px;border-radius:999px;font-weight:600;font-size:14px;cursor:pointer;' + (per === p[0] ? 'background:#0d1117;color:#ffffff;border:1px solid #0d1117' : 'background:#ffffff;color:#2a3540;border:1px solid #c9cfd8') })),
      leituraGrafico: comFat.length ? 'Quanto maior a distância entre a barra escura e a amarela, mais sobrou. Meses sem a barra amarela não têm as vendas anotadas. Clique num mês para ver o resumo dele.' : 'Nenhum mês deste período tem as vendas anotadas.'
    };
  }

  selo(tipo, txt) {
    const m = { ok: ['#e3f1e8', '#1f7a4a'], at: ['#faecd2', '#8a5406'], ri: ['#f8e3df', '#b3382c'], in: ['#e3ecf5', '#2f5d8a'] }[tipo];
    return { selo: txt, seloStyle: 'background:' + m[0] + ';color:' + m[1] + ';border-radius:6px;padding:2px 8px;font-size:12px;font-weight:600;white-space:nowrap' };
  }

  renderVals() {
    const s = this.state, T = this.totais();
    const nomes = [['apresentacao', 'Apresentação'], ['painel', 'Painel'], ['lancar', 'Lançar'], ['analises', 'Análises'], ['precos', 'Preços'], ['sugestoes', 'Sugestões']];
    const lancTabs = ['sucata', 'tarugo', 'usina', 'dia'];
    const ativo = lancTabs.indexOf(s.tab) >= 0 ? 'lancar' : s.tab;
    const tabs = nomes.map(n => ({ label: n[1], go: () => this.setState({ tab: n[0] === 'lancar' ? (s.ultLanc || 'sucata') : n[0], erro: '' }), style: 'height:44px;padding:0 16px;border-radius:6px;font-weight:600;font-size:15px;cursor:pointer;white-space:nowrap;flex:0 0 auto;' + (ativo === n[0] ? 'background:#0d1117;color:#ffffff;border:1px solid #0d1117' : 'background:#ffffff;color:#2a3540;border:1px solid #c9cfd8') }));

    // Uma régua só para custo e sobra (Painel, dia a dia e Análises):
    // custo do metal = média ponderada do tarugo comprado pronto (com preço) + sucata comprada (custo final), no mês.
    // O tarugo que voltou da fundição ainda não tem custo próprio: mostramos a cobertura.
    const nec = this.num(s.par.necessidade) || 0;
    const entrou = T.tKgAll;
    const cobre = nec ? entrou / nec : NaN;
    const cobertura = T.tKgAll ? T.tKg / T.tKgAll : NaN;
    const parcial = !(cobertura >= 0.9); // mais de 10% do tarugo do mês sem preço: a sobra não aparece (o próprio sistema não acreditaria nela)
    const margemBruta = T.pm - T.custoMedio;
    const margem = parcial ? NaN : margemBruta;
    const sobraMin = this.num(s.par.sobraMin), maxParado = this.num(s.par.maxParado);
    // Linguagem do dono: frases curtas, sem termos técnicos. Selo sempre com uma palavra.
    const mesNome = this.mesLongo(s.mes);
    const vrK = this.virada(s.mes);
    const sucataFundicoes = vrK ? vrK.lista.reduce((x, u) => x + u.kg, 0) : T.saldo;
    const kpis = [
      Object.assign({ label: 'Vendi o quilo por', valor: this.rs(T.pm), nota: T.fKg ? this.n0(T.fKg) + ' kg vendidos no mês' : 'as vendas deste mês não foram anotadas' }, T.fKg ? this.selo('in', 'média do mês') : this.selo('at', 'falta anotar')),
      Object.assign({ label: parcial ? 'Paguei o quilo do tarugo pronto' : 'Paguei o quilo do tarugo', valor: this.rs(T.custoMedio), nota: parcial ? (isFinite(cobertura) ? this.pc(cobertura) + ' do tarugo que chegou; o resto voltou da fundição e ainda não tem custo' : 'nenhum tarugo com preço neste mês') : 'média do mês' }, parcial ? this.selo('at', 'só o pronto') : this.selo('in', 'média do mês')),
      Object.assign({ label: 'Sobrou em cada quilo', valor: parcial && T.fKg ? 'falta o custo' : this.rs(margem), nota: parcial && T.fKg ? 'falta o custo do tarugo que voltou da fundição' : 'venda menos o que paguei pelo metal' }, parcial && T.fKg ? this.selo('in', 'conta incompleta') : !isFinite(margem) ? this.selo('in', 'falta anotar') : margem < 0 ? this.selo('ri', 'prejuízo') : isFinite(sobraMin) ? this.selo(margem >= sobraMin ? 'ok' : 'at', margem >= sobraMin ? 'bom' : 'abaixo do seu mínimo') : this.selo('in', 'por quilo')),
      Object.assign({ label: 'Tarugo que chegou no mês', valor: this.n0(entrou) + ' kg', nota: nec ? (entrou >= nec ? 'precisava de ' + this.n0(nec) + ' kg: já chegou tudo' : 'precisava de ' + this.n0(nec) + ' kg: faltam ' + this.n0(nec - entrou) + ' kg') : 'a necessidade do mês não foi anotada' }, nec ? this.selo(cobre >= 1 ? 'ok' : cobre >= 0.7 ? 'at' : 'ri', cobre >= 1 ? 'completo' : 'falta comprar') : this.selo('in', 'sem meta')),
      Object.assign({ label: 'Minha sucata nas fundições', valor: this.n0(sucataFundicoes) + ' kg', nota: vrK ? 'em ' + vrK.lista.length + ' fundições, no começo de ' + this.mesLongo(vrK.mes) : 'pela conta da fundição' }, isFinite(maxParado) && vrK && vrK.lista.some(u => u.kg > maxParado) ? this.selo('at', 'muito parado') : this.selo('in', 'ver Análises'))
    ];
    if (T.sKg) kpis.splice(2, 0, Object.assign({ label: 'Sucata virou tarugo a', valor: this.rs(T.sucKg), nota: 'já com perda e mão de obra da fundição' }, isFinite(T.tarKg) ? this.selo(T.sucKg < T.tarKg ? 'ok' : 'at', T.sucKg < T.tarKg ? 'mais barato que comprar pronto' : 'mais caro que comprar pronto') : this.selo('in', 'do mês')));

    const rk = s.cot.filter(c => c.preco > 0).map(c => ({ c, v: this.custoCot(c) })).sort((a, b) => a.v - b.v);
    const max = rk.length ? rk[rk.length - 1].v : 1, min = rk.length ? rk[0].v : 0;
    const ranking = rk.map((x, i) => ({ forn: x.c.forn, tipo: x.c.tipo === 'sucata' ? 'sucata com ' + this.pc(x.c.perda) + ' de perda' : 'tarugo pronto', custo: this.rs(x.v), barStyle: 'height:100%;border-radius:999px;width:' + Math.max(8, Math.round(100 * (x.v - min * 0.9) / (max - min * 0.9))) + '%;background:' + (i === 0 ? '#9c7518' : '#2a3540') }));
    const p = {
      manchete: !T.fKg ? 'Em ' + mesNome + ' as vendas ainda não foram anotadas. Anote em Lançar › Produção e faturamento para ver quanto sobrou.'
        : parcial ? 'Em ' + mesNome + ' você vendeu o quilo por ' + this.rs(T.pm) + '. Quanto sobrou ainda não dá para dizer: falta o custo do tarugo que voltou da fundição.'
        : 'Em ' + mesNome + ' você vendeu o quilo por ' + this.rs(T.pm) + ' e pagou ' + this.rs(T.custoMedio) + '. Sobraram ' + this.rs(margem) + ' em cada quilo.',
      leituraRanking: rk.length > 1 ? 'Preços anotados na planilha de ' + (rk[0].c.origem ? this.mesLongo(rk[0].c.origem.slice(-7)) : 'compras') + '. Se a perda for maior do que a combinada, a sucata sai mais cara do que aparece aqui.' : ''
    };
    const alertas = [];
    // Pagamento: na planilha, "OK" = pago. Sem "OK" = ainda a pagar.
    const aPagar = s.sucata.filter(r => !r.pago && r.preco > 0);
    if (aPagar.length) {
      const vencidas = aPagar.filter(r => this.venceu(r));
      const tot = aPagar.reduce((x, r) => x + this.calcSucata(r).total, 0);
      alertas.push(Object.assign({ texto: 'Falta pagar ' + aPagar.length + ' compras de sucata: ' + this.rs(tot) + '.' + (vencidas.length ? ' ' + vencidas.length + ' já passaram da data de pagamento.' : '') + ' Quando pagar, abra a compra e clique em Marcar como pago.' }, this.selo(vencidas.length ? 'ri' : 'at', 'Pagar')));
    }
    if (cobre < 1) alertas.push(Object.assign({ texto: 'Faltam ' + this.n0(nec - entrou) + ' kg de tarugo para o que você precisa neste mês.' }, this.selo(cobre < 0.7 ? 'ri' : 'at', 'Comprar')));
    const vrA = this.virada(s.mes);
    if (vrA) alertas.push(Object.assign({ texto: 'Sua sucata nas fundições: ' + vrA.lista.map(u => this.nomeUsina(u.usina) + ' ' + this.n0(u.kg) + ' kg').join(', ') + '.' + (isFinite(maxParado) && vrA.lista.some(u => u.kg > maxParado) ? ' Tem fundição acima do limite que você marcou.' : '') }, this.selo(isFinite(maxParado) && vrA.lista.some(u => u.kg > maxParado) ? 'at' : 'in', 'Fundições')));
    if (T.tSemPreco) alertas.push(Object.assign({ texto: T.tSemPreco + ' entradas de tarugo deste mês estão sem preço. Quase sempre é o tarugo que voltou da fundição. Por isso o "paguei o quilo" mostra só uma parte.' }, this.selo('at', 'Sem preço')));
    if (T.semUsina) alertas.push(Object.assign({ texto: T.semUsina + ' compras de sucata deste mês estão sem a fundição. Abra cada uma e escolha para onde a sucata foi.' }, this.selo('at', 'Completar')));
    if (T.semPreco) alertas.push(Object.assign({ texto: T.semPreco + ' envios de sucata para a fundição estão sem o preço que você pagou. Sem preço, não dá para saber quanto custou.' }, this.selo('at', 'Sem preço')));
    const lme = this.num(s.par.lme), dol = this.num(s.par.dolar);
    p.lme = isFinite(lme) && isFinite(dol) ? 'Para comparar: o alumínio na bolsa de Londres (LME) estava a ' + this.rs(lme * dol / 1000) + ' o quilo no mês passado.' : '';
    if (isFinite(margem) && isFinite(sobraMin) && margem < sobraMin) alertas.push(Object.assign({ texto: 'Sobraram ' + this.rs(margem) + ' por quilo, menos que os ' + this.rs(sobraMin) + ' que você marcou como mínimo.' }, this.selo('ri', 'Sobra baixa')));
    if (!alertas.length) alertas.push(Object.assign({ texto: 'Nada pendente.' }, this.selo('ok', 'Tudo certo')));

    const diasTab = s.dias.filter(d => this.noMes(d)).reverse().map(d => { const pm = d.kgfat ? d.fat / d.kgfat : NaN, m = parcial ? NaN : pm - T.custoMedio; return { data: this.dt(d.data), produz: this.n0(d.produz), kgfat: d.kgfat ? this.n0(d.kgfat) : '—', fat: d.fat ? this.rs(d.fat) : '—', pm: this.rs(pm), margem: this.rs(m), ganho: d.kgfat ? this.rs(m * d.kgfat) : '—', margemStyle: 'text-align:right;font-weight:600;color:' + (!isFinite(m) ? '#5d6871' : m < 0 ? '#b3382c' : isFinite(sobraMin) && m < sobraMin ? '#8a5406' : '#111827') }; });

    const formTabs = ['sucata', 'tarugo', 'usina', 'dia', 'precos'];
    const tela = this.telas();
    const fornSet = {}; s.sucata.forEach(r => fornSet[r.forn] = 1); s.tarugo.forEach(r => fornSet[r.forn] = 1); s.cot.forEach(r => fornSet[r.forn] = 1);
    const parNomes = [['necessidade', 'Necessidade do mês (kg)'], ['carteiraKg', 'Carteira de pedidos (kg)'], ['carteiraPreco', 'Preço da carteira (R$/kg)'], ['moPadrao', 'Mão de obra padrão (R$/kg)'], ['lme', 'LME do mês passado (US$/t)'], ['dolar', 'Dólar do mês passado (R$)'], ['sobraMin', 'Sobra mínima que eu aceito (R$/kg)'], ['maxParado', 'Metal máximo parado por fundição (kg)'], ['taxa', 'Custo do dinheiro (% ao mês)']];
    const parCampos = parNomes.map(n => ({ id: 'par-' + n[0], label: n[1], value: s.par[n[0]], onChange: (e) => { const v = e.target.value; this.setState(st => ({ par: Object.assign({}, st.par, { [n[0]]: v }) })); } }))
      .concat(this.usinas().map(u => ({ id: 'ini-' + u.replace(/\W+/g, '-'), label: 'Saldo na virada do mês · ' + u + ' (kg)', value: s.ini[u] || '', onChange: (e) => { const v = e.target.value; this.setState(st => ({ ini: Object.assign({}, st.ini, { [u]: v }) })); } })));

    // Mês a mês (todo o histórico)
    const agg = this.agregaMeses();
    const abrirMes = ym => () => this.setState(st => ({ mes: ym, tab: 'painel', par: Object.assign({}, st.par, this.parDoMes(ym)) }));
    const mesAMes = Object.keys(agg).sort().reverse().map(ym => {
      const a = agg[ym];
      return { label: this.rotMes(ym), abrir: abrirMes(ym), style: ym === s.mes ? 'background:#f6ebd2' : '',
        kg: this.n0(a.kg), compra: this.rs(a.custo), prod: a.prod ? this.n0(a.prod) : '—', kgfat: a.kgfat ? this.n0(a.kgfat) : 'não lançado', venda: this.rs(a.venda), margem: isFinite(a.sobra) ? this.rs(a.sobra) : (a.kgfat ? 'incompleto' : '—'), ganho: isFinite(a.sobra) ? this.rs(a.sobra * a.kgfat) : '—', semPreco: isFinite(a.cobertura) ? this.pc(a.cobertura) : '—',
        margemStyle: 'text-align:right;font-weight:600;color:' + (!isFinite(a.sobra) ? '#5d6871' : a.sobra < 0 ? '#b3382c' : isFinite(sobraMin) && a.sobra < sobraMin ? '#8a5406' : '#111827') };
    });
    const an = s.tab === 'analises' ? this.analises(agg, abrirMes) : null;
    const comFiltro = ['painel', 'sucata', 'tarugo', 'dia'].indexOf(s.tab) >= 0;
    const am = agg[s.mes] || {};
    const mesSel = {
      mostra: comFiltro,
      valor: s.mes,
      opcoes: (s.listaMeses || []).map(v => ({ v, l: this.rotMes(v) })),
      nota: !am.kgfat ? 'As vendas deste mês não foram anotadas.' : '',
      onChange: (e) => { const v = e.target.value; this.setState(st => ({ mes: v, erro: '', par: Object.assign({}, st.par, this.parDoMes(v)) })); }
    };
    const fonte = s.historico ? 'Seus dados de ' + this.rotMes(s.listaMeses[s.listaMeses.length - 1]) + ' a ' + this.rotMes(s.listaMeses[0]) + ', vindos das planilhas' : 'Dados de exemplo';

    return {
      fonte, mesAMes, mesSel, an: an || { cards: [], fornecedores: [], barras: [], usinas: [] },
      tabs,
      is: { apresentacao: s.tab === 'apresentacao', painel: s.tab === 'painel', form: formTabs.indexOf(s.tab) >= 0, precos: s.tab === 'precos', sugestoes: s.tab === 'sugestoes', analises: s.tab === 'analises' },
      msg: { show: !!s.msg, text: s.msg, temDesfazer: !!s.msgUndo, desfazer: () => this.desfazer() },
      kpis, ranking, alertas, diasTab, p,
      tela: tela || { campos: [], calc: [], colunas: [], linhas: [] },
      listas: { forn: Object.keys(fornSet).sort(), usina: this.usinas().sort(), nf: tela ? tela.nfs : [] },
      parCampos,
      sug: {
        tipo: s.sugTipo, texto: s.sugTexto,
        onTipo: (e) => this.setState({ sugTipo: e.target.value }),
        onTexto: (e) => this.setState({ sugTexto: e.target.value }),
        salvar: (e) => { e.preventDefault(); if (!s.sugTexto.trim()) return; this.setState(st => ({ sugs: [{ id: this.nextId++, tipo: st.sugTipo, texto: st.sugTexto.trim(), status: 'Recebida' }].concat(st.sugs), sugTexto: '' })); this.aviso('Sugestão enviada. O retorno aparece aqui.'); },
        lista: s.sugs
      },
      balao: {
        aberto: s.balao, texto: s.balaoTexto,
        toggle: () => this.setState({ balao: !s.balao }),
        onTexto: (e) => this.setState({ balaoTexto: e.target.value }),
        enviar: () => this.mandarBalao('Dúvida'),
        urgente: () => this.mandarBalao('Urgente: impede o uso')
      }
    };
  }

  mandarBalao(tipo) {
    const t = this.state.balaoTexto.trim(); if (!t) return;
    this.setState(st => ({ sugs: [{ id: this.nextId++, tipo, texto: t, status: 'Recebida' }].concat(st.sugs), balaoTexto: '', balao: false }));
    this.aviso('Recebido. Vai para a fila de Sugestões.');
  }
}

