import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

async def main():
    html_path = Path(__file__).parent / 'acceso_template.html'
    pdf_path  = Path(__file__).parent / 'acceso_app_codigo_cuerpo.pdf'

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(f'file:///{html_path}', wait_until='networkidle')
        await page.pdf(
            path=str(pdf_path),
            format='A4',
            print_background=True,
            margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
        )
        await browser.close()
    print(f'PDF generado: {pdf_path}')

asyncio.run(main())
