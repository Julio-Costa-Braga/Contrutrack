# cli/ponto.py
# ─────────────────────────────────────────────────────────────
# Módulo: Ponto Eletrónico
# Aprende aqui: typer.Typer(), @app.command(), Enum, tipos,
#               tabelas Rich, callbacks e ligação ao Supabase
# ─────────────────────────────────────────────────────────────
import typer
from enum import Enum
from datetime import datetime, date
from rich.console import Console
from rich.table import Table
from rich import box
from db import get_db

app     = typer.Typer(help="Comandos de ponto eletrónico")
console = Console()

# ── Conceito Typer 1: Enum → choices automáticos na CLI ──────
class TipoPonto(str, Enum):
    entrada = "entrada"
    saida   = "saida"

class EstadoPonto(str, Enum):
    valido         = "valido"
    fora_geofence  = "fora_geofence"
    sem_selfie     = "sem_selfie"
    manual         = "manual"


# ── Conceito Typer 2: @app.command() com tipos e opções ──────
@app.command()
def registar(
    funcionario_id: str = typer.Argument(..., help="UUID do funcionário"),
    obra_id:        str = typer.Argument(..., help="UUID da obra"),
    tipo:           TipoPonto = typer.Option(TipoPonto.entrada, "--tipo", "-t", help="Tipo de batida"),
    lat:            float = typer.Option(..., "--lat",  help="Latitude GPS"),
    lon:            float = typer.Option(..., "--lon",  help="Longitude GPS"),
    manual:         bool  = typer.Option(False, "--manual", help="Ponto coletivo pelo encarregado"),
):
    """
    Regista uma batida de ponto com coordenadas GPS.

    Exemplo:
        python main.py ponto registar UUID_FUNC UUID_OBRA --tipo entrada --lat 38.80 --lon -9.38
    """
    import math

    db = get_db()

    # Buscar geofence da obra
    res = db.table("obras").select("nome,latitude,longitude,raio_geofence").eq("id", obra_id).single().execute()
    obra = res.data
    if not obra:
        typer.secho("✗ Obra não encontrada.", fg=typer.colors.RED)
        raise typer.Exit(1)

    # Calcular distância (Haversine)
    R = 6371000
    lat1, lon1 = math.radians(lat), math.radians(lon)
    lat2, lon2 = math.radians(obra["latitude"] or 0), math.radians(obra["longitude"] or 0)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    distancia = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    dentro    = distancia <= (obra["raio_geofence"] or 100)

    estado = EstadoPonto.manual if manual else (
        EstadoPonto.fora_geofence if not dentro else EstadoPonto.valido
    )

    db.table("registos_ponto").insert({
        "funcionario_id":  funcionario_id,
        "obra_id":         obra_id,
        "tipo":            tipo.value,
        "estado":          estado.value,
        "data_hora":       datetime.utcnow().isoformat(),
        "latitude":        lat,
        "longitude":       lon,
        "dentro_geofence": dentro,
        "distancia_obra":  round(distancia, 1),
        "biometria_ok":    False,
    }).execute()

    cor = typer.colors.GREEN if dentro else typer.colors.YELLOW
    typer.secho(
        f"✓ Ponto [{tipo.value}] registado — {obra['nome']} "
        f"({'dentro' if dentro else 'FORA'} geofence, {distancia:.0f}m)",
        fg=cor
    )


# ── Conceito Typer 3: opção com default + Rich table ─────────
@app.command()
def listar(
    obra_id: str  = typer.Argument(..., help="UUID da obra"),
    data:    str  = typer.Option(date.today().isoformat(), "--data", "-d", help="Data (YYYY-MM-DD)"),
    so_anomalias: bool = typer.Option(False, "--anomalias", help="Mostrar apenas anomalias"),
):
    """
    Lista as presenças de uma obra numa data.

    Exemplo:
        python main.py ponto listar UUID_OBRA --data 2026-04-17
        python main.py ponto listar UUID_OBRA --anomalias
    """
    db     = get_db()
    inicio = f"{data}T00:00:00"
    fim    = f"{data}T23:59:59"

    res = (
        db.table("registos_ponto")
        .select("*, funcionarios(nome_completo)")
        .eq("obra_id", obra_id)
        .gte("data_hora", inicio)
        .lte("data_hora", fim)
        .order("data_hora")
        .execute()
    )
    registos = res.data or []

    if so_anomalias:
        registos = [r for r in registos if r["estado"] != "valido"]

    # ── Conceito Typer 4: Rich Table para output bonito ───────
    table = Table(title=f"Presenças — {data}", box=box.ROUNDED, show_lines=True)
    table.add_column("Funcionário",   style="bold")
    table.add_column("Hora")
    table.add_column("Tipo")
    table.add_column("Geofence")
    table.add_column("Selfie")
    table.add_column("Estado")

    for r in registos:
        hora    = r["data_hora"][11:16]
        nome    = (r.get("funcionarios") or {}).get("nome_completo", "—")
        geo     = "[green]✓[/green]" if r["dentro_geofence"] else "[red]✗ fora[/red]"
        selfie  = "[green]✓[/green]" if r["selfie_url"]      else "[yellow]—[/yellow]"
        estado_cor = {
            "valido":        "[green]válido[/green]",
            "fora_geofence": "[red]fora geofence[/red]",
            "sem_selfie":    "[yellow]sem selfie[/yellow]",
            "manual":        "[blue]manual[/blue]",
        }.get(r["estado"], r["estado"])

        table.add_row(nome, hora, r["tipo"], geo, selfie, estado_cor)

    console.print(table)
    console.print(f"[dim]Total: {len(registos)} registos[/dim]")


# ── Conceito Typer 5: confirmação interativa ─────────────────
@app.command()
def apagar(
    ponto_id: str  = typer.Argument(..., help="UUID do registo de ponto"),
    force:    bool = typer.Option(False, "--force", "-f", help="Sem confirmação"),
):
    """
    Apaga um registo de ponto (requer confirmação).

    Exemplo:
        python main.py ponto apagar UUID_PONTO
        python main.py ponto apagar UUID_PONTO --force
    """
    if not force:
        typer.confirm(f"Apagar registo {ponto_id}? Esta ação não pode ser desfeita.", abort=True)

    db = get_db()
    db.table("registos_ponto").delete().eq("id", ponto_id).execute()
    typer.secho(f"✓ Registo {ponto_id} apagado.", fg=typer.colors.GREEN)
