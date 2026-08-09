# cli/relatorios.py
# ─────────────────────────────────────────────────────────────
# Módulo: Relatórios ACT
# Aprende aqui: typer com múltiplas opções, Rich Progress,
#               geração de PDF com fpdf2
# ─────────────────────────────────────────────────────────────
import typer
from datetime import date
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
from db import get_db

app     = typer.Typer(help="Geração de relatórios ACT")
console = Console()


@app.command()
def gerar(
    obra_id: str = typer.Argument(..., help="UUID da obra"),
    mes:     int = typer.Option(date.today().month, "--mes", "-m", min=1, max=12, help="Mês (1-12)"),
    ano:     int = typer.Option(date.today().year,  "--ano", "-a",  help="Ano"),
    output:  str = typer.Option("",  "--output", "-o", help="Caminho do ficheiro PDF de saída"),
    abrir:   bool = typer.Option(False, "--abrir", help="Abrir PDF após gerar"),
):
    """
    Gera relatório ACT em PDF para uma obra e período.

    Inclui: batidas de ponto, GPS, selfies, horas extra.

    Exemplos:
        python main.py relatorios gerar UUID_OBRA
        python main.py relatorios gerar UUID_OBRA --mes 3 --ano 2026
        python main.py relatorios gerar UUID_OBRA --mes 4 --output /tmp/relatorio.pdf --abrir
    """
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
    import math

    db = get_db()

    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TimeElapsedColumn(),
        transient=True,
    ) as progress:
        t1 = progress.add_task("A carregar dados...", total=4)

        # Obra e empresa
        obra_res = db.table("obras").select("nome,cidade").eq("id", obra_id).single().execute()
        conf_res = db.table("configuracao").select("nome_empresa,nif_empresa,horas_trabalho_dia").limit(1).execute()
        progress.advance(t1)

        obra = obra_res.data or {}
        conf = (conf_res.data or [{}])[0]

        inicio = f"{ano}-{mes:02d}-01T00:00:00"
        if mes == 12:
            fim = f"{ano+1}-01-01T00:00:00"
        else:
            fim = f"{ano}-{mes+1:02d}-01T00:00:00"

        # Pontos do período
        pontos_res = (
            db.table("registos_ponto")
            .select("*, funcionarios(nome_completo, nif)")
            .eq("obra_id", obra_id)
            .gte("data_hora", inicio)
            .lt("data_hora", fim)
            .order("data_hora")
            .execute()
        )
        progress.advance(t1)

        pontos = pontos_res.data or []

        # Agrupar por funcionário + data
        agrupado: dict = {}
        for p in pontos:
            data_str = p["data_hora"][:10]
            key      = f"{p['funcionario_id']}_{data_str}"
            if key not in agrupado:
                agrupado[key] = {"func": p.get("funcionarios") or {}, "data": data_str, "registos": []}
            agrupado[key]["registos"].append(p)

        progress.advance(t1)

        # ── Gerar PDF com fpdf2 ──────────────────────────────
        pdf = FPDF(orientation="L", unit="mm", format="A4")
        pdf.set_auto_page_break(auto=True, margin=12)
        pdf.add_page()

        # Cabeçalho
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 8, "RELATÓRIO DE PONTO ELETRÓNICO — ACT", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 5, f"Empresa: {conf.get('nome_empresa','')}   NIF: {conf.get('nif_empresa','')}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 5, f"Obra: {obra.get('nome','')} — {obra.get('cidade','')}   "
                       f"Período: {mes:02d}/{ano}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.cell(0, 5, f"Gerado em: {date.today().strftime('%d/%m/%Y')}",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.ln(3)
        pdf.set_draw_color(200, 200, 200)
        pdf.line(10, pdf.get_y(), 287, pdf.get_y())
        pdf.ln(3)

        # Cabeçalho da tabela
        headers = ["Data", "Funcionário", "NIF", "Entrada", "Saída", "Total (h)", "Extra (h)", "Geofence", "Selfie", "Estado"]
        widths  = [22,     55,             25,    18,         18,     18,          18,          18,         15,       26]

        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(30, 58, 92)
        pdf.set_text_color(255, 255, 255)
        for h, w in zip(headers, widths):
            pdf.cell(w, 7, h, border=1, fill=True, align="C")
        pdf.ln()

        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(0, 0, 0)
        horas_dia = conf.get("horas_trabalho_dia") or 8.0
        fill = False

        for grupo in sorted(agrupado.values(), key=lambda g: g["data"]):
            entrada_r = next((r for r in grupo["registos"] if r["tipo"] == "entrada"), None)
            saida_r   = next((r for r in grupo["registos"] if r["tipo"] == "saida"),   None)

            hora_e = entrada_r["data_hora"][11:16] if entrada_r else "—"
            hora_s = saida_r["data_hora"][11:16]   if saida_r   else "—"

            horas_total = 0.0
            horas_extra = 0.0
            if entrada_r and saida_r:
                from datetime import datetime as dt
                diff = dt.fromisoformat(saida_r["data_hora"]) - dt.fromisoformat(entrada_r["data_hora"])
                horas_total = diff.total_seconds() / 3600
                horas_extra = max(0, horas_total - horas_dia)

            nif   = grupo["func"].get("nif") or "—"
            nif_m = nif[:6]+"***" if len(nif) > 6 else nif
            geo   = "✓" if (entrada_r and entrada_r.get("dentro_geofence")) else "✗"
            selfie= "✓" if (entrada_r and entrada_r.get("selfie_url"))      else "—"
            estado = (entrada_r or {}).get("estado", "—")

            pdf.set_fill_color(245, 247, 250) if fill else pdf.set_fill_color(255, 255, 255)
            fill = not fill

            # Cor da linha se há anomalia
            if geo == "✗" or estado == "fora_geofence":
                pdf.set_text_color(180, 40, 40)
            else:
                pdf.set_text_color(0, 0, 0)

            row = [
                grupo["data"][5:],  # DD/MM
                grupo["func"].get("nome_completo", "—")[:28],
                nif_m,
                hora_e,
                hora_s,
                f"{horas_total:.2f}" if horas_total else "—",
                f"{horas_extra:.2f}" if horas_extra > 0 else "—",
                geo,
                selfie,
                estado.replace("_", " "),
            ]
            for val, w in zip(row, widths):
                pdf.cell(w, 6, str(val), border=1, fill=True, align="C")
            pdf.ln()

        pdf.set_text_color(0, 0, 0)

        # Rodapé em todas as páginas
        total_pages = pdf.page
        for i in range(1, total_pages + 1):
            pdf.page = i
            pdf.set_y(-10)
            pdf.set_font("Helvetica", "I", 6)
            pdf.set_text_color(150, 150, 150)
            pdf.cell(0, 4,
                     f"ConstruTrack — Documento gerado automaticamente para fiscalização ACT "
                     f"— Página {i}/{total_pages}",
                     align="C")

        progress.advance(t1)

    # Guardar ficheiro
    if not output:
        nome_obra = obra.get("nome", "obra").replace(" ", "_").replace("—", "")
        output    = f"Relatorio_ACT_{nome_obra}_{mes:02d}_{ano}.pdf"

    pdf.output(output)
    typer.secho(f"\n✓ PDF gerado: {output} ({len(agrupado)} registos de presença)", fg=typer.colors.GREEN)

    if abrir:
        typer.launch(output)


@app.command()
def resumo(
    obra_id: str = typer.Argument(..., help="UUID da obra"),
    mes: int = typer.Option(date.today().month, "--mes", "-m", min=1, max=12),
    ano: int = typer.Option(date.today().year,  "--ano", "-a"),
):
    """
    Mostra resumo de conformidade no terminal (sem gerar PDF).

    Exemplo:
        python main.py relatorios resumo UUID_OBRA --mes 4
    """
    db = get_db()

    inicio = f"{ano}-{mes:02d}-01T00:00:00"
    fim_mes = 30 if mes in [4,6,9,11] else 31 if mes != 2 else 28
    fim    = f"{ano}-{mes:02d}-{fim_mes}T23:59:59"

    pontos_res = (
        db.table("registos_ponto")
        .select("estado,dentro_geofence,biometria_ok,selfie_url")
        .eq("obra_id", obra_id)
        .gte("data_hora", inicio)
        .lte("data_hora", fim)
        .execute()
    )
    pontos = pontos_res.data or []

    total          = len(pontos)
    validos        = sum(1 for p in pontos if p["estado"] == "valido")
    fora_geo       = sum(1 for p in pontos if not p.get("dentro_geofence"))
    sem_selfie     = sum(1 for p in pontos if not p.get("selfie_url"))
    conformidade   = (validos / total * 100) if total > 0 else 0

    console.print(f"\n[bold]Resumo ACT — {mes:02d}/{ano}[/bold]\n")
    console.print(f"  Total de batidas       : {total}")
    console.print(f"  Válidas                : [green]{validos}[/green]")
    console.print(f"  Fora de geofence       : [{'red' if fora_geo else 'green'}]{fora_geo}[/{'red' if fora_geo else 'green'}]")
    console.print(f"  Sem selfie             : [{'yellow' if sem_selfie else 'green'}]{sem_selfie}[/{'yellow' if sem_selfie else 'green'}]")
    console.print(f"  Conformidade           : [{'green' if conformidade >= 95 else 'yellow'}]{conformidade:.1f}%[/{'green' if conformidade >= 95 else 'yellow'}]\n")
