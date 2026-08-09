# cli/rh.py
# ─────────────────────────────────────────────────────────────
# Módulo: RH e Onboarding
# Aprende aqui: typer.Option com callback de validação,
#               Progress bar Rich, typer.launch()
# ─────────────────────────────────────────────────────────────
import typer
from enum import Enum
from datetime import date, datetime
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import box
from db import get_db

app     = typer.Typer(help="Gestão de RH e onboarding")
console = Console()


class TipoDoc(str, Enum):
    atestado_medico     = "atestado_medico"
    certificado_manobra = "certificado_manobra"
    formacao_seguranca  = "formacao_seguranca"
    contrato_trabalho   = "contrato_trabalho"
    cartao_cidadao      = "cartao_cidadao"
    outro               = "outro"


@app.command()
def alertas_docs(
    dias:  int     = typer.Option(30, "--dias", "-d", help="Avisar documentos que expiram em N dias"),
    tipo:  TipoDoc | None = typer.Option(None, "--tipo", "-t", help="Filtrar por tipo de documento"),
    so_expirados: bool = typer.Option(False, "--expirados", help="Mostrar apenas vencidos"),
):
    """
    Lista documentos de funcionários a expirar ou já expirados.

    Exemplos:
        python main.py rh alertas-docs
        python main.py rh alertas-docs --dias 14
        python main.py rh alertas-docs --tipo atestado_medico --expirados
    """
    db    = get_db()
    hoje  = date.today()
    limite = str(hoje.replace(year=hoje.year + 1) if dias > 365
                 else hoje.__class__.fromordinal(hoje.toordinal() + dias))

    query = (
        db.table("documentos_funcionario")
        .select("*, funcionarios(nome_completo, nif)")
        .lte("data_validade", limite)
        .order("data_validade")
    )
    if tipo:
        query = query.eq("tipo", tipo.value)

    res     = query.execute()
    docs    = res.data or []
    hoje_s  = str(hoje)

    if so_expirados:
        docs = [d for d in docs if d["data_validade"] and d["data_validade"] < hoje_s]

    if not docs:
        typer.secho("✓ Sem documentos a expirar no período indicado.", fg=typer.colors.GREEN)
        return

    table = Table(title=f"Documentos a expirar (próximos {dias} dias)", box=box.ROUNDED, show_lines=True)
    table.add_column("Funcionário",   style="bold")
    table.add_column("NIF")
    table.add_column("Documento")
    table.add_column("Validade")
    table.add_column("Estado")

    for d in docs:
        func    = d.get("funcionarios") or {}
        validade = d.get("data_validade") or "—"
        if validade < hoje_s:
            estado = "[bold red]VENCIDO[/bold red]"
        elif validade < str(hoje.__class__.fromordinal(hoje.toordinal() + 7)):
            estado = "[bold yellow]URGENTE (7 dias)[/bold yellow]"
        else:
            estado = "[yellow]a expirar[/yellow]"

        nif = func.get("nif") or "—"
        nif_masked = nif[:6] + "***" if len(nif) > 6 else nif

        table.add_row(
            func.get("nome_completo", "—"),
            nif_masked,
            d.get("nome", d.get("tipo", "—")),
            validade,
            estado,
        )

    console.print(table)


@app.command()
def criar_funcionario(
    nome:    str = typer.Option(..., "--nome",    "-n", prompt="Nome completo"),
    nif:     str = typer.Option(..., "--nif",           prompt="NIF"),
    niss:    str = typer.Option("",  "--niss",          prompt="NISS (Enter para ignorar)"),
    email:   str = typer.Option("",  "--email",   "-e", prompt="Email (Enter para ignorar)"),
    cargo:   str = typer.Option("",  "--cargo",   "-c", prompt="Cargo (Enter para ignorar)"),
    admissao:str = typer.Option(str(date.today()), "--admissao", prompt="Data admissão (YYYY-MM-DD)"),
):
    """
    Cria um novo funcionário com dossiê digital automático.

    Exemplo:
        python main.py rh criar-funcionario
        python main.py rh criar-funcionario --nome "João Silva" --nif 123456789
    """
    # ── Conceito: callback de validação ─────────────────────
    if len(nif.replace(" ", "")) != 9 or not nif.replace(" ", "").isdigit():
        typer.secho("✗ NIF inválido. Deve ter 9 dígitos.", fg=typer.colors.RED)
        raise typer.Exit(1)

    # Gerar path do dossiê: NOME_APELIDO_NIF
    nome_slug   = nome.upper().replace(" ", "_")
    dossie_path = f"{nome_slug}_{nif}/"

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  transient=True) as progress:
        progress.add_task("A criar funcionário e dossiê...", total=None)

        db = get_db()
        try:
            res = db.table("funcionarios").insert({
                "nome_completo": nome,
                "nif":          nif,
                "niss":         niss or None,
                "email":        email or None,
                "cargo":        cargo or None,
                "data_admissao": admissao,
                "dossie_path":  dossie_path,
                "ativo":        True,
            }).execute()
        except Exception as e:
            typer.secho(f"✗ Erro: {e}", fg=typer.colors.RED)
            raise typer.Exit(1)

    func_id = res.data[0]["id"]
    typer.secho(f"\n✓ Funcionário criado!", fg=typer.colors.GREEN)
    typer.echo(f"  ID:      {func_id}")
    typer.echo(f"  Dossiê:  {dossie_path}")


@app.command()
def link_onboarding(
    nome:  str = typer.Option(..., "--nome",  "-n", prompt="Nome do candidato"),
    email: str = typer.Option(..., "--email", "-e", prompt="Email do candidato"),
):
    """
    Cria um link de onboarding para um candidato.

    Exemplo:
        python main.py rh link-onboarding --nome "João Silva" --email joao@email.com
    """
    import os
    db  = get_db()
    res = db.table("onboarding_links").insert({
        "nome_candidato":  nome,
        "email_candidato": email,
    }).execute()

    token    = res.data[0]["token"]
    site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://construtrack.vercel.app")
    link     = f"{site_url}/onboarding/{token}"

    typer.secho(f"\n✓ Link criado para {nome}:", fg=typer.colors.GREEN)
    typer.echo(f"\n  {link}\n")
    typer.echo("  Válido por 7 dias. Copie e envie ao candidato.")

    # Abrir no browser se disponível
    if typer.confirm("Abrir no browser?", default=False):
        typer.launch(link)


@app.command()
def listar(
    ativo: bool = typer.Option(True, "--ativo/--todos", help="Mostrar apenas ativos"),
):
    """
    Lista funcionários com estado dos documentos.

    Exemplos:
        python main.py rh listar
        python main.py rh listar --todos
    """
    db  = get_db()
    query = db.table("funcionarios").select("*")
    if ativo:
        query = query.eq("ativo", True)
    res = query.order("nome_completo").execute()

    table = Table(title="Funcionários", box=box.ROUNDED, show_lines=True)
    table.add_column("Nome",       style="bold")
    table.add_column("NIF")
    table.add_column("Cargo")
    table.add_column("Admissão")
    table.add_column("Dossiê")
    table.add_column("Ativo")

    for f in (res.data or []):
        nif = f.get("nif") or "—"
        nif_m = nif[:6]+"***" if len(nif) > 6 else nif
        table.add_row(
            f["nome_completo"],
            nif_m,
            f.get("cargo") or "—",
            f.get("data_admissao") or "—",
            "[green]✓[/green]" if f.get("dossie_path") else "[yellow]pendente[/yellow]",
            "[green]sim[/green]" if f["ativo"] else "[red]não[/red]",
        )

    console.print(table)
    console.print(f"[dim]Total: {len(res.data or [])} funcionários[/dim]")
