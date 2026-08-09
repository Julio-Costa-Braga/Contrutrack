#!/usr/bin/env python3
# cli/main.py
# ─────────────────────────────────────────────────────────────
# ConstruTrack CLI — ponto de entrada principal
#
# USO:
#   pip install -r requirements.txt
#   cp .env.example .env   # preencher com as chaves do Supabase
#   python main.py --help
#
# SUBCOMANDOS:
#   python main.py ponto    --help
#   python main.py rh       --help
#   python main.py compras  --help
#   python main.py relatorios --help
#   python main.py obras    --help
# ─────────────────────────────────────────────────────────────
import typer
from rich.console import Console
from rich.table import Table
from rich import box

import ponto
import rh
import compras
import relatorios

app     = typer.Typer(
    name="construtrack",
    help="ConstruTrack CLI — gestão de obra, RH e conformidade ACT",
    no_args_is_help=True,
    rich_markup_mode="rich",
)
console = Console()

# ── Registar subcomandos ──────────────────────────────────────
app.add_typer(ponto.app,      name="ponto",      help="Ponto eletrónico e geofencing")
app.add_typer(rh.app,         name="rh",         help="RH, onboarding e documentos")
app.add_typer(compras.app,    name="compras",    help="Requisições, cotações e aprovações")
app.add_typer(relatorios.app, name="relatorios", help="Relatórios ACT em PDF")


# ── Comando extra: obras ──────────────────────────────────────
@app.command()
def obras(
    estado: str = typer.Option("ativa", "--estado", "-e", help="Estado da obra"),
):
    """
    Lista estaleiros (obras).

    Exemplo:
        python main.py obras
        python main.py obras --estado em_preparacao
    """
    from db import get_db
    db  = get_db()
    res = db.table("obras").select("id,nome,cidade,estado,raio_geofence,orcamento_total,custo_real").eq("estado", estado).execute()

    table = Table(title=f"Estaleiros [{estado}]", box=box.ROUNDED, show_lines=True)
    table.add_column("Nome",     style="bold")
    table.add_column("Cidade")
    table.add_column("Geofence", justify="right")
    table.add_column("Orçado",   justify="right")
    table.add_column("Real",     justify="right")
    table.add_column("% custo")
    table.add_column("ID (curto)")

    for o in (res.data or []):
        orc  = o.get("orcamento_total") or 0
        real = o.get("custo_real") or 0
        pct  = f"{real/orc*100:.0f}%" if orc > 0 else "—"
        cor  = "green" if (orc > 0 and real/orc < 1) else "red" if orc > 0 else "dim"

        table.add_row(
            o["nome"],
            o.get("cidade") or "—",
            f"{o['raio_geofence']}m",
            f"€{orc:,.0f}"  if orc  else "—",
            f"€{real:,.0f}" if real else "—",
            f"[{cor}]{pct}[/{cor}]",
            o["id"][:8] + "...",
        )

    console.print(table)


# ── Comando de estado do sistema ──────────────────────────────
@app.command()
def status():
    """
    Verifica a ligação ao Supabase e mostra o estado geral.

    Exemplo:
        python main.py status
    """
    from db import get_db
    try:
        db = get_db()
        res_obras = db.table("obras").select("id", count="exact").execute()
        res_funcs = db.table("funcionarios").select("id", count="exact").eq("ativo", True).execute()
        res_alertas = db.table("alertas").select("id", count="exact").eq("lido", False).execute()

        typer.secho("✓ Ligação ao Supabase OK", fg=typer.colors.GREEN)
        console.print(f"\n  Obras ativas     : {res_obras.count or 0}")
        console.print(f"  Funcionários      : {res_funcs.count or 0}")
        console.print(f"  Alertas por ler   : {res_alertas.count or 0}\n")
    except Exception as e:
        typer.secho(f"✗ Erro de ligação: {e}", fg=typer.colors.RED)
        raise typer.Exit(1)


if __name__ == "__main__":
    app()
