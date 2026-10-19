"""
Vitrin sayfalarını ve yönetim girişini sunucudan açıp kapatır.

İki komut birbirinden bağımsızdır. Biri yönetimi ilgilendirir, diğeri
ana sayfa ve diğer vitrin sayfalarını. İkisi birlikte de kullanılabilir.

  python -m app.utils.site_gate login --kapat --mesaj "Giriş geçici olarak kapalı."
  python -m app.utils.site_gate login --ac

  python -m app.utils.site_gate pages --no-pages
  python -m app.utils.site_gate pages --page
  python -m app.utils.site_gate pages --page --yonetim
  python -m app.utils.site_gate pages --ac

  python -m app.utils.site_gate durum

Docker ile çalışan sunucuda, proje klasöründen:

  ./scripts/site-gate durum
"""

from __future__ import annotations

import argparse
import sys

from app.core.site_gate import GateState, clean_message, load_gate, save_gate


def main(argv: list[str] | None = None) -> int:
    parser = _parser()
    args = parser.parse_args(argv)
    try:
        if args.command == "login":
            state = _login(args)
        elif args.command == "pages":
            state = _pages(args)
        else:
            state = load_gate()
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(_format(state))
    return 0


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m app.utils.site_gate",
        description="Vitrin sayfalarını ve yönetim girişini açıp kapatır.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "örnekler:\n"
            "  login --kapat --mesaj \"Giriş geçici olarak kapalı.\"\n"
            "  login --ac\n"
            "  pages --no-pages\n"
            "  pages --page\n"
            "  pages --page --yonetim\n"
            "  pages --ac\n"
            "  durum"
        ),
    )
    commands = parser.add_subparsers(dest="command", required=True)

    login = commands.add_parser("login", help="Yönetim girişini açar veya kapatır.")
    login.add_argument("--kapat", action="store_true", help="Girişi kapat. Yazı, giriş kutusunun yerinde görünür.")
    login.add_argument("--ac", action="store_true", help="Girişi yeniden aç.")
    login.add_argument("--mesaj", "--message", dest="message", help="Giriş kapalıyken gösterilecek yazı.")

    pages = commands.add_parser("pages", help="Ana sayfa ve diğer vitrin sayfalarını değiştirir.")
    mode = pages.add_mutually_exclusive_group(required=True)
    mode.add_argument("--no-pages", action="store_true", help="Vitrin sayfalarını kapat. /admin açık kalır.")
    mode.add_argument("--page", action="store_true", help="Vitrin adreslerinde hazır sayfayı göster.")
    mode.add_argument("--ac", action="store_true", help="Vitrini normale döndür.")
    pages.add_argument(
        "--yonetim",
        action="store_true",
        help="Hazır sayfayı /admin adreslerinde de göster. Yalnızca --page ile geçerlidir.",
    )

    commands.add_parser("durum", help="Şu anki ayarı göster.")
    return parser


def _login(args: argparse.Namespace) -> GateState:
    if args.kapat == args.ac:
        raise ValueError("login için --kapat ya da --ac yaz.")
    current = load_gate()
    if args.ac:
        return save_gate(GateState(
            login_locked=False,
            login_message="",
            pages=current.pages,
            cover_admin=current.cover_admin,
        ))
    if not args.message:
        raise ValueError("Girişi kapatırken --mesaj yaz. Bu yazı giriş kutusunun yerinde durur.")
    try:
        message = clean_message(args.message)
    except ValueError as exc:
        if str(exc) == "long":
            raise ValueError("Mesaj 4000 karakterden kısa olmalı.") from exc
        raise ValueError("Mesaj boş olamaz.") from exc
    return save_gate(GateState(
        login_locked=True,
        login_message=message,
        pages=current.pages,
        cover_admin=current.cover_admin,
    ))


def _pages(args: argparse.Namespace) -> GateState:
    if args.yonetim and not args.page:
        raise ValueError("--yonetim yalnızca --page ile birlikte kullanılır.")
    current = load_gate()
    if args.ac or args.no_pages:
        pages = "open" if args.ac else "closed"
        return save_gate(GateState(
            login_locked=current.login_locked,
            login_message=current.login_message,
            pages=pages,
            cover_admin=False,
        ))
    return save_gate(GateState(
        login_locked=current.login_locked,
        login_message=current.login_message,
        pages="page",
        cover_admin=args.yonetim,
    ))


def _format(state: GateState) -> str:
    if state.login_locked:
        login = "kapalı"
    else:
        login = "açık"
    if state.pages == "closed":
        storefront = "kapalı (--no-pages)"
        admin = "açık (/admin)"
    elif state.pages == "page" and state.cover_admin:
        storefront = "hazır sayfa (--page)"
        admin = "hazır sayfa (--yonetim)"
    elif state.pages == "page":
        storefront = "hazır sayfa (--page)"
        admin = "açık (/admin)"
    else:
        storefront = "açık"
        admin = "açık (/admin)"
    lines = [
        f"Giriş     {login}",
        f"Vitrin    {storefront}",
        f"Yönetim   {admin}",
    ]
    if state.login_locked and state.login_message:
        lines.insert(1, f"Mesaj     {state.login_message}")
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
