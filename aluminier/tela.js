// Telas da Torre de Controle - Aluminier, em htm (vieram do protótipo validado pelo Conselho em 18/11/2026).
import { html } from './vendor/preact-htm.js';
export function desenhar(v) {
  const { fonte, mesAMes, mesSel, an, tabs, is, msg, kpis, ranking, alertas, diasTab, p, tela, listas, parCampos, sug, balao } = v;
  return html`<div class="raiz" style="background: #f6f6f3; color: #2a3540; font-family: 'DM Sans', 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 23px;">

<header style="background: #0d1117; color: #ffffff; padding: 20px 28px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;">
<div style="display: flex; align-items: center; gap: 14px;">
<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><path d="M27 8.5A12 12 0 1 0 27 25.5" fill="none" stroke="#d7aa42" stroke-width="3.2" stroke-linecap="round"></path><path d="M14 13h9M14 17h7M14 21h9" stroke="#d7aa42" stroke-width="2.4" stroke-linecap="round"></path></svg>
<div>
<div style="font-family: Syne, Arial, sans-serif; font-weight: 700; font-size: 21px; line-height: 26px;">Torre de Controle - Aluminier</div>
<div style="font-size: 13px; color: #d7aa42;">Compra de metal, refusão e margem por quilo · by Capacity Case</div>
</div>
</div>
<div style="font-size: 13px; color: #cbd2dc;" class="num">${fonte}</div>
</header>

<nav aria-label="Menu" style="background: #ffffff; border-bottom: 1px solid #e4e6e2; padding: 10px 28px; display: flex; flex-wrap: wrap; gap: 8px;">
${(tabs || []).map((t, $index) => html`
<button type="button" onClick=${t.go} style=${t.style}>${t.label}</button>
`)}
</nav>

${mesSel.mostra ? html`
<div style="padding: 14px 28px 0; display: flex; flex-wrap: wrap; align-items: center; gap: 10px;">
<label for="mes-sel" style="font-size: 14px; font-weight: 600; color: #2a3540;">Vendo o mês</label>
<select id="mes-sel" value=${mesSel.valor} onChange=${mesSel.onChange} style="height: 44px; padding: 0 12px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827; font-weight: 600; font-size: 15px;">
${(mesSel.opcoes || []).map((o, $index) => html`<option value=${o.v}>${o.l}</option>`)}
</select>
<span style="font-size: 13px; color: #5d6871;">${mesSel.nota}</span>
</div>
` : null}

<main style="padding: 28px; display: flex; flex-direction: column; gap: 20px;">

${msg.show ? html`
<div role="status" style="background: #e3f1e8; color: #1f7a4a; border-radius: 6px; padding: 10px 14px; font-weight: 600; font-size: 14px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;"><span>${msg.text}</span>${msg.temDesfazer ? html`<button type="button" onClick=${msg.desfazer} style="height: 44px; padding: 0 14px; border: 1px solid #1f7a4a; border-radius: 6px; background: #ffffff; color: #1f7a4a; font-weight: 600; cursor: pointer;">Desfazer</button>` : null}</div>
` : null}


${is.apresentacao ? html`
<section style="display: flex; flex-direction: column; gap: 20px;">
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 28px; box-shadow: 0 1px 2px rgba(17,24,39,.05), 0 8px 22px rgba(17,24,39,.05);">
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">APRESENTAÇÃO</div>
<h1 style="font-family: Syne, Arial, sans-serif; font-size: 30px; line-height: 36px; margin: 8px 0 12px; color: #111827;">Suas planilhas de compra viraram uma tela só.</h1>
<p style="margin: 0; font-size: 17px; line-height: 26px;">Você continua anotando o mesmo que anotava. A diferença é que agora as contas saem sozinhas e a tela responde três perguntas: <strong>quanto paguei no quilo</strong>, <strong>quanto vendi o quilo</strong> e <strong>quanto sobrou</strong>.</p>
</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;"><div style="font-family: Syne, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #9c7518;">1</div><h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 6px 0;">Você anota</h2><p style="margin: 0; font-size: 15px;">A sucata que comprou, o tarugo que chegou e quanto vendeu no dia. Tudo no botão <strong>Lançar</strong>.</p></div>
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;"><div style="font-family: Syne, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #9c7518;">2</div><h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 6px 0;">O sistema faz as contas</h2><p style="margin: 0; font-size: 15px;">Tira a perda, soma a mão de obra, calcula o preço do quilo e quanto metal seu está em cada fundição.</p></div>
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;"><div style="font-family: Syne, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #9c7518;">3</div><h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 6px 0;">Você vê e decide</h2><p style="margin: 0; font-size: 15px;">No <strong>Painel</strong>: quanto sobrou no mês, de quem comprar mais barato e o que falta pagar.</p></div>
</div>
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 8px;">No dia a dia</h2>
<ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 26px;">
<li>Chegou sucata? <strong>Lançar › Sucata</strong>.</li>
<li>Chegou tarugo comprado? <strong>Lançar › Tarugo comprado</strong>.</li>
<li>Voltou tarugo da fundição? <strong>Lançar › Fundição</strong>.</li>
<li>Fim do dia? <strong>Lançar › Produção e faturamento</strong>.</li>
<li>Errou? Clique em <strong>Abrir</strong> na linha, corrija e salve.</li>
<li>Não entendeu algo? Botão <strong>Dúvida?</strong> no canto da tela.</li>
</ul>
<p style="margin: 10px 0 0; font-size: 13px; color: #5d6871;">Melhorias saem toda segunda. Se algo impedir o uso, resolvemos em até 48 horas.</p>
</div>
</section>
` : null}


${is.painel ? html`
<section style="display: flex; flex-direction: column; gap: 20px;">
<div>
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">RESUMO DO MÊS</div>
<h1 style="font-family: Syne, Arial, sans-serif; font-size: 30px; line-height: 36px; margin: 6px 0 0; color: #111827;">${p.manchete}</h1>
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px;">
${(kpis || []).map((k, $index) => html`
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(17,24,39,.05), 0 8px 22px rgba(17,24,39,.05); display: flex; flex-direction: column; gap: 6px;">
<div style="font-size: 13px; color: #5d6871;">${k.label}</div>
<div class="num" style="font-family: Syne, Arial, sans-serif; font-weight: 700; font-size: 28px; line-height: 32px; color: #111827;">${k.valor}</div>
<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;"><span style=${k.seloStyle}>${k.selo}</span><span style="font-size: 13px; color: #5d6871;">${k.nota}</span></div>
</div>
`)}
</div>

<div style="display: flex; flex-wrap: wrap; gap: 16px;">
<div style="flex: 999 1 520px; min-width: 0; background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0;">De quem comprar</h2>
<p style="margin: 4px 0 16px; font-size: 14px; color: #5d6871;">Quanto sai cada quilo de tarugo, já contando a perda e a mão de obra da fundição. O de cima é o mais barato.</p>
<div style="display: flex; flex-direction: column; gap: 10px;">
${(ranking || []).map((r, $index) => html`
<div style="display: grid; grid-template-columns: minmax(150px, 220px) minmax(0, 1fr) 92px; gap: 12px; align-items: center;">
<div style="font-size: 14px;"><strong style="color: #111827;">${r.forn}</strong> <span style="color: #5d6871; font-size: 13px;">${r.tipo}</span></div>
<div style="height: 12px; background: #eceee9; border-radius: 999px; overflow: hidden;"><div style=${r.barStyle}></div></div>
<div class="num" style="text-align: right; font-weight: 600; color: #111827;">${r.custo}</div>
</div>
`)}
</div>
<p style="margin: 14px 0 0; font-size: 13px; color: #2a3540;">${p.leituraRanking}</p>
<p style="margin: 6px 0 0; font-size: 13px; color: #5d6871;">${p.lme}</p>
</div>

<div style="flex: 1 1 320px; min-width: 0; background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0;">O que pede sua atenção</h2>
${(alertas || []).map((a, $index) => html`
<div style="display: flex; gap: 10px; align-items: flex-start;">
<span style=${a.seloStyle}>${a.selo}</span>
<span style="font-size: 14px;">${a.texto}</span>
</div>
`)}
</div>
</div>

<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 4px;">Cada dia do mês</h2>
<p style="margin: 0 0 14px; font-size: 14px; color: #5d6871;">"Sobrou" é o preço de venda menos o que você pagou pelo metal. Ainda não tira luz, salários e impostos.</p>
<div style="overflow-x: auto;">
<table>
<thead><tr><th>Dia</th><th class="r">Produziu (kg)</th><th class="r">Vendeu (kg)</th><th class="r">Vendeu (R$)</th><th class="r">Preço do quilo</th><th class="r">Sobrou por quilo</th><th class="r">Sobrou no dia</th></tr></thead>
<tbody>
${(diasTab || []).map((d, $index) => html`
<tr><td class="num">${d.data}</td><td class="r num">${d.produz}</td><td class="r num">${d.kgfat}</td><td class="r num">${d.fat}</td><td class="r num">${d.pm}</td><td class="r num" style=${d.margemStyle}>${d.margem}</td><td class="r num" style=${d.margemStyle}>${d.ganho}</td></tr>
`)}
</tbody>
</table>
</div>
</div>
</section>
` : null}


${is.analises ? html`
<section style="display: flex; flex-direction: column; gap: 20px;">
<div>
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">ANÁLISES</div>
<h1 style="font-family: Syne, Arial, sans-serif; font-size: 30px; line-height: 36px; margin: 6px 0 4px; color: #111827;">O que os seus números dizem</h1>
<p style="margin: 0; color: #5d6871; font-size: 15px;">Cinco perguntas sobre o seu negócio, cada uma respondida numa frase. "Sobrou" é o preço de venda menos o que você pagou pelo metal; ainda não tira luz, salários e impostos.</p>
</div>
<div role="group" aria-label="Período" style="display: flex; flex-wrap: wrap; gap: 8px;">
${(an.periodos || []).map((p, $index) => html`<button type="button" onClick=${p.go} style=${p.style}>${p.label}</button>`)}
</div>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
${(an.cards || []).map((c, $index) => html`
<article style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(17,24,39,.05), 0 8px 22px rgba(17,24,39,.05); display: flex; flex-direction: column; gap: 8px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; line-height: 24px; margin: 0; color: #111827;">${c.pergunta}</h2>
<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px;"><span class="num" style="font-family: Syne, Arial, sans-serif; font-weight: 700; font-size: 28px; line-height: 32px; color: #111827;">${c.numero}</span><span style=${c.seloStyle}>${c.selo}</span></div>
<p style="margin: 0; font-size: 15px;">${c.frase}</p>
</article>
`)}
</div>

<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 4px;">Quanto paguei e por quanto vendi o quilo, mês a mês</h2>
<div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #5d6871; margin-bottom: 12px;"><span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 12px; border-radius: 3px; background: #2a3540;"></span>Quanto paguei o quilo</span><span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 12px; border-radius: 3px; background: #d7aa42;"></span>Por quanto vendi o quilo</span></div>
<div style="overflow-x: auto;">
<div style="display: flex; align-items: flex-end; gap: 6px; height: 200px; min-width: 100%; border-bottom: 1px solid #c9cfd8;">
${(an.barras || []).map((b, $index) => html`
<button type="button" onClick=${b.abrir} title=${b.titulo} aria-label=${b.titulo} style="flex: 1 0 84px; height: 100%; border: 0; background: none; padding: 0; cursor: pointer; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
<span style="width: 38px; height: 100%; box-sizing: border-box; padding-top: 20px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;"><span class="num" style="font-size: 12px; font-weight: 600; color: #2a3540; white-space: nowrap; margin-bottom: 3px;">${b.vC}</span><span style=${b.sC}></span></span>
<span style="width: 38px; height: 100%; box-sizing: border-box; padding-top: 20px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;"><span class="num" style="font-size: 12px; font-weight: 600; color: #7a5b10; white-space: nowrap; margin-bottom: 3px;">${b.vV}</span><span style=${b.sV}></span></span>
</button>
`)}
</div>
<div style="display: flex; gap: 6px; min-width: 100%;">
${(an.barras || []).map((b, $index) => html`<span class="num" style="flex: 1 0 84px; text-align: center; font-size: 12px; color: #5d6871; padding-top: 4px;">${b.rot}</span>`)}
</div>
</div>
<p style="margin: 10px 0 0; font-size: 13px; color: #2a3540;">${an.leituraGrafico}</p>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 16px;">
<div style="flex: 999 1 520px; min-width: 0; background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 4px;">De quem você comprou tarugo pronto</h2>
<p style="margin: 0 0 12px; font-size: 14px; color: #5d6871;">No período escolhido. A última coluna mostra quanto o fornecedor cobrou a mais (+) ou a menos (−) que a média, por quilo.</p>
<div style="overflow-x: auto;"><table>
<thead><tr><th>Fornecedor</th><th class="r">Quilos</th><th class="r">Do total</th><th class="r">Preço do quilo</th><th class="r">Meses</th><th class="r">Contra a média</th></tr></thead>
<tbody>${(an.fornecedores || []).map((x, $index) => html`<tr><td style="font-weight: 600; color: #111827;">${x.nome}</td><td class="r num">${x.kg}</td><td class="r num">${x.part}</td><td class="r num">${x.preco}</td><td class="r num">${x.meses}</td><td class="num" style=${x.difStyle}>${x.dif}</td></tr>`)}</tbody>
</table></div>
</div>
<div style="flex: 1 1 300px; min-width: 0; background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 12px;">Sucata sua em cada fundição (virada do mês)</h2>
<table>
<thead><tr><th>Fundição</th><th class="r">Saldo</th><th class="r">Valor pelo custo</th></tr></thead>
<tbody>${(an.usinas || []).map((u, $index) => html`<tr><td style="font-weight: 600; color: #111827;">${u.nome}</td><td class="r num">${u.saldo}</td><td class="r num">${u.abertas}</td></tr>`)}</tbody>
</table>
</div>
</div>

<details style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<summary style="font-family: Syne, Arial, sans-serif; font-size: 17px; font-weight: 700; cursor: pointer; min-height: 44px; display: flex; align-items: center;">Ver a tabela de todos os meses</summary>
<p style="margin: 8px 0 14px; font-size: 14px; color: #5d6871;">Clique no mês para abrir o resumo dele. "Com preço" = quanto do tarugo que chegou tem preço anotado.</p>
<div style="overflow-x: auto;">
<table>
<thead><tr><th>Mês</th><th class="r">Tarugo que chegou</th><th class="r">Paguei o quilo</th><th class="r">Produziu</th><th class="r">Vendeu (kg)</th><th class="r">Vendi o quilo</th><th class="r">Sobrou por quilo</th><th class="r">Sobrou no mês</th><th class="r">Com preço</th></tr></thead>
<tbody>
${(mesAMes || []).map((m, $index) => html`
<tr style=${m.style}><td><button type="button" onClick=${m.abrir} style="min-height: 44px; border: 0; background: none; padding: 0; color: #7a5b10; font-weight: 600; cursor: pointer; text-decoration: underline;">${m.label}</button></td><td class="r num">${m.kg}</td><td class="r num">${m.compra}</td><td class="r num">${m.prod}</td><td class="r num">${m.kgfat}</td><td class="r num">${m.venda}</td><td class="r num" style=${m.margemStyle}>${m.margem}</td><td class="r num" style=${m.margemStyle}>${m.ganho}</td><td class="r num">${m.semPreco}</td></tr>
`)}
</tbody>
</table>
</div>
</details>
</section>
` : null}


${is.form ? html`
<section style="display: flex; flex-direction: column; gap: 20px;">
<div>
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">${tela.eyebrow}</div>
<h1 style="font-family: Syne, Arial, sans-serif; font-size: 30px; line-height: 36px; margin: 6px 0 4px; color: #111827;">${tela.titulo}</h1>
<p style="margin: 0; color: #5d6871;">${tela.ajuda}</p>
</div>

${tela.temSubs ? html`
<div role="group" aria-label="O que você vai lançar" style="display: flex; flex-wrap: wrap; gap: 8px;">
${(tela.subs || []).map((c, $index) => html`
<button type="button" onClick=${c.go} style=${c.style}>${c.label}</button>
`)}
</div>
` : null}

${tela.temChips ? html`
<div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
<span style="font-size: 13px; font-weight: 600; color: #5d6871;">Fundição:</span>
${(tela.chips || []).map((c, $index) => html`
<button type="button" onClick=${c.go} style=${c.style}>${c.label}</button>
`)}
</div>
` : null}

<form onSubmit=${tela.salvar} style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; box-shadow: 0 1px 2px rgba(17,24,39,.05), 0 8px 22px rgba(17,24,39,.05); display: flex; flex-direction: column; gap: 16px;">
${tela.editando ? html`
<div style="background: #f6ebd2; border: 1px solid #9c7518; border-radius: 6px; padding: 10px 14px; font-size: 14px; color: #111827;"><strong>Editando:</strong> ${tela.editTexto}. Mude o que precisar e clique em Salvar alteração.</div>
` : null}
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">VOCÊ PREENCHE</div>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px;">
${(tela.campos || []).map((f, $index) => html`
<div style="display: flex; flex-direction: column; gap: 6px;">
<label for=${f.id} style="font-size: 13px; font-weight: 600; color: #2a3540;">${f.label}</label>
${f.isSel ? html`<select id=${f.id} value=${f.value} onChange=${f.onChange} style="height: 44px; box-sizing: border-box; padding: 0 10px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827; font-size: 15px;">${(f.opcoes || []).map((o, $index) => html`<option value=${o.v}>${o.l}</option>`)}</select>` : null}
${f.isInput ? html`<input id=${f.id} type=${f.type} inputmode=${f.mode} list=${f.list} placeholder=${f.ph} value=${f.value} onInput=${f.onChange} style="height: 44px; width: 100%; box-sizing: border-box; padding: 0 12px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827; font-size: 15px;" />` : null}
</div>
`)}
</div>
<datalist id="lista-forn">${(listas.forn || []).map((o, $index) => html`<option value=${o}></option>`)}</datalist>
<datalist id="lista-usina">${(listas.usina || []).map((o, $index) => html`<option value=${o}></option>`)}</datalist>
<datalist id="lista-nf">${(listas.nf || []).map((o, $index) => html`<option value=${o}></option>`)}</datalist>

${tela.temCalc ? html`
<div style="background: #f6ebd2; border-radius: 6px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px;">
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">O SISTEMA CALCULA</div>
<div style="display: flex; flex-wrap: wrap; gap: 8px 28px;">
${(tela.calc || []).map((c, $index) => html`
<div><span style="font-size: 13px; color: #5d6871;">${c.label}</span> <strong class="num" style="color: #111827;">${c.valor}</strong></div>
`)}
</div>
</div>
` : null}

<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
<button type="submit" style="height: 44px; padding: 0 22px; border: 0; border-radius: 6px; background: #0d1117; color: #ffffff; font-weight: 600; cursor: pointer;">${tela.botao}</button>
<button type="button" onClick=${tela.limpar} style="height: 44px; padding: 0 18px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #2a3540; font-weight: 600; cursor: pointer;">${tela.botaoLimpar}</button>
${tela.ed.temPago ? html`<button type="button" onClick=${tela.ed.pago} style="height: 44px; padding: 0 16px; border: 1px solid #1f7a4a; border-radius: 6px; background: #ffffff; color: #1f7a4a; font-weight: 600; cursor: pointer;">${tela.ed.pagoLabel}</button>` : null}
${tela.editando ? html`
<span style="flex: 1 1 auto;"></span>
${tela.ed.naoConfirmando ? html`<button type="button" onClick=${tela.ed.pedirExcluir} style="height: 44px; padding: 0 14px; border: 0; background: none; color: #b3382c; font-weight: 600; cursor: pointer; text-decoration: underline;">Excluir este lançamento</button>` : null}
${tela.ed.confirmando ? html`<span style="font-size: 14px; color: #b3382c; font-weight: 600;">${tela.ed.impacto}</span><button type="button" onClick=${tela.ed.excluir} style="height: 44px; padding: 0 14px; border: 0; border-radius: 6px; background: #b3382c; color: #ffffff; font-weight: 600; cursor: pointer;">Sim, excluir</button><button type="button" onClick=${tela.ed.naoExcluir} style="height: 44px; padding: 0 14px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #2a3540; font-weight: 600; cursor: pointer;">Não</button>` : null}
` : null}
<span style="font-size: 13px; color: #b3382c; font-weight: 600;">${tela.erro}</span>
</div>
</form>

<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; align-items: baseline; margin-bottom: 12px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0;">${tela.tituloLista}</h2>
<span class="num" style="font-size: 14px; color: #2a3540;">${tela.resumo}</span>
</div>
<div style="overflow-x: auto;">
<table>
<thead><tr><th><span style="position: absolute; left: -9999px;">Ação</span></th>${(tela.colunas || []).map((h, $index) => html`<th style=${h.style}>${h.label}</th>`)}</tr></thead>
<tbody>
${(tela.linhas || []).map((l, $index) => html`
<tr style=${l.style}>
<td>${l.temEditar ? html`<button type="button" onClick=${l.editar} aria-label=${l.rotulo} style="height: 44px; padding: 0 14px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827; font-size: 14px; font-weight: 600; cursor: pointer;">Abrir</button>` : null}</td>
${(l.cel || []).map((c, $index) => html`<td class="num" style=${c.style}>${c.v}</td>`)}
</tr>
`)}
</tbody>
</table>
</div>
</div>

${tela.temRet ? html`
<div style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0 0 12px;">Tarugo que voltou desta fundição</h2>
<div style="overflow-x: auto;">
<table>
<thead><tr><th><span style="position: absolute; left: -9999px;">Ação</span></th><th>Data</th><th>NF da fundição</th><th>Vinculado à remessa</th><th class="r">Tarugo (kg)</th></tr></thead>
<tbody>
${(tela.ret || []).map((r, $index) => html`
<tr><td><button type="button" onClick=${r.editar} aria-label=${r.rotulo} style="height: 44px; padding: 0 14px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827; font-size: 14px; font-weight: 600; cursor: pointer;">Abrir</button></td><td class="num">${r.data}</td><td class="num">${r.nf}</td><td>${r.vinc}</td><td class="r num">${r.kg}</td></tr>
`)}
</tbody>
</table>
</div>
</div>
` : null}
</section>
` : null}


${is.precos ? html`
<section style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
<h2 style="font-family: Syne, Arial, sans-serif; font-size: 17px; margin: 0;">Metas e posição do mês</h2>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px;">
${(parCampos || []).map((f, $index) => html`
<div style="display: flex; flex-direction: column; gap: 6px;">
<label for=${f.id} style="font-size: 13px; font-weight: 600;">${f.label}</label>
<input id=${f.id} inputmode="decimal" value=${f.value} onInput=${f.onChange} style="height: 44px; box-sizing: border-box; padding: 0 12px; border: 1px solid #c9cfd8; border-radius: 6px; color: #111827; font-size: 15px;" />
</div>
`)}
</div>
</section>
` : null}


${is.sugestoes ? html`
<section style="display: flex; flex-direction: column; gap: 20px;">
<div>
<div style="font-size: 12px; font-weight: 600; letter-spacing: .2em; color: #7a5b10;">SUGESTÕES</div>
<h1 style="font-family: Syne, Arial, sans-serif; font-size: 30px; line-height: 36px; margin: 6px 0 4px; color: #111827;">O que melhorar no sistema</h1>
<p style="margin: 0; color: #5d6871;">Versão nova toda segunda: sugestões de segunda a quarta, reunião na quinta. O que impede o uso é resolvido em até 48 horas. Cada sugestão só aparece para o gestor e para quem a criou.</p>
</div>
<form onSubmit=${sug.salvar} style="background: #ffffff; border: 1px solid #e4e6e2; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px;">
<label for="sug-tipo" style="font-size: 13px; font-weight: 600;">Tipo</label>
<select id="sug-tipo" value=${sug.tipo} onChange=${sug.onTipo} style="height: 44px; padding: 0 12px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #111827;">
<option value="Melhoria">Melhoria</option><option value="Dúvida">Dúvida</option><option value="Urgente: impede o uso">Urgente: impede o uso</option>
</select>
<label for="sug-texto" style="font-size: 13px; font-weight: 600;">O que você sugere</label>
<textarea id="sug-texto" rows="3" value=${sug.texto} onInput=${sug.onTexto} style="padding: 10px 12px; border: 1px solid #c9cfd8; border-radius: 6px; color: #111827; resize: vertical;"></textarea>
<div><button type="submit" style="height: 44px; padding: 0 22px; border: 0; border-radius: 6px; background: #0d1117; color: #ffffff; font-weight: 600; cursor: pointer;">Enviar sugestão</button></div>
</form>
</section>
` : null}

</main>

<div style="position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; z-index: 5;">
${balao.aberto ? html`
<div style="width: 300px; max-width: calc(100vw - 40px); background: #ffffff; border: 1px solid #e4e6e2; border-radius: 16px; padding: 16px; box-shadow: 0 12px 32px -8px rgba(17,24,39,.25); display: flex; flex-direction: column; gap: 10px;">
<strong style="color: #111827;">Travou em algo nesta tela?</strong>
<label for="balao-texto" style="font-size: 13px; color: #5d6871;">Conte em uma frase. Vai para a fila de Sugestões.</label>
<textarea id="balao-texto" rows="3" value=${balao.texto} onInput=${balao.onTexto} style="padding: 8px 10px; border: 1px solid #c9cfd8; border-radius: 6px; resize: vertical;"></textarea>
<div style="display: flex; gap: 8px;"><button type="button" onClick=${balao.enviar} style="height: 44px; padding: 0 14px; border: 0; border-radius: 6px; background: #0d1117; color: #ffffff; font-weight: 600; cursor: pointer;">Enviar</button><button type="button" onClick=${balao.urgente} style="height: 44px; padding: 0 12px; border: 1px solid #c9cfd8; border-radius: 6px; background: #ffffff; color: #b3382c; font-weight: 600; cursor: pointer;">Urgente: impede o uso</button></div>
</div>
` : null}
<button type="button" onClick=${balao.toggle} aria-label="Abrir o balão de dúvida" style="height: 52px; padding: 0 18px; border: 0; border-radius: 999px; background: #0d1117; color: #ffffff; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 12px 32px -8px rgba(17,24,39,.35);">
<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#d7aa42" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"></path></svg>
Dúvida?</button>
</div>

</div>`;
}
