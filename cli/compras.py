# cli/compras.py
# ─────────────────────────────────────────────────────────────
# Módulo: Compras e Logística
# Aprende aqui: typer.confirm com abort, typer.secho com cores,
#               callbacks de validação, múltiplas opções
# ─────────────────────────────────────────────────────────────
import typer
from enum import Enum
from rich.console import Console
from rich.table import Table
from rich import box
from db import get_db

app     = typer.Typer(help="Gestão de compras e logística")
console = Console()


class EstadoReq(str, Enum):
    rascunho              = "rascunho"
    aguarda_cotacao       = "aguarda_cotacao"
    aguarda_aprov_direta  = "aguarda_aprovacao_direta"
    aguarda_financeiro    = "aguarda_aprovacao_financeiro"
    aguarda_diretoria     = "aguarda_aprovacao_diretoria"
    aprovado              = "aprovado"
    rejeitado             = "rejeitado"
    entregue              = "entregue"
    fechado               = "fechado"


@app.command()
def listar(
    obra_id: str | None = typer.Option(None, "--obra", "-o", help="Filtrar por obra"),
    estado:  EstadoReq | None = typer.Option(None, "--estado", "-e", help="Filtrar por estado"),
    pendentes: bool = typer.Option(False, "--pendentes", "-p", help="Apenas aguardam aprovação"),
):
    """
    Lista requisições de compra.

    Exemplos:
        python main.py compras listar
        python main.py compras listar --pendentes
        python main.py compras listar --estado aprovado
    """
    db    = get_db()
    query = db.table("requisicoes").select("*, obras(nome)").order("created_at", desc=True)

    if obra_id:
        query = query.eq("obra_id", obra_id)
    if estado:
        query = query.eq("estado", estado.value)
    if pendentes:
        query = query.like("estado", "aguarda_%")

    res  = query.execute()
    reqs = res.data or []

    table = Table(title="Requisições de compra", box=box.ROUNDED, show_lines=True)
    table.add_column("Título",    style="bold")
    table.add_column("Obra")
    table.add_column("Valor",     justify="right")
    table.add_column("Nível")
    table.add_column("IVA")
    table.add_column("Estado")

    cor_estado = {
        "aprovado": "green", "fechado": "green",
        "rejeitado": "red",
        "rascunho": "dim",
    }

    for r in reqs:
        obra_nome = (r.get("obras") or {}).get("nome", "—")
        valor     = f"€{r['valor_estimado']:,.0f}" if r.get("valor_estimado") else "—"
        nivel     = r.get("nivel_aprovacao") or "—"
        iva       = "[yellow]AL 0%[/yellow]" if r.get("iva_autoliquidacao") else "—"
        estado_s  = r["estado"].replace("_", " ")
        cor       = cor_estado.get(r["estado"], "yellow")
        estado_r  = f"[{cor}]{estado_s}[/{cor}]"

        table.add_row(r["titulo"][:40], obra_nome[:25], valor, nivel, iva, estado_r)

    console.print(table)
    console.print(f"[dim]Total: {len(reqs)} requisições[/dim]")


@app.command()
def aprovar(
    requisicao_id: str  = typer.Argument(..., help="UUID da requisição"),
    force: bool = typer.Option(False, "--force", "-f", help="Sem confirmação"),
):
    """
    Aprova uma requisição de compra.
    Para valores acima de €50k pede confirmação extra.

    Exemplos:
        python main.py compras aprovar UUID_REQ
        python main.py compras aprovar UUID_REQ --force
    """
    db  = get_db()
    res = db.table("requisicoes").select("titulo,valor_estimado,estado,nivel_aprovacao").eq("id", requisicao_id).single().execute()

    if not res.data:
        typer.secho("✗ Requisição não encontrada.", fg=typer.colors.RED)
        raise typer.Exit(1)

    req   = res.data
    valor = req.get("valor_estimado") or 0

    typer.echo(f"\nRequisição : {req['titulo']}")
    typer.echo(f"Valor      : €{valor:,.2f}")
    typer.echo(f"Nível      : {req.get('nivel_aprovacao') or '—'}")
    typer.echo(f"Estado     : {req['estado']}")

    # Alerta extra para valores altos
    if valor > 50_000 and not force:
        typer.secho(f"\n⚠ Valor acima de €50.000 — requer aprovação de Diretoria.", fg=typer.colors.YELLOW)

    if not force:
        typer.confirm("\nConfirmar aprovação?", abort=True)

    from datetime import datetime
    db.table("requisicoes").update({
        "estado":       "aprovado",
        "aprovado_em":  datetime.utcnow().isoformat(),
    }).eq("id", requisicao_id).execute()

    typer.secho(f"\n✓ Requisição aprovada!", fg=typer.colors.GREEN)


@app.command()
def rejeitar(
    requisicao_id: str = typer.Argument(..., help="UUID da requisição"),
    motivo: str = typer.Option(..., "--motivo", "-m", prompt="Motivo da rejeição"),
):
    """
    Rejeita uma requisição de compra.

    Exemplo:
        python main.py compras rejeitar UUID_REQ --motivo "Preço acima do mercado"
    """
    db = get_db()
    db.table("requisicoes").update({
        "estado":          "rejeitado",
        "motivo_rejeicao": motivo,
    }).eq("id", requisicao_id).execute()

    typer.secho(f"✓ Requisição rejeitada. Motivo: {motivo}", fg=typer.colors.YELLOW)


@app.command()
def cotacoes(
    requisicao_id: str = typer.Argument(..., help="UUID da requisição"),
):
    """
    Mostra a tabela comparativa de cotações de uma requisição.

    Exemplo:
        python main.py compras cotacoes UUID_REQ
    """
    db  = get_db()
    res = db.table("cotacoes").select("*").eq("requisicao_id", requisicao_id).order("preco_total").execute()
    cots = res.data or []

    if not cots:
        typer.echo("Sem cotações para esta requisição.")
        return

    table = Table(title="Comparativo de cotações", box=box.ROUNDED, show_lines=True)
    table.add_column("#")
    table.add_column("Fornecedor", style="bold")
    table.add_column("Preço unit.", justify="right")
    table.add_column("Total",      justify="right")
    table.add_column("Prazo")
    table.add_column("Validade")
    table.add_column("PDF")
    table.add_column("Selecionada")

    for i, c in enumerate(cots, 1):
        total = f"€{c['preco_total']:,.2f}" if c.get("preco_total") else "—"
        unit  = f"€{c['preco_unitario']:,.4f}" if c.get("preco_unitario") else "—"
        # Melhor preço (primeiro após ordenar por preco_total)
        melhor = i == 1 and not c["selecionada"]
        total_r = f"[bold green]{total}[/bold green]" if melhor else total

        table.add_row(
            str(i),
            c["fornecedor"],
            unit,
            total_r,
            c.get("prazo_entrega") or "—",
            f"{c['validade_dias']}d" if c.get("validade_dias") else "—",
            "[blue]✓[/blue]" if c.get("pdf_url") else "—",
            "[green]✓ selecionada[/green]" if c["selecionada"] else "—",
        )

    console.print(table)
    if cots:
        console.print(f"\n[dim]Melhor preço: {cots[0]['fornecedor']} — €{cots[0].get('preco_total') or 0:,.2f}[/dim]")
